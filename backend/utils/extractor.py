import yt_dlp
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,       # never grab whole playlists
        "socket_timeout": 20,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

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
        if "private" in err.lower() or "login" in err.lower():
            return {"success": False, "error": "This content is private or requires login."}
        if "unavailable" in err.lower() or "not available" in err.lower():
            return {"success": False, "error": "This content is unavailable or has been removed."}
        return {"success": False, "error": "Invalid URL or content cannot be accessed."}

    except yt_dlp.utils.ExtractorError as e:
        logger.error(f"yt-dlp ExtractorError for {url}: {e}")
        return {"success": False, "error": "Unsupported URL format or platform."}

    except Exception as e:
        logger.error(f"Unexpected error for {url}: {e}")
        return {"success": False, "error": "An unexpected error occurred. Please try again."}
