import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found"><div className="shell"><span>404</span><h1>Không tìm thấy nội dung</h1><p>Đường dẫn có thể đã thay đổi hoặc nội dung chưa được xuất bản.</p><Link className="button button-primary" href="/">Về trang chủ</Link></div></main>
  );
}
