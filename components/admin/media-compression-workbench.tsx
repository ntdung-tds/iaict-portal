"use client";

import { useState, type ChangeEvent } from "react";
import { compressLocalImage, type LocalImageCompression } from "@/lib/media-local-image";
import { createLocalZipArchive, LOCAL_ZIP_POLICY, type LocalZipOutput } from "@/lib/media-local-zip";
import { compressEligibleTextFile, type TextCompressionResult } from "@/lib/media-text-compression";
import { MEDIA_POLICY } from "@/lib/media-policy";
import styles from "./media-compression-workbench.module.css";

const readableBytes = (n: number) => (n / 1024).toFixed(n >= 1024 * 1024 ? 0 : 1) + " KiB";
const errorText: Record<string, string> = {
  INVALID_INPUT: "Dữ liệu không hợp lệ.",
  UNSUPPORTED_IMAGE: "Chỉ hỗ trợ JPEG, PNG và WebP tĩnh.",
  SIGNATURE_MISMATCH: "Tệp không trùng với định dạng ảnh công bố.",
  IMAGE_TOO_LARGE: "Ảnh vượt hạn mức dung lượng hoặc kích thước.",
  ANIMATION_DENIED: "Ảnh động chưa được hỗ trợ.",
  DECODER_UNAVAILABLE: "Trình duyệt không có bộ giải mã ảnh phù hợp.",
  DECODE_FAILED: "Không thể giải mã ảnh hoặc ảnh không hợp lệ.",
  ENCODE_FAILED: "Không thể tạo ảnh mới, thử một trình duyệt khác.",
  OUTPUT_TOO_LARGE: "Ảnh sau xử lý vượt hạn mức.",
  INVALID_FILENAME: "Tên tệp có ký tự hoặc đường dẫn không an toàn.",
  DUPLICATE_FILENAME: "Có nhiều tệp trùng tên trong ZIP.",
  EMPTY_FILE: "Không thể xử lý tệp rỗng.",
  FILE_TOO_LARGE: "Một tệp vượt giới hạn 10 MiB.",
  TOTAL_TOO_LARGE: "Tổng dung lượng vượt 30 MiB.",
  TOO_MANY_FILES: "Chỉ chọn tối đa 20 tệp cho một gói ZIP.",
  ARCHIVE_TOO_LARGE: "Gói ZIP vượt giới hạn 40 MiB.",
  UNSUPPORTED_FORMAT: "Chỉ hỗ trợ gzip tệp UTF-8 .txt, .csv và .json.",
  INVALID_TEXT_ENCODING: "Nội dung không phải UTF-8 hợp lệ.",
  TOO_LARGE: "Tệp vượt giới hạn 5 MiB.",
  COMPRESSION_UNAVAILABLE: "Trình duyệt không hỗ trợ nén định dạng này.",
  OUTPUT_LIMIT_EXCEEDED: "Kết quả nén vượt giới hạn an toàn.",
};

