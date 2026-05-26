import hmac
import hashlib

from app.core.security import get_server_secret_key


def generate_hmac_sha256(file_sha256: str, merkle_root: str, file_size: int) -> str:
    secret_key = get_server_secret_key()
    message = "sha256=" + file_sha256
    message = message + "|merkle_root=" + merkle_root
    message = message + "|file_size=" + str(file_size)

    hmac_object = hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    )
    return hmac_object.hexdigest()


def verify_hmac_sha256(
    file_sha256: str,
    merkle_root: str,
    file_size: int,
    supplied_hmac: str,
) -> bool:
    server_hmac = generate_hmac_sha256(file_sha256, merkle_root, file_size)
    return hmac.compare_digest(server_hmac, supplied_hmac)
