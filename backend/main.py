from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import os
import re
import logging
from datetime import date, datetime, timezone
from collections import defaultdict
from dotenv import load_dotenv
from utils.extractor import extract_media_info
from utils.mongo import get_collection, ensure_indexes, utc_now
from utils.payments import plan_title, quote_price
from utils.security import create_access_token, decode_access_token, hash_password, verify_password
from bson import ObjectId
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="SnapSave Pro API", version="1.0.0")


def _serialize_user(document: dict) -> dict:
    return {
        "id": str(document.get("_id")),
        "email": document.get("email"),
        "full_name": document.get("full_name", ""),
        "username": document.get("username", ""),
        "country": document.get("country", ""),
        "avatar_url": document.get("avatar_url", ""),
        "is_pro": document.get("is_pro", False),
        "plan": document.get("plan", "free"),
        "download_count_ig": document.get("download_count_ig", 0),
        "download_count_yt": document.get("download_count_yt", 0),
        "download_count_total": document.get("download_count_total", 0),
        "last_reset_date": document.get("last_reset_date"),
        "created_at": document.get("created_at"),
    }


def _get_user_collection():
    return get_collection("users")


def _get_download_collection():
    return get_collection("downloads")


def _get_transactions_collection():
    return get_collection("transactions")


def _get_current_user(authorization: Optional[str]) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)
    except Exception:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    users = _get_user_collection()
    if users is None:
        return None

    try:
        object_id = ObjectId(user_id)
    except Exception:
        return None

    user = users.find_one({"_id": object_id})
    if not user:
        return None
    return user


def _maybe_reset_user_quota(user: dict) -> dict:
    today = str(date.today())
    if user.get("last_reset_date") != today:
        users = _get_user_collection()
        if users is not None:
            users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "download_count_ig": 0,
                        "download_count_yt": 0,
                        "download_count_total": 0,
                        "last_reset_date": today,
                    }
                },
            )
            user["download_count_ig"] = 0
            user["download_count_yt"] = 0
            user["download_count_total"] = 0
            user["last_reset_date"] = today
    return user

# ─────────────────────────────────────────────
# CORS — allow frontend (localhost:3000 + prod)
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins
    allow_credentials=False, # Must be False if using ["*"] in modern browsers
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# MongoDB (TODO: configure connection)
# ─────────────────────────────────────────────
# MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
# mongo_client = MongoClient(MONGO_URI)
# db = mongo_client["snapsave"]
# profiles_collection = db["profiles"]

# ─────────────────────────────────────────────
# Guest IP rate limiting (in-memory)
# Limit: 3 downloads per IP per day
# ─────────────────────────────────────────────
GUEST_DAILY_LIMIT = 3
_guest_tracker: dict = defaultdict(lambda: {"count": 0, "date": str(date.today())})

def check_guest_quota(ip: str) -> bool:
    record = _guest_tracker[ip]
    today = str(date.today())
    # Reset on new day
    if record["date"] != today:
        _guest_tracker[ip] = {"count": 0, "date": today}
    return _guest_tracker[ip]["count"] < GUEST_DAILY_LIMIT

def increment_guest_quota(ip: str):
    today = str(date.today())
    if _guest_tracker[ip]["date"] != today:
        _guest_tracker[ip] = {"count": 0, "date": today}
    _guest_tracker[ip]["count"] += 1

# ─────────────────────────────────────────────
# Authenticated user quota helpers
# ─────────────────────────────────────────────
IG_DAILY_LIMIT = 5

def _get_platform(url: str) -> str:
    if "instagram.com" in url:
        return "instagram"
    if "youtu.be" in url or "youtube.com" in url:
        return "youtube"
    return "unknown"

def check_user_quota(user_id: str, platform: str) -> bool:
    """Returns True if user is allowed to download, False if limit reached."""
    users = _get_user_collection()
    if users is None:
        return True

    try:
        object_id = ObjectId(user_id)
    except Exception:
        return True

    user = users.find_one({"_id": object_id})
    if not user:
        return True

    user = _maybe_reset_user_quota(user)
    if user.get("is_pro"):
        return True

    platform_limit = IG_DAILY_LIMIT if platform == "instagram" else 3
    if platform == "instagram":
        return user.get("download_count_ig", 0) < platform_limit
    if platform == "youtube":
        return user.get("download_count_yt", 0) < platform_limit
    return user.get("download_count_total", 0) < platform_limit

