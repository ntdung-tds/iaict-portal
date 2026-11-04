"""Local fixture-only tests: fake clamd proves protocol, NOT a malware engine."""
import hashlib
import io
import os
from pathlib import Path
import socket
import tempfile
import threading
import unittest
from PIL import Image, PngImagePlugin

from scan_image import (
    RejectedScan, decode_and_reencode, scanner_receipt, scan_clamd, MAX_BYTES,
)

UPLOAD = "4ec14136-a36e-45bf-94f0-4d61e3f79893"
SECRET = b"s" * 32


class FakeClamd:
    def __init__(self, path: str, *, reject: bool = False):
        self.path = path
        self.reject = reject
        self.seen = []
        self.socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.socket.bind(path)
        self.socket.listen(4)
        self.socket.settimeout(0.5)
        self.active = True
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def run(self):
        while self.active:
            try:
                conn, _ = self.socket.accept()
            except (socket.timeout, OSError):
                continue
            with conn:
                conn.settimeout(2)
                prefix = self.read_exact(conn, 10)
                if prefix != b"zINSTREAM\x00":
                    conn.sendall(b"stream: INVALID ERROR\x00")
                    continue
                body = bytearray()
                try:
                    while True:
                        size = int.from_bytes(self.read_exact(conn, 4), "big")
                        if not size:
                            break
                        body.extend(self.read_exact(conn, size))
                    self.seen.append(bytes(body))
                    verdict = b"stream: synthetic FOUND\x00" if self.reject else b"stream: OK\x00"
                    conn.sendall(verdict)
                except (OSError, ValueError):
                    continue

    @staticmethod
    def read_exact(conn, length):
        raw = b""
        while len(raw) < length:
            part = conn.recv(length - len(raw))
            if not part:
                raise ValueError("short fake clamd input")
            raw += part
        return raw

    def close(self):
        self.active = False
        self.socket.close()
        self.thread.join(timeout=2)


def fixture(mime="PNG", metadata=True):
    im = Image.new("RGB", (8, 5), (17, 61, 120))
    buf = io.BytesIO()
    info = PngImagePlugin.PngInfo()
    if metadata:
        info.add_text("secret-test-metadata", "must-not-pass-into-derivative")
    if mime == "PNG":
        im.save(buf, mime, pnginfo=info)
    else:
        im.save(buf, mime)
    return buf.getvalue()


class IsolatedScannerTests(unittest.TestCase):
    def test_true_pixel_reencode_strips_metadata(self):
        raw = fixture()
        dst, w, h = decode_and_reencode(raw, "image/png")
        self.assertEqual((w, h), (8, 5))
        with Image.open(io.BytesIO(dst)) as im:
            im.load()
            self.assertEqual(im.format, "WEBP")
            self.assertNotIn("secret-test-metadata", str(im.info))
            self.assertNotIn("exif", im.info)

    def test_real_jpeg_webp_and_unsupported_mime(self):
        for fmt, mime in (("JPEG", "image/jpeg"), ("WEBP", "image/webp")):
            dst, w, h = decode_and_reencode(fixture(fmt), mime)
            self.assertTrue(dst.startswith(b"RIFF"))
            self.assertEqual((w, h), (8, 5))
        with self.assertRaises(RejectedScan):
            decode_and_reencode(fixture(), "image/svg+xml")
        with self.assertRaises(RejectedScan):
            decode_and_reencode(fixture(), "image/jpeg")

    def test_animated_webp_is_rejected(self):
        first=Image.new("RGB",(8,5),(5,15,25))
        second=Image.new("RGB",(8,5),(25,15,5))
        out=io.BytesIO()
        first.save(out,"WEBP",save_all=True,append_images=[second],duration=70,loop=0)
        with self.assertRaises(RejectedScan):
            decode_and_reencode(out.getvalue(),"image/webp")

    def test_broken_image_and_oversize_fail_closed(self):
        for raw in (b"not an image", fixture()[:15], b"x" * (MAX_BYTES + 1)):
            with self.assertRaises(RejectedScan):
                decode_and_reencode(raw, "image/png")

    def test_actual_instream_frames_and_signed_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            av = FakeClamd(os.path.join(tmp, "clamd.sock"))
            try:
                raw = fixture()
                path = os.path.join(tmp, "out.webp")
                receipt = scanner_receipt(
                    raw, mime="image/png", upload_id=UPLOAD, source_revision=1,
                    source_sha256=hashlib.sha256(raw).hexdigest(), secret=SECRET,
                    clamd_socket=av.path, output_path=path, now_ms=1793760000000,
                )
                self.assertEqual(len(av.seen), 2)
                self.assertEqual(av.seen[0], raw)
                self.assertEqual(av.seen[1], Path(path).read_bytes())
                self.assertEqual(receipt["claim"]["verdict"], "CLEAN")
                self.assertEqual(receipt["claim"]["derivativeMime"], "image/webp")
                self.assertEqual(len(receipt["signature"]), 64)
                with self.assertRaises(FileExistsError):
                    scanner_receipt(
                        raw, mime="image/png", upload_id=UPLOAD, source_revision=1,
                        source_sha256=hashlib.sha256(raw).hexdigest(), secret=SECRET,
                        clamd_socket=av.path, output_path=path,
                    )
            finally:
                av.close()

    def test_rejects_fake_av_found_and_unavailable(self):
        with tempfile.TemporaryDirectory() as tmp:
            av=FakeClamd(os.path.join(tmp,"clamd.sock"), reject=True)
            try:
                with self.assertRaises(RejectedScan):
                    scan_clamd(fixture(), av.path)
            finally:
                av.close()
            with self.assertRaises(RejectedScan):
                scan_clamd(fixture(), os.path.join(tmp,"missing.sock"))

    def test_rejects_wrong_source_sha_before_network_or_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=os.path.join(tmp,"blocked.webp")
            with self.assertRaises(RejectedScan):
                scanner_receipt(
                    fixture(),mime="image/png",upload_id=UPLOAD,source_revision=1,
                    source_sha256="0"*64,secret=SECRET,clamd_socket="missing",output_path=out,
                )
            self.assertFalse(os.path.exists(out))


if __name__ == "__main__":
    unittest.main()
