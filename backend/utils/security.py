import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt

JWT_ALGORITHM = "HS256"
PBKDF2_ITERATIONS = 210_000


def _jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "change-me-in-production")


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return "pbkdf2_sha256${}${}${}".format(
        PBKDF2_ITERATIONS,
        base64.b64encode(salt).decode("utf-8"),
        base64.b64encode(digest).decode("utf-8"),
    )


def verify_password(password: str, stored_password: str) -> bool:
    try:
        algorithm, iterations, salt_b64, digest_b64 = stored_password.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64.encode("utf-8"))
        expected = base64.b64decode(digest_b64.encode("utf-8"))
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations),
        )
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": user_id, "email": email, "exp": expires_at}
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
