import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedPublications } from "@/lib/cms-store";
import { getPublicationTypeLabel } from "@/lib/publications";
import { formatPublicationDate } from "@/lib/publication-date";
import { newsCategories } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Tin tức & Sự kiện",
  description: "Tin hoạt động IAICT, góc nhìn chuyên môn, thông báo, dự án ứng dụng và các sự kiện được công bố chính thức.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const publications = await getPublishedPublications();
  const featuredPublication = publications.find((item) => item.featured) ?? publications[0];
  const remainingPublications = featuredPublication
    ? publications.filter((item) => item.slug !== featuredPublication.slug)
    : publications;

  return (
    <main id="main-content" className="news-page news-live-page">
      <section className="news-hero">
        <div className="news-hero-grid" aria-hidden="true" />
        <div className="shell news-hero-inner">
          <div>
            <div className="news-breadcrumb"><Link href="/">IAICT</Link><span>/</span><b>Tin tức</b></div>
            <p className="kicker">Tin tức & Sự kiện</p>
            <h1>Kênh thông tin chính thức của IAICT</h1>
            <p className="page-lead">Theo dõi hoạt động của Viện, dự án ứng dụng, chương trình đào tạo, góc nhìn chuyên môn và các thông báo được công bố chính thức.</p>
          </div>
          <aside className="news-hero-panel">
            <span>Editorial principles</span>
            <strong>Rõ nguồn. Đúng ngữ cảnh. Có kiểm chứng.</strong>
            <p>Nội dung IAICT được tách rõ với nguồn tham khảo bên ngoài. Các sự kiện chỉ xuất hiện khi lịch và thông tin tổ chức đã được xác nhận.</p>
          </aside>
        </div>
      </section>

      {featuredPublication ? (
        <section className="section news-featured-live-section">
          <div className="shell news-featured-live-grid">
            <Link href={`/tin-tuc/${featuredPublication.slug}`} className="news-featured-live-card">
              <div className="news-live-visual" aria-hidden="true">
                <span>IAICT / KNOWLEDGE</span>
                <strong>01 → 04</strong>
                <div><i>Nghiên cứu</i><i>Thử nghiệm</i><i>Triển khai</i><i>Chuyển giao</i></div>
              </div>
              <div className="news-featured-live-copy">
                <div className="news-live-meta">
                  <span>{getPublicationTypeLabel(featuredPublication.type)}</span>
                  <span>{formatPublicationDate(featuredPublication.publishedAt)}</span>
                  <span>{featuredPublication.readingTime}</span>
                </div>
                <p className="kicker">Nổi bật</p>
                <h2>{featuredPublication.title}</h2>
                <p>{featuredPublication.excerpt}</p>
                <strong>Đọc bài viết <i aria-hidden="true">→</i></strong>
              </div>
            </Link>

            <aside className="news-live-sidebar">
              <p className="kicker">Mới cập nhật</p>
              {remainingPublications.slice(0, 3).map((item, index) => (
                <Link href={`/tin-tuc/${item.slug}`} key={item.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{item.category}</b>
                    <strong>{item.title}</strong>
                    <small>{formatPublicationDate(item.publishedAt)}</small>
                  </div>
                </Link>
              ))}
            </aside>
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="shell admin-empty-state">
            <span>Newsroom</span>
            <strong>Chưa có nội dung được xuất bản.</strong>
            <p>Nội dung sẽ xuất hiện tại đây sau khi được duyệt và xuất bản từ CMS.</p>
          </div>
        </section>
      )}

      {remainingPublications.length ? (
        <section className="section section-tint news-library-live-section">
          <div className="shell">
            <div className="news-section-heading">
              <div><p className="kicker">Kho nội dung</p><h2>Tin, góc nhìn và thông báo</h2></div>
              <p>Kho nội dung công khai được đồng bộ trực tiếp từ CMS, với URL và metadata riêng cho từng bài viết.</p>
            </div>
            <div className="news-library-live-grid">
              {remainingPublications.map((item, index) => (
                <Link className="news-library-live-card" href={`/tin-tuc/${item.slug}`} key={item.slug}>
                  <div className="news-live-meta">
                    <span>{getPublicationTypeLabel(item.type)}</span>
                    <span>{formatPublicationDate(item.publishedAt)}</span>
                  </div>
                  <span className="news-library-live-index">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <div className="news-library-live-footer"><b>{item.category}</b><i aria-hidden="true">↗</i></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section news-event-ready-section">
        <div className="shell news-event-ready-grid">
          <div>
            <p className="kicker">Sự kiện & Hội thảo</p>
            <h2>Lịch sự kiện chỉ hiển thị khi thông tin đã được xác nhận</h2>
            <p>Hệ thống nội dung hỗ trợ loại “Sự kiện”. Khi có lịch chính thức, thông tin thời gian, địa điểm, hình thức và đăng ký sẽ được xuất bản tại đây và có thể đồng thời xuất hiện trên trang chủ.</p>
          </div>
          <div className="news-event-ready-card">
            <span>Event publishing flow</span>
            <div><b>01</b><strong>Xác nhận lịch</strong></div>
            <div><b>02</b><strong>Xuất bản thông tin</strong></div>
            <div><b>03</b><strong>Đăng ký / liên hệ</strong></div>
            <div><b>04</b><strong>Cập nhật sau sự kiện</strong></div>
          </div>
        </div>
      </section>

      <section className="section section-tint news-categories-section">
        <div className="shell">
          <div className="news-section-heading compact">
            <div><p className="kicker">Chuyên mục</p><h2>Đi theo chủ đề bạn quan tâm</h2></div>
          </div>
          <div className="chip-cloud premium-chip-cloud" aria-label="Chuyên mục tin tức">
            {newsCategories.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </section>

      <section className="section section-compact news-final-section">
        <div className="shell news-final-card">
          <div><p className="kicker kicker-light">Thông tin & Hợp tác</p><h2>Có nội dung hoặc chương trình cần trao đổi với IAICT?</h2><p>Liên hệ Viện để trao đổi về hoạt động, sự kiện, chương trình chuyên môn hoặc cơ hội hợp tác.</p></div>
          <Link className="button button-light" href="/lien-he">Liên hệ IAICT</Link>
        </div>
      </section>
    </main>
  );
}
