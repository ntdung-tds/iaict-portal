import Link from "next/link";
import type { ReactNode } from "react";
import type { TaxonomyCard } from "@/lib/public-content";

type CategoryLandingProps = {
  eyebrow: string;
  title: string;
  intro: string;
  items?: TaxonomyCard[];
  children?: ReactNode;
};

const deliverySignals = [
  { step: "01", label: "Làm rõ bài toán", detail: "Mục tiêu • dữ liệu • điều kiện thực tế" },
  { step: "02", label: "Thiết kế phương án", detail: "Kiến trúc • phạm vi • tiêu chí đầu ra" },
  { step: "03", label: "Triển khai & làm chủ", detail: "Thử nghiệm • chuyển giao • vận hành" },
];

function getAnchorId(title: string) {
  if (title === "AI & Dữ liệu") return "ai-du-lieu";
  if (title === "IoT & Quan trắc") return "iot-quan-trac";
  return undefined;
}

export function CategoryLanding({ eyebrow, title, intro, items = [], children }: CategoryLandingProps) {
  return (
    <main id="main-content" className="premium-category-page">
      <section className="page-hero premium-category-hero">
        <div className="category-hero-grid" aria-hidden="true" />
        <div className="shell category-hero-inner">
          <div className="category-hero-copy">
            <div className="category-breadcrumb">
              <Link href="/">IAICT</Link>
              <span aria-hidden="true">/</span>
              <b>{eyebrow.replace("IAICT ", "")}</b>
            </div>
            <p className="kicker category-kicker">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="page-lead category-lead">{intro}</p>
            <div className="category-hero-actions">
              <a className="button button-primary category-primary-button" href="#nang-luc">
                Khám phá năng lực <span aria-hidden="true">↓</span>
              </a>
              <Link className="category-inline-link" href="/lien-he">Trao đổi nhu cầu ↗</Link>
            </div>
          </div>

          <aside className="category-delivery-card" aria-label="Cách IAICT tiếp cận bài toán">
            <div className="category-delivery-head">
              <span>IAICT Delivery Framework</span>
              <strong>Từ nhu cầu đến khả năng vận hành</strong>
            </div>
            <div className="category-delivery-steps">
              {deliverySignals.map((signal) => (
                <div key={signal.step}>
                  <span>{signal.step}</span>
                  <div>
                    <strong>{signal.label}</strong>
                    <small>{signal.detail}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="category-delivery-foot">
              <span>Applied</span>
              <span>Transferable</span>
              <span>Scalable</span>
            </div>
          </aside>
        </div>
      </section>

      {items.length > 0 ? (
        <section className="section category-capability-section" id="nang-luc">
          <div className="shell">
            <div className="category-section-heading">
              <div>
                <p className="kicker">Cấu trúc năng lực</p>
                <h2>Các nhóm trọng tâm</h2>
              </div>
              <p>Được tổ chức để dễ lựa chọn theo bài toán, sau đó có thể kết hợp thành phương án triển khai tổng thể.</p>
            </div>
            <div className="taxonomy-grid premium-taxonomy-grid">
              {items.map((item, index) => (
                <article className="taxonomy-card premium-taxonomy-card" key={item.title} id={getAnchorId(item.title)}>
                  <div className="taxonomy-card-top">
                    <span className="taxonomy-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="taxonomy-signal" aria-hidden="true" />
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  {item.href ? (
                    <Link href={item.href}>Khám phá chi tiết <span aria-hidden="true">→</span></Link>
                  ) : (
                    <span className="taxonomy-ready">Sẵn sàng cấu hình theo nhu cầu</span>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {children}

      <section className="section section-compact category-final-section">
        <div className="shell final-cta category-final-cta">
          <div>
            <p className="kicker kicker-light">Trao đổi nhu cầu</p>
            <h2>Cần một phương án phù hợp với bài toán thực tế?</h2>
            <p>IAICT có thể cùng làm rõ phạm vi, hạ tầng, dữ liệu, cách triển khai và lộ trình chuyển giao trước khi chốt giải pháp.</p>
          </div>
          <div className="category-final-actions">
            <Link className="button button-light" href="/lien-he">Liên hệ & Hợp tác</Link>
            <Link className="category-final-link" href="/du-an">Xem dự án tiêu biểu →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
