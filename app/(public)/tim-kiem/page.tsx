import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tìm kiếm" };

export default function SearchPage() {
  return (
    <main id="main-content"><section className="page-hero"><div className="shell page-hero-inner"><p className="kicker">Tìm kiếm</p><h1>Tìm nội dung trên IAICT</h1><p className="page-lead">Giao diện tìm kiếm đã sẵn sàng; chỉ mục nội dung D1/FTS sẽ được nối sau khi M0 remote database được xác nhận.</p></div></section><section className="section"><div className="shell search-shell"><label htmlFor="search-preview">Từ khóa</label><div className="search-row"><input id="search-preview" type="search" placeholder="Nhập sản phẩm, giải pháp, khóa học..." disabled /><button className="button button-primary" type="button" disabled>Tìm kiếm</button></div><p className="form-note">Tạm khóa để tránh tạo trải nghiệm tìm kiếm giả trước khi FTS/D1 sẵn sàng.</p></div></section></main>
  );
}