def increment_user_quota(user_id: str, platform: str):
    """Safely increments the appropriate counter.
    """
    users = _get_user_collection()
    if users is None:
        return

    field = "download_count_ig" if platform == "instagram" else "download_count_yt"
    try:
        object_id = ObjectId(user_id)
    except Exception:
        return
    users.update_one(
        {"_id": object_id},
        {
            "$inc": {field: 1, "download_count_total": 1},
            "$set": {"last_reset_date": str(date.today())},
        },
    )

# ─────────────────────────────────────────────
# Request model with URL validation
# ─────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    username: str
    plan: str = "free"


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None


class UpgradeRequest(BaseModel):
    plan: str = "pro"
    transaction_id: str


class PaymentQuoteRequest(BaseModel):
    plan: str = "single"
    country: Optional[str] = None
    region: Optional[str] = None


class PaymentSessionRequest(PaymentQuoteRequest):
    redirect_base_url: Optional[str] = None


class PaymentConfirmRequest(BaseModel):
    session_id: str


SUPPORTED_DOMAINS = re.compile(
    r"(instagram\.com|youtu\.be|youtube\.com)", re.IGNORECASE
)

class ExtractRequest(BaseModel):
    url: str
    userId: Optional[str] = None

    @validator("url")
    def url_must_be_supported(cls, v):
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        if not SUPPORTED_DOMAINS.search(v):
            raise ValueError(
                "Only Instagram and YouTube URLs are supported."
            )
        return v

# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "SnapSave Pro API is running", "version": "1.0.0"}

@app.get("/api/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "mongodb (pending configuration)"
    }


@app.on_event("startup")
async def startup_event():
    try:
        ensure_indexes()
    except Exception as exc:
        logger.warning(f"MongoDB index initialization skipped: {exc}")


@app.post("/api/auth/register", tags=["Auth"])
async def register_user(payload: RegisterRequest):
    users = _get_user_collection()
    if users is None:
        return {"success": False, "error": "MongoDB is not configured."}

    email = payload.email.strip().lower()
    username = payload.username.strip()
    if users.find_one({"email": email}):
        return {"success": False, "error": "Email is already registered."}
    if users.find_one({"username": username}):
        return {"success": False, "error": "Username is already taken."}

    plan = payload.plan.strip().lower()
    is_pro = plan in {"pro", "enterprise"}
    user_doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name.strip(),
        "username": username,
        "country": "",
        "avatar_url": "",
        "plan": plan,
        "is_pro": is_pro,
        "download_count_ig": 0,
        "download_count_yt": 0,
        "download_count_total": 0,
        "last_reset_date": str(date.today()),
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }

    result = users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    token = create_access_token(str(result.inserted_id), email)
    return {"success": True, "token": token, "user": _serialize_user(user_doc)}


@app.post("/api/auth/login", tags=["Auth"])
async def login_user(payload: LoginRequest):
    users = _get_user_collection()
    if users is None:
        return {"success": False, "error": "MongoDB is not configured."}

    user = users.find_one({"email": payload.email.strip().lower()})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        return {"success": False, "error": "Invalid email or password."}

    token = create_access_token(str(user["_id"]), user["email"])
    return {"success": True, "token": token, "user": _serialize_user(user)}


@app.get("/api/auth/me", tags=["Auth"])
async def get_current_profile(authorization: Optional[str] = Header(default=None)):
    user = _get_current_user(authorization)
    if not user:
        return {"success": False, "error": "Unauthorized"}
    return {"success": True, "user": _serialize_user(user)}


@app.put("/api/auth/profile", tags=["Auth"])
async def update_profile(payload: ProfileUpdateRequest, authorization: Optional[str] = Header(default=None)):
    users = _get_user_collection()
    if users is None:
        return {"success": False, "error": "MongoDB is not configured."}

    user = _get_current_user(authorization)
    if not user:
        return {"success": False, "error": "Unauthorized"}
    if not user.get("is_pro"):
        return {"success": False, "error": "Only Pro users can edit their profile details."}

    update_data = {
        "updated_at": utc_now(),
    }
    if payload.full_name is not None:
        update_data["full_name"] = payload.full_name.strip()
    if payload.username is not None:
        username = payload.username.strip()
        if username != user.get("username") and users.find_one({"username": username, "_id": {"$ne": user["_id"]}}):
            return {"success": False, "error": "Username is already taken."}
        update_data["username"] = username
    if payload.country is not None:
        update_data["country"] = payload.country.strip()
    if payload.avatar_url is not None:
        update_data["avatar_url"] = payload.avatar_url.strip()

    users.update_one({"_id": user["_id"]}, {"$set": update_data})
    updated_user = users.find_one({"_id": user["_id"]})
    return {"success": True, "user": _serialize_user(updated_user)}


