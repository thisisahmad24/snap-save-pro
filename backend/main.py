from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, validator
import os
import re
import time
from datetime import date, datetime, timezone
from collections import defaultdict
from dotenv import load_dotenv
from utils.extractor import extract_media_info
from supabase import create_client, Client
from typing import Optional

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
# Supabase
# ─────────────────────────────────────────────
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

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
YT_DAILY_LIMIT = 3

def _get_platform(url: str) -> str:
    if "instagram.com" in url:
        return "instagram"
    if "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    return "unknown"

def check_user_quota(user_id: str, platform: str) -> bool:
    """Returns True if user is allowed to download, False if limit reached."""
    try:
        resp = supabase.table("profiles").select(
            "is_pro, download_count_ig, download_count_yt, last_reset_date"
        ).eq("id", user_id).single().execute()

        if not resp.data:
            return True  # new user — allow
            
        profile = resp.data
    except Exception as e:
        logger.error(f"Supabase Quota Check Error (Database might be paused): {e}")
        return True # Fallback: allow download if DB is down

    # Pro users have no limits
    if profile.get("is_pro"):
        return True

    # ── Daily reset ─────────────────────────────
    today = str(date.today())
    last_reset = profile.get("last_reset_date", "")
    if last_reset != today:
        # Reset counters for a new day
        supabase.table("profiles").update({
            "download_count_ig": 0,
            "download_count_yt": 0,
            "last_reset_date": today
        }).eq("id", user_id).execute()
        return True  # after reset, quota is fresh

    count_ig = profile.get("download_count_ig", 0)
    count_yt = profile.get("download_count_yt", 0)

    if platform == "instagram" and count_ig >= IG_DAILY_LIMIT:
        return False
    if platform == "youtube" and count_yt >= YT_DAILY_LIMIT:
        return False

    return True

def increment_user_quota(user_id: str, platform: str):
    """Safely increments the appropriate counter using a fetch-then-update.
    For production atomicity, replace with a Supabase RPC (see schema.sql).
    """
    field = "download_count_ig" if platform == "instagram" else "download_count_yt"
    today = str(date.today())

    resp = supabase.table("profiles").select(
        f"{field}, last_reset_date"
    ).eq("id", user_id).single().execute()

    if not resp.data:
        return

    last_reset = resp.data.get("last_reset_date", "")
    current = resp.data.get(field, 0)

    # Guard: if reset happened between check and increment, start from 1
    if last_reset != today:
        new_val = 1
        supabase.table("profiles").update({
            field: new_val,
            "download_count_ig": 0 if field != "download_count_ig" else new_val,
            "download_count_yt": 0 if field != "download_count_yt" else new_val,
            "last_reset_date": today
        }).eq("id", user_id).execute()
    else:
        supabase.table("profiles").update(
            {field: current + 1}
        ).eq("id", user_id).execute()

# ─────────────────────────────────────────────
# Request model with URL validation
# ─────────────────────────────────────────────
SUPPORTED_DOMAINS = re.compile(
    r"(instagram\.com|youtube\.com|youtu\.be)", re.IGNORECASE
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
        "supabase": "connected" if supabase else "disconnected"
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
                limit = IG_DAILY_LIMIT if platform == "instagram" else YT_DAILY_LIMIT
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
