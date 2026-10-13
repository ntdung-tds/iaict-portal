import Link from "next/link";
import { formatPublicationDate, publications } from "@/lib/publications";

type DataPlaceholderProps = {
  label: string;
  title: string;
  description: string;
};

export function DataPlaceholder({ label, title, description }: DataPlaceholderProps) {
  if (label === "CMS / Articles") {
    return (
      <div className="data-placeholder home-news-live" aria-label="Tin tức và sự kiện mới cập nhật">
        <div className="home-news-live-head">
          <span>IAICT / Newsroom</span>
          <Link href="/tin-tuc">Xem tất cả →</Link>
        </div>
        <div className="home-news-live-list">
          {publications.slice(0, 3).map((item, index) => (
            <Link href={`/tin-tuc/${item.slug}`} key={item.slug}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <span>{item.category} • {formatPublicationDate(item.publishedAt)}</span>
                <strong>{item.title}</strong>
              </div>
              <i aria-hidden="true">↗</i>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="data-placeholder" role="status">
      <span>{label}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