@app.post("/api/auth/upgrade", tags=["Auth"])
async def upgrade_account(payload: UpgradeRequest, authorization: Optional[str] = Header(default=None)):
    users = _get_user_collection()
    transactions = _get_transactions_collection()
    if users is None:
        return {"success": False, "error": "MongoDB is not configured."}

    user = _get_current_user(authorization)
    if not user:
        return {"success": False, "error": "Unauthorized"}

    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_pro": True,
                "plan": payload.plan,
                "last_upgrade_at": utc_now(),
                "updated_at": utc_now(),
            }
        },
    )

    if transactions is not None:
        transactions.insert_one(
            {
                "user_id": user["_id"],
                "plan": payload.plan,
                "transaction_id": payload.transaction_id,
                "status": "approved",
                "created_at": utc_now(),
            }
        )

    updated_user = users.find_one({"_id": user["_id"]})
    return {"success": True, "user": _serialize_user(updated_user)}


@app.get("/api/auth/me/downloads", tags=["Auth"])
async def get_my_downloads(authorization: Optional[str] = Header(default=None)):
    downloads = _get_download_collection()
    user = _get_current_user(authorization)
    if not user:
        return {"success": False, "error": "Unauthorized"}
    if downloads is None:
        return {"success": True, "downloads": []}

    cursor = downloads.find({"user_id": user["_id"]}).sort("created_at", -1).limit(5)
    items = []
    for item in cursor:
        items.append({
            "title": item.get("title", "download"),
            "thumbnail": item.get("thumbnail", ""),
            "download_url": item.get("download_url", ""),
            "platform": item.get("platform", ""),
            "ext": item.get("ext", "mp4"),
            "created_at": item.get("created_at"),
        })
    return {"success": True, "downloads": items}


@app.post("/api/payments/quote", tags=["Payments"])
async def payment_quote(payload: PaymentQuoteRequest):
    quote = quote_price(payload.plan, payload.country, payload.region)
    return {
        "success": True,
        "plan": quote.plan,
        "title": plan_title(quote.plan),
        "country": quote.country,
        "region": quote.region,
        "currency": quote.currency,
        "amount_major": quote.amount_major,
        "amount_minor": quote.amount_minor,
        "display_price": quote.display_price,
    }


@app.post("/api/payments/create-session", tags=["Payments"])
async def create_payment_session(
    payload: PaymentSessionRequest,
    authorization: Optional[str] = Header(default=None),
):
    try:
        current_user = _get_current_user(authorization)
        if not current_user:
            return {"success": False, "error": "Unauthorized"}

        stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        if not stripe_secret_key:
            return {"success": False, "error": "Stripe is not configured."}

        try:
            import stripe
        except Exception:
            return {"success": False, "error": "Stripe library is missing from the backend environment."}

        stripe.api_key = stripe_secret_key
        quote = quote_price(payload.plan, payload.country, payload.region)
        redirect_base_url = (payload.redirect_base_url or os.getenv("APP_URL") or "").rstrip("/")
        if not redirect_base_url:
            return {"success": False, "error": "Missing redirect URL."}

        success_url = (
            f"{redirect_base_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
            f"&plan={quote.plan}"
        )
        cancel_url = (
            f"{redirect_base_url}/checkout?plan={quote.plan}"
            f"&country={quote.country}&region={quote.region}"
        )

        session = stripe.checkout.Session.create(
            mode="payment",
            client_reference_id=str(current_user["_id"]),
            success_url=success_url,
            cancel_url=cancel_url,
            line_items=[
                {
                    "price_data": {
                        "currency": quote.currency.lower(),
                        "product_data": {
                            "name": plan_title(quote.plan),
                            "description": f"Regional checkout for {quote.country} / {quote.region}",
                        },
                        "unit_amount": quote.amount_minor,
                    },
                    "quantity": 1,
                }
            ],
            metadata={
                "user_id": str(current_user["_id"]),
                "plan": quote.plan,
                "country": quote.country,
                "region": quote.region,
            },
        )

        transactions = _get_transactions_collection()
        if transactions is not None:
            transactions.insert_one(
                {
                    "user_id": current_user["_id"],
                    "plan": quote.plan,
                    "country": quote.country,
                    "region": quote.region,
                    "currency": quote.currency,
                    "amount_minor": quote.amount_minor,
                    "display_price": quote.display_price,
                    "provider": "stripe",
                    "stripe_session_id": session.id,
                    "status": "pending",
                    "created_at": utc_now(),
                    "updated_at": utc_now(),
                }
            )

        return {
            "success": True,
            "session_id": session.id,
            "url": session.url,
            "display_price": quote.display_price,
            "currency": quote.currency,
            "amount_minor": quote.amount_minor,
            "plan": quote.plan,
        }
    except Exception as exc:
        logger.error(f"Create payment session error: {exc}")
        return {"success": False, "error": "Could not create checkout session."}


