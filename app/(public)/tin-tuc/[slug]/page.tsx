import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPublication, getPublishedPublications } from "@/lib/cms-store";
import { getPublicationTypeLabel } from "@/lib/publications";
import { formatPublicationDate } from "@/lib/publication-date";

type PublicationPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PublicationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublishedPublication(slug);
  if (!publication) return { title: "Không tìm thấy bài viết" };

  return {
    title: publication.title,
    description: publication.excerpt,
    alternates: { canonical: `/tin-tuc/${publication.slug}` },
    openGraph: {
      type: "article",
      title: publication.title,
      description: publication.excerpt,
      url: `/tin-tuc/${publication.slug}`,
      publishedTime: `${publication.publishedAt}T00:00:00+07:00`,
      section: publication.category,
      tags: publication.keywords,
    },
  };
}

export default async function PublicationPage({ params }: PublicationPageProps) {
  const { slug } = await params;
  const [publication, publications] = await Promise.all([
    getPublishedPublication(slug),
    getPublishedPublications(),
  ]);
  if (!publication) notFound();

  const related = publications
    .filter((item) => item.slug !== publication.slug)
    .filter((item) => item.category === publication.category || item.type === publication.type)
    .slice(0, 3);

  return (
    <main id="main-content" className="publication-page">
      <article>
        <header className="publication-hero">
          <div className="publication-hero-grid" aria-hidden="true" />
          <div className="shell publication-hero-inner">
            <div className="publication-breadcrumb">
              <Link href="/">IAICT</Link><span>/</span><Link href="/tin-tuc">Tin tức</Link><span>/</span><b>{publication.category}</b>
            </div>
            <div className="publication-meta">
              <span>{getPublicationTypeLabel(publication.type)}</span>
              <span>{formatPublicationDate(publication.publishedAt)}</span>
              <span>{publication.readingTime}</span>
            </div>
            <h1>{publication.title}</h1>
            <p className="publication-excerpt">{publication.excerpt}</p>
          </div>
        </header>

        <div className="shell publication-layout">
          <aside className="publication-rail">
            <div className="publication-rail-card">
              <span>IAICT Editorial</span>
              <strong>{publication.category}</strong>
              <p>Nội dung do IAICT biên tập và công bố trên cổng thông tin của Viện.</p>
            </div>
            <div className="publication-keywords">
              <span>Chủ đề</span>
              <div>{publication.keywords.map((keyword) => <b key={keyword}>{keyword}</b>)}</div>
            </div>
          </aside>

          <div className="publication-body">
            <p className="publication-lede">{publication.lede}</p>
            {publication.sections.map((section, index) => (
              <section key={`${publication.slug}-${index}`}>
                {section.heading ? <h2>{section.heading}</h2> : null}
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets?.length ? (
                  <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                ) : null}
              </section>
            ))}

            <div className="publication-endnote">
              <span>IAICT</span>
              <p>Trao đổi với Viện nếu đơn vị của bạn đang có bài toán tương tự hoặc cần làm rõ khả năng triển khai.</p>
              <Link href="/lien-he">Liên hệ & Hợp tác →</Link>
            </div>
          </div>
        </div>
      </article>

      {related.length ? (
        <section className="section publication-related-section">
          <div className="shell">
            <div className="publication-related-heading">
              <div><p className="kicker">Đọc tiếp</p><h2>Nội dung liên quan</h2></div>
              <Link href="/tin-tuc">Xem toàn bộ tin tức →</Link>
            </div>
            <div className="publication-related-grid">
              {related.map((item) => (
                <Link href={`/tin-tuc/${item.slug}`} key={item.slug}>
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <b>{formatPublicationDate(item.publishedAt)}</b>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