function download(blob: Blob, name: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

function mimeForText(file: File): "text/plain" | "text/csv" | "application/json" | null {
  const ext = file.name.split(".").at(-1)?.toLowerCase();
  if (ext === "txt") return "text/plain";
  if (ext === "csv") return "text/csv";
  if (ext === "json") return "application/json";
  return null;
}

function toBlob(bytes: Uint8Array, type: string) {
  // Browser BlobPart typing requires an owned ArrayBuffer, not SharedArrayBuffer.
  return new Blob([new Uint8Array(bytes)], { type });
}

const imageExt: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

export function MediaCompressionWorkbench() {
  const [image, setImage] = useState<File | null>(null);
  const [imageResult, setImageResult] = useState<LocalImageCompression | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [zipFiles, setZipFiles] = useState<File[]>([]);
  const [zipResult, setZipResult] = useState<LocalZipOutput | null>(null);
  const [zipBusy, setZipBusy] = useState(false);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [gzipResult, setGzipResult] = useState<TextCompressionResult | null>(null);
  const [gzipBusy, setGzipBusy] = useState(false);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null);
    setImageResult(null);
  }
  function chooseZip(event: ChangeEvent<HTMLInputElement>) {
    setZipFiles(Array.from(event.target.files ?? []));
    setZipResult(null);
  }
  function chooseText(event: ChangeEvent<HTMLInputElement>) {
    setTextFile(event.target.files?.[0] ?? null);
    setGzipResult(null);
  }

  async function optimizeImage() {
    if (!image || imageBusy) return;
    setImageBusy(true);
    setImageResult(null);
    try { setImageResult(await compressLocalImage(image)); }
    finally { setImageBusy(false); }
  }

  async function compressZip() {
    if (!zipFiles.length || zipBusy) return;
    setZipBusy(true);
    setZipResult(null);
    try {
      if (zipFiles.length > LOCAL_ZIP_POLICY.maxFiles) {
        setZipResult({ ok: false, code: "TOO_MANY_FILES" }); return;
      }
      let total = 0;
      for (const file of zipFiles) {
        if (file.size > LOCAL_ZIP_POLICY.maxFileBytes) {
          setZipResult({ ok: false, code: "FILE_TOO_LARGE" }); return;
        }
        total += file.size;
        if (total > LOCAL_ZIP_POLICY.maxInputBytes) {
          setZipResult({ ok: false, code: "TOTAL_TOO_LARGE" }); return;
        }
      }
      const files = [];
      for (const file of zipFiles) {
        files.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
      }
      setZipResult(await createLocalZipArchive(files));
    } catch { setZipResult({ ok: false, code: "INVALID_INPUT" }); }
    finally { setZipBusy(false); }
  }

  async function compressGzip() {
    if (!textFile || gzipBusy) return;
    setGzipBusy(true);
    setGzipResult(null);
    try {
      const type = mimeForText(textFile);
      if (!type) { setGzipResult({ ok: false, code: "UNSUPPORTED_FORMAT" }); return; }
      if (textFile.size > 5 * 1024 * 1024) { setGzipResult({ ok: false, code: "TOO_LARGE" }); return; }
      setGzipResult(await compressEligibleTextFile(new Uint8Array(await textFile.arrayBuffer()), type));
    } catch { setGzipResult({ ok: false, code: "INVALID_INPUT" }); }
    finally { setGzipBusy(false); }
  }

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>CMS / Công cụ Media</span>
        <h1>Trung tâm nén ảnh &amp; tệp</h1>
        <p>Giảm kích thước ảnh, tạo gói ZIP hoặc nén văn bản. Toàn bộ xử lý ngay trong trình duyệt của bạn; <strong>không gửi tệp lên máy chủ, D1 hay R2.</strong></p>
      </div>
      <section className={styles.notice} aria-label="Giới hạn bảo mật">
        <strong>Chế độ xử lý cục bộ</strong>
        <span>Các tệp tải về chỉ lưu trên máy của bạn. Đây không phải chức năng upload hoặc xuất bản CMS. Media R2 vẫn yêu cầu scanner, kiểm tra quyền và kiểm thử staging trước khi kích hoạt.</span>
      </section>
      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="optimize-image">
          <div className={styles.number}>01 · Ảnh</div>
          <h2 id="optimize-image">Nén và thu nhỏ ảnh</h2>
          <p>Tạo bản hiển thị tối đa 1.920 px và thumbnail 480 px. Giữ PNG lossless, JPEG chất lượng 82%, WebP 80%.</p>
          <label htmlFor="compress-image-file">Chọn ảnh JPEG, PNG hoặc WebP tĩnh</label>
          <input id="compress-image-file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={chooseImage} />
          <p className={styles.hint}>Ảnh tối đa {MEDIA_POLICY.file.maxBytes / 1024 / 1024} MiB, 25 triệu pixel. Không tự phóng lớn.</p>
          <button type="button" onClick={optimizeImage} disabled={!image || imageBusy} className={styles.primary}>
            {imageBusy ? "Đang xử lý ảnh…" : "Nén ảnh"}
          </button>
          {imageResult?.ok ? (
            <div className={styles.result} role="status">
              <strong>Đã tạo hai ảnh mới</strong>
              <span>Gốc: {readableBytes(imageResult.originalBytes)} · Hiển thị: {readableBytes(imageResult.display.byteLength)} · Thumb: {readableBytes(imageResult.thumbnail.byteLength)}</span>
              <div className={styles.actions}>
                <button type="button" onClick={() => download(imageResult.display.blob, "iaict-display." + imageExt[imageResult.display.mimeType])}>Tải ảnh hiển thị</button>
                <button type="button" onClick={() => download(imageResult.thumbnail.blob, "iaict-thumbnail." + imageExt[imageResult.thumbnail.mimeType])}>Tải thumbnail</button>
              </div>
            </div>
          ) : imageResult ? <p role="alert" className={styles.error}>{errorText[imageResult.code] ?? imageResult.code}</p> : null}
        </section>

        <section className={styles.card} aria-labelledby="compress-zip">
          <div className={styles.number}>02 · ZIP</div>
          <h2 id="compress-zip">Gộp và nén nhiều tệp</h2>
          <p>Tạo tệp ZIP thật, nén các tệp văn bản khi có lợi, giữ nguyên ảnh hoặc tệp đã nén. Không giải nén tệp tải vào.</p>
          <label htmlFor="compress-zip-files">Chọn nhiều tệp từ máy</label>
          <input id="compress-zip-files" type="file" multiple onChange={chooseZip} />
          <p className={styles.hint}>Tối đa 20 tệp, 10 MiB/tệp, 30 MiB tổng. Không đưa tên đường dẫn hoặc tệp trùng tên vào ZIP.</p>
          <button type="button" className={styles.primary} disabled={!zipFiles.length || zipBusy} onClick={compressZip}>
            {zipBusy ? "Đang tạo ZIP…" : "Tạo tệp ZIP"}
          </button>
          {zipResult?.ok ? (
            <div className={styles.result} role="status">
              <strong>ZIP hợp lệ — {zipResult.fileCount} tệp</strong>
              <span>Tổng ban đầu: {readableBytes(zipResult.inputBytes)} · ZIP: {readableBytes(zipResult.archiveBytes)} · Có {zipResult.compressedEntries} tệp được nén</span>
              <div className={styles.actions}>
                <button type="button" onClick={() => download(toBlob(zipResult.bytes, "application/zip"), "iaict-files.zip")}>Tải ZIP</button>
              </div>
            </div>
          ) : zipResult ? <p role="alert" className={styles.error}>{errorText[zipResult.code] ?? zipResult.code}</p> : null}
        </section>

        <section className={styles.card} aria-labelledby="compress-gzip">
          <div className={styles.number}>03 · Gzip</div>
          <h2 id="compress-gzip">Nén tệp văn bản</h2>
          <p>Nén nguyên nội dung UTF-8 thành .gz, tự bỏ qua nếu không tiết kiệm tối thiểu 5%. Không nhận file thực thi hoặc định dạng lưu trữ đã nén.</p>
          <label htmlFor="compress-text-file">Chọn .txt, .csv hoặc .json</label>
          <input id="compress-text-file" type="file" accept=".txt,.csv,.json" onChange={chooseText} />
          <p className={styles.hint}>Tối đa 5 MiB. Không gửi dữ liệu lên CMS.</p>
          <button type="button" className={styles.primary} onClick={compressGzip} disabled={!textFile || gzipBusy}>
            {gzipBusy ? "Đang nén…" : "Nén Gzip"}
          </button>
          {gzipResult?.ok ? (
            <div className={styles.result} role="status">
              <strong>{gzipResult.storageEncoding === "gzip" ? "Đã nén tệp" : "Tệp nhỏ, không cần nén thêm"}</strong>
              <span>Ban đầu: {readableBytes(gzipResult.inputBytes)} · Kết quả: {readableBytes(gzipResult.outputBytes)}</span>
              <div className={styles.actions}>
                <button type="button" onClick={() => download(
                  toBlob(gzipResult.bytes, gzipResult.storageEncoding === "gzip" ? "application/gzip" : "application/octet-stream"),
                  (textFile?.name ?? "iaict-text") + (gzipResult.storageEncoding === "gzip" ? ".gz" : "")
                )}>Tải {gzipResult.storageEncoding === "gzip" ? "Gzip" : "tệp gốc"}</button>
              </div>
            </div>
          ) : gzipResult ? <p role="alert" className={styles.error}>{errorText[gzipResult.code] ?? gzipResult.code}</p> : null}
        </section>
      </div>
      <p className={styles.footnote}>Giới hạn của trình duyệt: xử lý ảnh tại đây không thay thế dịch vụ kiểm tra virus và giải mã ảnh cô lập ở máy chủ. Để đưa kết quả vào thư viện CMS phải đi qua luồng upload được bảo vệ và phê duyệt riêng.</p>
    </main>
  );
}
