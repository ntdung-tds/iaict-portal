"""Explicit opt-in acceptance against REAL ClamAV signatures on a UNIX socket.

This file is deliberately named real_clamd_acceptance.py, not test_*.py,
so default unit CI can never silently replace actual ClamAV with a fake socket.
Requires IAICT_REAL_CLAMD_SOCKET to be set by the dedicated CI job.
No production/R2/Cloudflare credentials, public endpoint or real user data.
"""
import hashlib
import hmac
import io
import os
from pathlib import Path
import socket
import struct
import tempfile
import unittest

from PIL import Image, PngImagePlugin
from scan_image import RejectedScan, scan_clamd, scanner_receipt

SOCKET = os.environ.get("IAICT_REAL_CLAMD_SOCKET", "")
UUID = "4ec14136-a36e-45bf-94f0-4d61e3f79893"
SECRET = b"ci-real-clamav-isolated-nonproduction"  # TEST ONLY; no hosted key
# Official harmless EICAR antivirus signature test pattern (not malware).
EICAR = r"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*".encode("ascii")


def ping():
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
        sock.settimeout(8)
        sock.connect(SOCKET)
        sock.sendall(b"zPING\x00")
        return sock.recv(128).strip(b"\x00\n\r")


def raw_verdict(data):
    """Independent wire-level EICAR proof; cannot pass via a fake CLEAN stub."""
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
        sock.settimeout(12)
        sock.connect(SOCKET)
        sock.sendall(b"zINSTREAM\x00")
        sock.sendall(struct.pack(">I", len(data)) + data + b"\x00\x00\x00\x00")
        return sock.recv(4096).strip(b"\x00\n\r")


def image_fixture():
    im = Image.new("RGB", (16, 13), (8, 35, 72))
    pnginfo = PngImagePlugin.PngInfo()
    pnginfo.add_text("private-in-ci-only", "must-remove")
    out = io.BytesIO()
    im.save(out, format="PNG", pnginfo=pnginfo)
    return out.getvalue()


class RealClamdAcceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not SOCKET or not Path(SOCKET).exists():
            raise RuntimeError("REAL_CLAMD_SOCKET_REQUIRED: scanner service not available")
        if ping() != b"PONG":
            raise RuntimeError("REAL_CLAMD_NOT_READY")

    def test_01_eicar_is_detected_by_real_signatures(self):
        self.assertEqual(len(EICAR), 68)
        verdict = raw_verdict(EICAR)
        self.assertIn(b"Eicar", verdict, verdict)
        self.assertIn(b"FOUND", verdict, verdict)
        with self.assertRaisesRegex(RejectedScan, "SCANNER_REJECTED_OR_UNKNOWN"):
            scan_clamd(EICAR, SOCKET)

    def test_02_clean_source_and_derivative_both_scan_and_receipt_signed(self):
        raw = image_fixture()
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp, "sanitized.webp")
            receipt = scanner_receipt(
                raw, mime="image/png", upload_id=UUID, source_revision=1,
                source_sha256=hashlib.sha256(raw).hexdigest(),
                secret=SECRET, clamd_socket=SOCKET,
                output_path=str(output),
            )
            clean = output.read_bytes()
            self.assertTrue(clean.startswith(b"RIFF"))
            self.assertNotIn(b"private-in-ci-only", clean)
            self.assertEqual(receipt["claim"]["sourceSha256"], hashlib.sha256(raw).hexdigest())
            self.assertEqual(receipt["claim"]["derivativeSha256"], hashlib.sha256(clean).hexdigest())
            self.assertEqual(receipt["claim"]["derivativeSize"], len(clean))
            self.assertEqual(receipt["claim"]["verdict"], "CLEAN")
            # Production token is not created in this fixture. Actual receipt signer key
            # is tested separately in Worker TS and deployed service provisioning remains BLOCKED.
            self.assertEqual(len(bytes.fromhex(receipt["signature"])), 32)

    def test_03_bad_source_hash_denied_before_scan_or_derivative(self):
        raw = image_fixture()
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp, "must-not-exist.webp")
            with self.assertRaises(RejectedScan):
                scanner_receipt(
                    raw, mime="image/png", upload_id=UUID, source_revision=1,
                    source_sha256="0" * 64, secret=SECRET,
                    clamd_socket=SOCKET, output_path=str(output),
                )
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
