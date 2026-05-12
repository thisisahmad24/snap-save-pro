import yt_dlp
import logging
import httpx
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _fallback_public_api(url: str) -> dict:
    # Updated 2024 list of working public instances
    public_instances = [
        "https://cobalt.v-0.icu/api/json",
        "https://api.cobalt.tools/api/json", # Try official again just in case
        "https://cobalt.shithouse.tv/api/json",
    ]
    
    for instance in public_instances:
        try:
            logger.info(f"Trying public fallback instance: {instance}")
            with httpx.Client(timeout=20, verify=False) as client:
                # Use v10 API structure for newer instances
                response = client.post(
                    instance, 
                    json={"url": url, "videoQuality": "720"}, 
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    }
                )
            
            if response.status_code == 200:
                data = response.json()
                download_url = data.get("url") or data.get("stream")
                if download_url:
                    return {
                        "success": True,
                        "title": "Social Media Content",
                        "thumbnail": "",
                        "download_url": download_url,
                        "platform": "social",
                        "ext": "mp4"
                    }
        except Exception as e:
            logger.error(f"Public instance {instance} failed: {e}")
            continue
            
    return {"success": False, "error": "All extraction methods failed. Please try a different link."}


def _fallback_instagram_rapidapi(url: str) -> dict:
    rapid_key = os.getenv("RAPIDAPI_KEY")
    if not rapid_key:
        return {"success": False, "error": "RapidAPI key not configured."}
    
    api_url = "https://instagram-scraper-api2.p.rapidapi.com/v1/post_info"
    querystring = {"code_or_id_or_url": url, "include_insights": "false"}
    headers = {
        "X-RapidAPI-Key": rapid_key,
        "X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
    }

    try:
        with httpx.Client(timeout=15) as client:
            response = client.get(api_url, headers=headers, params=querystring)
        data = response.json()
        
        if "data" in data and "items" in data["data"] and len(data["data"]["items"]) > 0:
            item = data["data"]["items"][0]
            video_versions = item.get("video_versions", [])
            download_url = video_versions[0].get("url", "") if video_versions else ""
            
            if not download_url:
                image_versions = item.get("image_versions2", {}).get("candidates", [])
                if image_versions:
                    download_url = image_versions[0].get("url", "")
            
            if download_url:
                caption = item.get("caption", {})
                title = caption.get("text", "Instagram Content") if caption else "Instagram Content"
                thumbnail = ""
                image_versions = item.get("image_versions2", {}).get("candidates", [])
                if image_versions:
                    thumbnail = image_versions[0].get("url", "")
                
                return {
                    "success": True,
                    "title": title[:50] + "..." if len(title) > 50 else title,
                    "thumbnail": thumbnail,
                    "download_url": download_url,
                    "platform": "instagram",
                    "ext": "mp4" if video_versions else "jpg"
                }
                
        return {"success": False, "error": data.get("message", "Could not fetch Instagram data from fallback API.")}
    except Exception as e:
        logger.error(f"RapidAPI fallback error: {e}")
        return {"success": False, "error": "Fallback API failed."}



def _best_format_url(info: dict) -> str | None:
    """
    Pick the best direct download URL from the extracted info.
    Priority: mp4 video → best available format → top-level url
    """
    formats = info.get("formats", [])

    # 1. Prefer mp4 with both video+audio
    mp4_formats = [
        f for f in formats
        if f.get("ext") == "mp4"
        and f.get("vcodec") != "none"
        and f.get("acodec") != "none"
        and f.get("url")
    ]
    if mp4_formats:
        # Pick highest resolution mp4
        mp4_formats.sort(key=lambda f: f.get("height") or 0, reverse=True)
        return mp4_formats[0]["url"]

    # 2. Any format with both video+audio
    av_formats = [
        f for f in formats
        if f.get("vcodec") != "none"
        and f.get("acodec") != "none"
        and f.get("url")
    ]
    if av_formats:
        av_formats.sort(key=lambda f: f.get("height") or 0, reverse=True)
        return av_formats[0]["url"]

    # 3. Fallback: last format (usually highest quality available)
    if formats:
        for f in reversed(formats):
            if f.get("url"):
                return f["url"]

    # 4. Top-level url (Instagram direct links, etc.)
    return info.get("url")


def extract_media_info(url: str) -> dict:
    """
    Extracts media info from Instagram or YouTube using yt-dlp.
    Returns a standardised dict with title, thumbnail, download_url, platform etc.
    """
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "socket_timeout": 20,
        "extractor_args": {
            "youtube": {
                "player_client": ["web", "mweb", "ios"],
                "player_skip": ["webpage", "configs"]
            }
        }
    }



    # Use cookies if provided in environment variables to bypass login walls
    cookie_file = None
    ig_cookies = os.getenv("INSTAGRAM_COOKIES")
    yt_cookies = os.getenv("YOUTUBE_COOKIES")
    
    selected_cookies = None
    if "instagram.com" in url.lower():
        selected_cookies = ig_cookies
    elif "youtube.com" in url.lower() or "youtu.be" in url.lower():
        selected_cookies = yt_cookies

    if selected_cookies:
        import tempfile
        # Create a temporary file to store cookies for yt-dlp
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write(selected_cookies)
            cookie_file = f.name
        ydl_opts["cookiefile"] = cookie_file

    # Clean the URL to remove tracking parameters which often break Instagram extraction
    if "instagram.com" in url.lower():
        url = url.split("?")[0]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Clean up cookie file after extraction
            if cookie_file and os.path.exists(cookie_file):
                os.remove(cookie_file)


            download_url = _best_format_url(info)

            if not download_url:
                return {
                    "success": False,
                    "error": "Could not find a downloadable media URL for this link."
                }

            # Best thumbnail: prefer highest resolution
            thumbnail = info.get("thumbnail", "")
            thumbnails = info.get("thumbnails", [])
            if thumbnails:
                sorted_thumbs = sorted(
                    [t for t in thumbnails if t.get("url")],
                    key=lambda t: (t.get("width") or 0) * (t.get("height") or 0),
                    reverse=True
                )
                if sorted_thumbs:
                    thumbnail = sorted_thumbs[0]["url"]

            platform = info.get("extractor_key", "unknown").lower()
            # Normalize platform names
            if "instagram" in platform:
                platform = "instagram"
            elif "youtube" in platform:
                platform = "youtube"

            return {
                "success": True,
                "title": info.get("title") or "Untitled",
                "thumbnail": thumbnail,
                "download_url": download_url,
                "platform": platform,
                "duration": info.get("duration"),
                "ext": info.get("ext", "mp4"),
                "uploader": info.get("uploader") or info.get("channel"),
                "view_count": info.get("view_count"),
            }

    except yt_dlp.utils.DownloadError as e:
        err = str(e)
        logger.error(f"yt-dlp DownloadError for {url}: {err}")
        
        # Try Public API Fallback if yt-dlp is blocked
        logger.info(f"yt-dlp blocked. Attempting Public API fallback...")
        public_res = _fallback_public_api(url)
        if public_res.get("success"):
            return public_res

        if "private" in err.lower() or "login" in err.lower():
            return {"success": False, "error": "This content is private or requires login."}


    except yt_dlp.utils.ExtractorError as e:
        logger.error(f"yt-dlp ExtractorError for {url}: {e}")
        return {"success": False, "error": "Unsupported URL format or platform."}

    except Exception as e:
        logger.error(f"Unexpected error for {url}: {e}")
        return {"success": False, "error": f"System Error: {str(e)[:100]}"}
