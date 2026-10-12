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

export function CategoryLanding({ eyebrow, title, intro, items = [], children }: CategoryLandingProps) {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <p className="kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-lead">{intro}</p>
        </div>
      </section>
      {items.length > 0 ? (
        <section className="section">
          <div className="shell taxonomy-grid">
            {items.map((item, index) => (
              <article className="taxonomy-card" key={item.title} id={item.title === "AI & Dữ liệu" ? "ai-du-lieu" : item.title === "IoT & Quan trắc" ? "iot-quan-trac" : undefined}>
                <span className="taxonomy-index">{String(index + 1).padStart(2, "0")}</span>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                {item.href ? <Link href={item.href}>Khám phá →</Link> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {children}
      <section className="section section-compact">
        <div className="shell final-cta">
          <div>
            <p className="kicker">Trao đổi nhu cầu</p>
            <h2>Cần một phương án phù hợp với bài toán thực tế?</h2>
          </div>
          <Link className="button button-primary" href="/lien-he">Liên hệ & Hợp tác</Link>
        </div>
      </section>
    </main>
  );
}
