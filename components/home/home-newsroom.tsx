"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const channels = [
  {
    no: "01",
    tag: "Hoạt động Viện",
    title: "Thông tin chính thức và hoạt động của IAICT.",
    body: "Theo dõi các chương trình, hoạt động chuyên môn, hợp tác và thông tin được IAICT công bố chính thức.",
    href: "/tin-tuc",
    cta: "Xem Tin tức",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&fm=jpg&q=82&w=1800",
  },
  {
    no: "02",
    tag: "Khoa học & Công nghệ",
    title: "Từ nghiên cứu ứng dụng đến bài toán triển khai.",
    body: "Các nội dung về công nghệ, thử nghiệm, kiến trúc hệ thống và cách đưa kết quả nghiên cứu vào bối cảnh sử dụng thực tế.",
    href: "/du-an",
    cta: "Khám phá dự án",
    image: "https://images.unsplash.com/photo-1764835711461-117d67799a7d?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800",
  },
  {
    no: "03",
    tag: "AI & Dữ liệu",
    title: "Góc nhìn thực tiễn về dữ liệu, AI và tự động hóa.",
    body: "Tập trung vào dữ liệu đầu vào, quy trình, quyền truy cập, cách kiểm soát đầu ra và giá trị vận hành có thể đo lường.",
    href: "/san-pham-nen-tang#ai-du-lieu",
    cta: "Xem năng lực AI",
    image: "https://images.unsplash.com/photo-1768224656445-33d078c250b7?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800",
  },
  {
    no: "04",
    tag: "Sự kiện & Tập huấn",
    title: "Không gian chuyên môn cho chia sẻ, đào tạo và chuyển giao.",
    body: "Các hoạt động hội thảo, chuyên đề và tập huấn được tổ chức theo nhu cầu thực tế và chỉ công bố khi thông tin đã được xác minh.",
    href: "/dao-tao-tap-huan",
    cta: "Xem chương trình",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&fm=jpg&q=82&w=1800",
  },
] as const;

const newsroomImageWidths = [480, 800, 1200] as const;

function responsiveImageUrl(source: string, width: number, quality = 74) {
  const url = new URL(source);
  url.searchParams.set("auto", "format");
  url.searchParams.delete("fm");
  url.searchParams.set("q", String(quality));
  url.searchParams.set("w", String(width));
  return url.toString();
}

function responsiveImageSrcSet(source: string) {
  return newsroomImageWidths.map((width) => `${responsiveImageUrl(source, width)} ${width}w`).join(", ");
}

export function HomeNewsroom() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (!playing || hovered || focused || reduced) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % channels.length), 6800);
    return () => window.clearInterval(timer);
  }, [focused, hovered, playing, reduced]);

  const current = channels[active];

  return (
    <section
      className="ia-newsroom"
      aria-labelledby="newsroom-title"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="shell">
        <div className="ia-newsroom-head">
          <div>
            <p>IAICT / Newsroom</p>
            <h2 id="newsroom-title">Tin tức, hoạt động<br />và tri thức chuyên môn.</h2>
          </div>
          <div className="ia-newsroom-head-copy">
            <span />
            <p>Nội dung được tổ chức theo chủ đề để vừa phục vụ truyền thông hoạt động, vừa giúp người đọc tiếp cận tri thức có giá trị sử dụng.</p>
          </div>
        </div>

        <div className="ia-newsroom-grid">
          <article className="ia-newsroom-lead" key={current.no} aria-live="polite">
            <div className="ia-newsroom-copy">
              <div className="ia-newsroom-meta">
                <span>{current.no} / 04</span>
                <strong>{current.tag}</strong>
              </div>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
              <Link href={current.href}>{current.cta}<span aria-hidden="true">↗</span></Link>
            </div>

            <div className="ia-newsroom-visual" aria-hidden="true">
              <img
                src={responsiveImageUrl(current.image, 800)}
                srcSet={responsiveImageSrcSet(current.image)}
                sizes="(max-width: 560px) 205px, (max-width: 820px) 240px, 40vw"
                alt=""
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div className="ia-newsroom-photo-shade" />
              <div className="ia-newsroom-photo-label">
                <span>IAICT / {current.tag}</span>
                <strong>{current.no}</strong>
              </div>
            </div>

            <div className="ia-newsroom-controls" aria-label="Điều khiển nội dung nổi bật">
              <button type="button" onClick={() => setActive((active - 1 + channels.length) % channels.length)} aria-label="Nội dung trước">←</button>
              <div className="ia-newsroom-progress" aria-hidden="true">
                <span style={{ width: `${((active + 1) / channels.length) * 100}%` }} />
              </div>
              <button type="button" onClick={() => setActive((active + 1) % channels.length)} aria-label="Nội dung tiếp theo">→</button>
              <button type="button" className="ia-newsroom-play" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>
                {playing ? "Ⅱ" : "▷"}<span>{playing ? "Tạm dừng" : "Tự động"}</span>
              </button>
            </div>
          </article>

          <div className="ia-newsroom-side">
            <div className="ia-newsroom-list" role="list" aria-label="Chủ đề nội dung">
              {channels.map((item, index) => (
                <button
                  type="button"
                  role="listitem"
                  key={item.no}
                  className={index === active ? "is-active" : undefined}
                  onClick={() => {
                    setActive(index);
                    setPlaying(false);
                  }}
                  aria-pressed={index === active}
                >
                  <span>{item.no}</span>
                  <div><small>{item.tag}</small><strong>{item.title}</strong></div>
                  <b aria-hidden="true">↗</b>
                </button>
              ))}
            </div>

            <aside className="ia-event-desk" aria-label="Sự kiện và hội thảo">
              <div className="ia-event-desk-top"><span>EVENT DESK</span><i /></div>
              <h3>Sự kiện & Hội thảo</h3>
              <p>Lịch hoạt động chỉ hiển thị khi có thông tin chính thức và đã được xác minh.</p>
              <div className="ia-event-tags"><span>Hội thảo</span><span>Tập huấn</span><span>Chuyên đề</span></div>
              <div className="ia-event-links">
                <Link href="/tin-tuc">Theo dõi thông tin <span>↗</span></Link>
                <Link href="/dao-tao-tap-huan">Chương trình đào tạo <span>↗</span></Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
