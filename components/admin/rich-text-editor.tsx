"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@/lib/media-types";

type EditorMode = "visual" | "code";
type ImageAlign = "left" | "center" | "right";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type MediaResponse = {
  items?: MediaAsset[];
  error?: string;
  message?: string;
};

const FONT_SIZES = [
  { value: "2", label: "12 px" },
  { value: "3", label: "16 px" },
  { value: "4", label: "18 px" },
  { value: "5", label: "24 px" },
  { value: "6", label: "32 px" },
];

const SAFE_STYLE_PROPERTIES = new Set([
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "color",
  "background-color",
  "width",
  "max-width",
  "height",
]);

function sanitizePreview(html: string) {
  if (typeof window === "undefined") return html;
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode
    .querySelectorAll("script,style,iframe,object,embed,form,input,button,textarea,select,link,meta,svg,math")
    .forEach((node) => node.remove());

  documentNode.body.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim();
      if (name.startsWith("on") || name === "srcdoc") {
        element.removeAttribute(attribute.name);
        return;
      }
      if (name === "href" && /^(?:javascript|data):/i.test(attributeValue)) {
        element.removeAttribute(attribute.name);
        return;
      }
      if (name === "src" && element.tagName === "IMG" && !/^(?:https?:\/\/|\/)/i.test(attributeValue)) {
        element.removeAttribute(attribute.name);
        return;
      }
      if (name === "style") {
        const safeDeclarations = attributeValue
          .split(";")
          .map((declaration) => declaration.trim())
          .filter(Boolean)
          .filter((declaration) => {
            const separator = declaration.indexOf(":");
            if (separator < 1) return false;
            const property = declaration.slice(0, separator).trim().toLowerCase();
            const styleValue = declaration.slice(separator + 1).trim();
            return SAFE_STYLE_PROPERTIES.has(property) && !/(?:url\s*\(|expression\s*\(|javascript:)/i.test(styleValue);
          });
        if (safeDeclarations.length) element.setAttribute("style", safeDeclarations.join("; "));
        else element.removeAttribute("style");
      }
    });
  });

  return documentNode.body.innerHTML;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const visualRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [imageAlign, setImageAlign] = useState<ImageAlign>("center");
  const [imageWidth, setImageWidth] = useState("100%");

  useEffect(() => {
    if (mode !== "visual" || !visualRef.current) return;
    const safeValue = sanitizePreview(value);
    if (visualRef.current.innerHTML !== safeValue) visualRef.current.innerHTML = safeValue;
  }, [mode, value]);

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !visualRef.current) return;
    const range = selection.getRangeAt(0);
    if (visualRef.current.contains(range.commonAncestorContainer)) selectionRef.current = range.cloneRange();
  }

  function restoreSelection() {
    if (!selectionRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function syncVisual() {
    if (!visualRef.current) return;
    onChange(visualRef.current.innerHTML);
    captureSelection();
  }

  function command(name: string, commandValue?: string) {
    if (!visualRef.current) return;
    visualRef.current.focus();
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(name, false, commandValue);
    syncVisual();
  }

  function createLink() {
    const href = window.prompt("Nhập đường dẫn liên kết (https://...):", "https://");
    if (!href) return;
    command("createLink", href.trim());
  }

  function switchMode(nextMode: EditorMode) {
    if (nextMode === mode) return;
    if (mode === "visual" && visualRef.current) onChange(visualRef.current.innerHTML);
    setMode(nextMode);
  }

  async function openMediaPicker() {
    captureSelection();
    setMediaOpen(true);
    setMediaLoading(true);
    setMediaError(null);
    setSelectedMedia(null);
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const data = (await response.json()) as MediaResponse;
      if (!response.ok) {
        setMediaError(data.message ?? "Không thể tải Thư viện Media.");
        return;
      }
      setMediaItems(data.items ?? []);
    } catch {
      setMediaError("Không thể kết nối Thư viện Media.");
    } finally {
      setMediaLoading(false);
    }
  }

  function insertSelectedMedia() {
    if (!selectedMedia) return;
    const figureStyle = `text-align: ${imageAlign};`;
    const imageStyle = `width: ${imageWidth}; max-width: 100%; height: auto;`;
    const captionHtml = selectedMedia.caption
      ? `<figcaption>${escapeHtml(selectedMedia.caption)}</figcaption>`
      : "";
    const html = `<figure style="${figureStyle}"><img src="${escapeHtml(selectedMedia.publicUrl)}" alt="${escapeHtml(selectedMedia.alt)}" loading="lazy" style="${imageStyle}" />${captionHtml}</figure><p><br></p>`;

    command("insertHTML", html);
    setMediaOpen(false);
    setSelectedMedia(null);
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor-topline">
        <div className="admin-editor-mode-tabs" role="tablist" aria-label="Chế độ biên tập">
          <button type="button" role="tab" aria-selected={mode === "visual"} className={mode === "visual" ? "active" : ""} onClick={() => switchMode("visual")}>Soạn thảo</button>
          <button type="button" role="tab" aria-selected={mode === "code"} className={mode === "code" ? "active" : ""} onClick={() => switchMode("code")}>HTML Code</button>
        </div>
        <span>{mode === "visual" ? "WYSIWYG" : "SOURCE"}</span>
      </div>

      {mode === "visual" ? (
        <>
          <div className="admin-format-toolbar" aria-label="Công cụ định dạng văn bản">
            <div className="admin-format-group admin-format-selects">
              <select aria-label="Kiểu đoạn" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)}>
                <option value="p">Đoạn văn</option>
                <option value="h2">Tiêu đề 2</option>
                <option value="h3">Tiêu đề 3</option>
                <option value="h4">Tiêu đề 4</option>
                <option value="blockquote">Trích dẫn</option>
                <option value="pre">Code block</option>
              </select>
              <select aria-label="Font chữ" defaultValue="Arial" onChange={(event) => command("fontName", event.target.value)}>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Courier New">Courier New</option>
              </select>
              <select aria-label="Cỡ chữ" defaultValue="3" onChange={(event) => command("fontSize", event.target.value)}>
                {FONT_SIZES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
              </select>
            </div>

            <div className="admin-format-group">
              <button type="button" title="In đậm" aria-label="In đậm" onMouseDown={captureSelection} onClick={() => command("bold")}><b>B</b></button>
              <button type="button" title="In nghiêng" aria-label="In nghiêng" onMouseDown={captureSelection} onClick={() => command("italic")}><i>I</i></button>
              <button type="button" title="Gạch chân" aria-label="Gạch chân" onMouseDown={captureSelection} onClick={() => command("underline")}><u>U</u></button>
              <button type="button" title="Gạch ngang" aria-label="Gạch ngang" onMouseDown={captureSelection} onClick={() => command("strikeThrough")}><s>S</s></button>
            </div>

            <div className="admin-format-group admin-format-colors">
              <label title="Màu chữ"><span>A</span><input type="color" defaultValue="#132238" aria-label="Màu chữ" onMouseDown={captureSelection} onChange={(event) => command("foreColor", event.target.value)} /></label>
              <label title="Màu nền chữ"><span>▰</span><input type="color" defaultValue="#fff3a3" aria-label="Màu nền chữ" onMouseDown={captureSelection} onChange={(event) => command("hiliteColor", event.target.value)} /></label>
            </div>

            <div className="admin-format-group">
              <button type="button" title="Căn trái" aria-label="Căn trái" onMouseDown={captureSelection} onClick={() => command("justifyLeft")}>L</button>
              <button type="button" title="Căn giữa" aria-label="Căn giữa" onMouseDown={captureSelection} onClick={() => command("justifyCenter")}>C</button>
              <button type="button" title="Căn phải" aria-label="Căn phải" onMouseDown={captureSelection} onClick={() => command("justifyRight")}>R</button>
              <button type="button" title="Căn đều" aria-label="Căn đều" onMouseDown={captureSelection} onClick={() => command("justifyFull")}>J</button>
            </div>

            <div className="admin-format-group">
              <button type="button" title="Danh sách dấu đầu dòng" onMouseDown={captureSelection} onClick={() => command("insertUnorderedList")}>• List</button>
              <button type="button" title="Danh sách đánh số" onMouseDown={captureSelection} onClick={() => command("insertOrderedList")}>1. List</button>
              <button type="button" title="Liên kết" onMouseDown={captureSelection} onClick={createLink}>Link</button>
              <button type="button" title="Gỡ liên kết" onMouseDown={captureSelection} onClick={() => command("unlink")}>Unlink</button>
              <button type="button" title="Chèn ảnh từ Thư viện Media" onMouseDown={captureSelection} onClick={openMediaPicker}>Ảnh</button>
            </div>

            <div className="admin-format-group">
              <button type="button" title="Hoàn tác" onClick={() => command("undo")}>↶</button>
              <button type="button" title="Làm lại" onClick={() => command("redo")}>↷</button>
              <button type="button" title="Xóa định dạng" onMouseDown={captureSelection} onClick={() => command("removeFormat")}>Clear</button>
            </div>
          </div>

          <div
            ref={visualRef}
            className="admin-visual-editor"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Nội dung chi tiết"
            data-placeholder="Viết nội dung bài tại đây..."
            onInput={syncVisual}
            onMouseUp={captureSelection}
            onKeyUp={captureSelection}
            onBlur={captureSelection}
          />
        </>
      ) : (
        <div className="admin-code-editor-shell">
          <div className="admin-code-editor-head">
            <span>HTML</span>
            <p>Có thể viết trực tiếp các thẻ nội dung và inline style. Script, iframe, event handler và thuộc tính nguy hiểm sẽ bị loại khi lưu.</p>
          </div>
          <textarea
            className="admin-code-editor"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            aria-label="Mã HTML bài viết"
            placeholder={'<h2>Tiêu đề mục</h2>\n<p>Nội dung <strong>in đậm</strong>...</p>'}
          />
        </div>
      )}

      <div className="admin-rich-editor-status">
        <span>Hai chế độ dùng chung một nội dung</span>
        <small>Chuyển qua lại giữa Soạn thảo và HTML Code không tạo bản sao riêng.</small>
      </div>

      {mediaOpen ? (
        <div className="admin-media-picker-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMediaOpen(false);
        }}>
          <section className="admin-media-picker" role="dialog" aria-modal="true" aria-label="Chọn ảnh từ Thư viện Media">
            <div className="admin-media-picker-head">
              <div><span>IAICT MEDIA</span><strong>Chèn ảnh vào bài viết</strong></div>
              <button type="button" aria-label="Đóng thư viện" onClick={() => setMediaOpen(false)}>×</button>
            </div>

            <div className="admin-media-picker-body">
              {mediaLoading ? <div className="admin-media-picker-empty">Đang tải Thư viện Media...</div> : null}
              {mediaError ? <div className="admin-media-picker-empty">{mediaError}</div> : null}
              {!mediaLoading && !mediaError && mediaItems.length ? (
                <div className="admin-media-picker-grid">
                  {mediaItems.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`admin-media-picker-item${selectedMedia?.id === item.id ? " active" : ""}`}
                      onClick={() => setSelectedMedia(item)}
                    >
                      <img src={item.publicUrl} alt={item.alt} loading="lazy" />
                      <span>{item.originalName}</span>
                      <small>{item.alt}</small>
                    </button>
                  ))}
                </div>
              ) : null}
              {!mediaLoading && !mediaError && mediaItems.length === 0 ? (
                <div className="admin-media-picker-empty">Thư viện chưa có ảnh. Hãy tải ảnh tại mục Thư viện Media.</div>
              ) : null}
            </div>

            <div className="admin-media-picker-footer">
              <div>
                <p className="admin-media-picker-note">
                  {selectedMedia ? `Đã chọn: ${selectedMedia.alt}` : "Chọn một ảnh, sau đó đặt căn lề và kích thước."}
                </p>
                <div className="admin-media-picker-options">
                  <label>
                    Căn ảnh
                    <select value={imageAlign} onChange={(event) => setImageAlign(event.target.value as ImageAlign)}>
                      <option value="left">Trái</option>
                      <option value="center">Giữa</option>
                      <option value="right">Phải</option>
                    </select>
                  </label>
                  <label>
                    Kích thước
                    <select value={imageWidth} onChange={(event) => setImageWidth(event.target.value)}>
                      <option value="100%">100%</option>
                      <option value="75%">75%</option>
                      <option value="50%">50%</option>
                      <option value="33%">33%</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="admin-media-picker-actions">
                <a className="admin-button admin-button-secondary" href="/dashboard/thu-vien" target="_blank" rel="noreferrer">Mở thư viện ↗</a>
                <button className="admin-button admin-button-secondary" type="button" onClick={() => setMediaOpen(false)}>Hủy</button>
                <button className="admin-button admin-button-primary" type="button" disabled={!selectedMedia} onClick={insertSelectedMedia}>Chèn ảnh</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
