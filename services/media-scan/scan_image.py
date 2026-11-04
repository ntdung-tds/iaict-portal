"""Isolated one-shot ClamAV + Pillow scanner; NEVER an internet-facing endpoint.

An authorized private job supplies a downloaded quarantine file and verified D1
arguments. The job must stage output bytes to private R2; this process only writes
a local derivative and a signed receipt to stdout. No service is deployed here.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import io
import json
import os
from pathlib import Path
import re
import secrets
import socket
import stat
import struct
import sys
import time
import warnings

from PIL import Image, ImageOps

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 25_000_000
MAX_DIM = 8192
POLICY_ID = "IAICT-MEDIA-20261104-V1"
FIELDS = (
    "version", "policyId", "uploadId", "scopeId", "sourceRevision",
    "sourceSha256", "sourceMime", "derivativeKey", "derivativeSha256",
    "derivativeSize", "derivativeMime", "width", "height", "engine",
    "verdict", "signedAtMs", "nonce",
)
UUID_V4 = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
MIME_FORMAT = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
warnings.simplefilter("error", Image.DecompressionBombWarning)


class RejectedScan(Exception):
    pass


def scan_clamd(blob: bytes, socket_path: str) -> None:
    """ClamAV zINSTREAM. Fail closed on any non-exact CLEAN response."""
    if not blob or len(blob) > MAX_BYTES:
        raise RejectedScan("INPUT_SIZE")
    reply = bytearray()
    try:
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
            s.settimeout(12.0)
            s.connect(socket_path)
            s.sendall(b"zINSTREAM\x00")
            for offset in range(0, len(blob), 256 * 1024):
                chunk = blob[offset:offset + 256 * 1024]
                s.sendall(struct.pack(">I", len(chunk)))
                s.sendall(chunk)
            s.sendall(b"\x00\x00\x00\x00")
            while len(reply) <= 4096:
                part = s.recv(1024)
                if not part:
                    break
                reply.extend(part)
                if b"\x00" in part or b"\n" in part:
                    break
    except (OSError, TimeoutError) as exc:
        raise RejectedScan("SCANNER_UNAVAILABLE") from exc
    if len(reply) > 4096 or reply.rstrip(b"\x00\n\r") != b"stream: OK":
        raise RejectedScan("SCANNER_REJECTED_OR_UNKNOWN")


def decode_and_reencode(raw: bytes, mime: str) -> tuple[bytes, int, int]:
    if mime not in MIME_FORMAT or not raw or len(raw) > MAX_BYTES:
        raise RejectedScan("INVALID_SOURCE")
    try:
        with Image.open(io.BytesIO(raw)) as im:
            if im.format != MIME_FORMAT[mime]:
                raise RejectedScan("MIME_MISMATCH")
            if getattr(im, "n_frames", 1) != 1 or bool(im.info.get("loop")):
                raise RejectedScan("ANIMATION_DENIED")
            width, height = im.size
            if not (0 < width <= MAX_DIM and 0 < height <= MAX_DIM and width * height <= MAX_PIXELS):
                raise RejectedScan("DIMENSION_LIMIT")
            # An actual full pixel decode is mandatory; metadata() alone is not enough.
            im.load()
            oriented = ImageOps.exif_transpose(im)
            oriented.load()
            width, height = oriented.size
            if not (0 < width <= MAX_DIM and 0 < height <= MAX_DIM and width * height <= MAX_PIXELS):
                raise RejectedScan("DIMENSION_LIMIT")
            # Rebuild pixels in an entirely new image, discarding EXIF/XMP/ICC.
            rgba = "A" in oriented.getbands()
            pixels = oriented.convert("RGBA" if rgba else "RGB")
            clean = Image.new(pixels.mode, pixels.size)
            clean.paste(pixels)
            out = io.BytesIO()
            clean.save(out, "WEBP", quality=80, method=6)
            derivative = out.getvalue()
            if not derivative or len(derivative) > MAX_BYTES:
                raise RejectedScan("DERIVATIVE_TOO_LARGE")
            return derivative, width, height
    except (OSError, ValueError, SyntaxError, Image.DecompressionBombError,
            Image.DecompressionBombWarning) as exc:
        raise RejectedScan("DECODE_FAILED") from exc


def scanner_receipt(
    raw: bytes, *, mime: str, upload_id: str, source_revision: int, source_sha256: str,
    secret: bytes, clamd_socket: str, output_path: str, now_ms: int | None = None,
) -> dict:
    if not UUID_V4.fullmatch(upload_id) or not isinstance(source_revision, int) or source_revision < 1:
        raise RejectedScan("INVALID_JOB_ID")
    if len(secret) < 32 or not hmac.compare_digest(hashlib.sha256(raw).hexdigest(), source_sha256):
        raise RejectedScan("SOURCE_DIGEST_MISMATCH")
    if not raw or len(raw) > MAX_BYTES:
        raise RejectedScan("INPUT_SIZE")
    scan_clamd(raw, clamd_socket)
    derivative, width, height = decode_and_reencode(raw, mime)
    scan_clamd(derivative, clamd_socket)
    derivative_sha = hashlib.sha256(derivative).hexdigest()

    # Exclusive private write to prevent clobber/symlink traversal in job workspace.
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(output_path, flags, 0o600)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(derivative)
    except BaseException:
        try:
            os.unlink(output_path)
        except OSError:
            pass
        raise

    claim = {
        "version": "iaict.media.scan.v1", "policyId": POLICY_ID,
        "uploadId": upload_id, "scopeId": "cms-main",
        "sourceRevision": source_revision, "sourceSha256": source_sha256,
        "sourceMime": mime,
        "derivativeKey": f"derivative/staged/v1/cms-main/{upload_id}/{derivative_sha}.webp",
        "derivativeSha256": derivative_sha, "derivativeSize": len(derivative),
        "derivativeMime": "image/webp", "width": width, "height": height,
        "engine": "clamav", "verdict": "CLEAN",
        "signedAtMs": now_ms if now_ms is not None else int(time.time() * 1000),
        "nonce": secrets.token_hex(16),
    }
    canonical = json.dumps([claim[key] for key in FIELDS], separators=(",", ":"), ensure_ascii=True).encode("utf8")
    return {"claim": claim, "signature": hmac.new(secret, canonical, hashlib.sha256).hexdigest()}


def run() -> int:
    p = argparse.ArgumentParser(description="Private one-shot media scan (no HTTP listener)")
    for name in ("source", "mime", "upload-id", "source-revision", "source-sha256",
                 "secret-file", "clamd-socket", "output"):
        p.add_argument("--" + name, required=True)
    args = p.parse_args()
    try:
        secret_path = Path(args.secret_file)
        if os.name != "nt" and (stat.S_IMODE(secret_path.stat().st_mode) & 0o077):
            raise RejectedScan("UNSAFE_SECRET_FILE_PERMISSIONS")
        secret = secret_path.read_bytes()
        file_path = Path(args.source)
        if file_path.stat().st_size > MAX_BYTES:
            raise RejectedScan("INPUT_SIZE")
        raw = file_path.read_bytes()
        claim = scanner_receipt(
            raw, mime=args.mime, upload_id=args.upload_id,
            source_revision=int(args.source_revision), source_sha256=args.source_sha256,
            secret=secret, clamd_socket=args.clamd_socket, output_path=args.output,
        )
        print(json.dumps(claim, separators=(",", ":"), ensure_ascii=True))
        return 0
    except (RejectedScan, OSError, ValueError):
        # Never print file contents, AV signature names, secret or full local paths.
        print("MEDIA_SCAN_DENIED", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(run())