@app.post("/api/payments/confirm", tags=["Payments"])
async def confirm_payment(
    payload: PaymentConfirmRequest,
    authorization: Optional[str] = Header(default=None),
):
    try:
        current_user = _get_current_user(authorization)
        if not current_user:
            return {"success": False, "error": "Unauthorized"}

        stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        if not stripe_secret_key:
            return {"success": False, "error": "Stripe is not configured."}

        try:
            import stripe
        except Exception:
            return {"success": False, "error": "Stripe library is missing from the backend environment."}

        stripe.api_key = stripe_secret_key
        session = stripe.checkout.Session.retrieve(payload.session_id)
        if not session:
            return {"success": False, "error": "Payment session not found."}

        if session.payment_status != "paid":
            return {"success": False, "error": "Payment has not completed yet."}

        metadata = session.metadata or {}
        plan = metadata.get("plan", "single")
        transactions = _get_transactions_collection()
        users = _get_user_collection()

        if transactions is not None:
            transactions.update_one(
                {"stripe_session_id": session.id},
                {
                    "$set": {
                        "status": "paid",
                        "paid_at": utc_now(),
                        "updated_at": utc_now(),
                        "stripe_payment_intent": getattr(session, "payment_intent", None),
                    }
                },
            )

        upgraded_user = None
        if plan == "pro" and users is not None:
            users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "is_pro": True,
                        "plan": "pro",
                        "last_upgrade_at": utc_now(),
                        "updated_at": utc_now(),
                    }
                },
            )
            upgraded_user = users.find_one({"_id": current_user["_id"]})

        if transactions is not None:
            transactions.update_one(
                {"stripe_session_id": session.id},
                {
                    "$set": {
                        "status": "fulfilled",
                        "updated_at": utc_now(),
                    }
                },
            )

        return {
            "success": True,
            "session_id": session.id,
            "plan": plan,
            "user": _serialize_user(upgraded_user or current_user),
        }
    except Exception as exc:
        logger.error(f"Confirm payment error: {exc}")
        return {"success": False, "error": "Could not confirm payment."}


@app.get("/api/v1/media-query", tags=["Downloader"])
async def extract_get_info():
    return {"status": "error", "message": "Please use POST method for extraction."}

@app.post("/api/v1/media-query", tags=["Downloader"])
async def extract_media(
    request_data: ExtractRequest,
    request: Request,
    authorization: Optional[str] = Header(default=None)
):
    try:
        target_url = request_data.url
        user_id = request_data.userId
        current_user = _get_current_user(authorization)
        if current_user:
            user_id = str(current_user["_id"])
        
        platform = _get_platform(target_url)
        client_ip = request.client.host if request.client else "unknown"

        # ── Quota check ──────────────────────────
        if user_id:
            if not check_user_quota(user_id, platform):
                return {"success": False, "error": f"Daily limit reached. Upgrade to PRO."}
        else:
            if not check_guest_quota(client_ip):
                return {"success": False, "error": "Guest limit reached. Please log in."}

        # ── Extraction ───────────────────────────
        result = extract_media_info(target_url)
        
        if result.get("success"):
            # Update quota after successful extraction
            if user_id:
                increment_user_quota(user_id, platform)
            else:
                increment_guest_quota(client_ip)

            downloads = _get_download_collection()
            if downloads is not None and user_id:
                downloads.insert_one(
                    {
                        "user_id": ObjectId(user_id),
                        "platform": platform,
                        "title": result.get("title", "download"),
                        "thumbnail": result.get("thumbnail", ""),
                        "download_url": result.get("download_url", ""),
                        "ext": result.get("ext", "mp4"),
                        "source_url": target_url,
                        "client_ip": client_ip,
                        "created_at": utc_now(),
                    }
                )
                
        return result

    except Exception as e:
        logger.error(f"Endpoint error: {e}")
        return {"success": False, "error": f"Internal Server Error: {str(e)[:50]}"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
