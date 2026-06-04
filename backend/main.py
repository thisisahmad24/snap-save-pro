from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, validator
import os
import re
import time
import logging
from datetime import date, datetime, timezone
from collections import defaultdict
from dotenv import load_dotenv
from utils.extractor import extract_media_info
from typing import Optional

# TODO: Add MongoDB imports once connection is set up
# from pymongo import MongoClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="SnapSave Pro API", version="1.0.0")

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
    # TODO: Replace with MongoDB query
    # profile = profiles_collection.find_one({"_id": user_id})
    # if not profile:
    #     return True  # new user — allow
    # if profile.get("is_pro"):
    #     return True
    # today = str(date.today())
    # if profile.get("last_reset_date") != today:
    #     profiles_collection.update_one(
    #         {"_id": user_id},
    #         {"$set": {"download_count_ig": 0, "download_count_yt": 0, "last_reset_date": today}}
    #     )
    #     return True
    # if platform == "instagram" and profile.get("download_count_ig", 0) >= IG_DAILY_LIMIT:
    #     return False
    # return True

    # Fallback: allow all downloads until MongoDB is configured
    return True

def increment_user_quota(user_id: str, platform: str):
    """Safely increments the appropriate counter.
    TODO: Replace with MongoDB update once connection is configured.
    """
    # field = "download_count_ig" if platform == "instagram" else "download_count_yt"
    # profiles_collection.update_one(
    #     {"_id": user_id},
    #     {"$inc": {field: 1}, "$set": {"last_reset_date": str(date.today())}}
    # )
    pass

# ─────────────────────────────────────────────
# Request model with URL validation
# ─────────────────────────────────────────────
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


@app.get("/api/v1/media-query", tags=["Downloader"])
async def extract_get_info():
    return {"status": "error", "message": "Please use POST method for extraction."}

@app.post("/api/v1/media-query", tags=["Downloader"])
async def extract_media(
    request_data: ExtractRequest,
    request: Request
):
    try:
        target_url = request_data.url
        user_id = request_data.userId
        
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
                
        return result

    except Exception as e:
        logger.error(f"Endpoint error: {e}")
        return {"success": False, "error": f"Internal Server Error: {str(e)[:50]}"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
