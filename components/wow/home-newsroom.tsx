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
  },
  {
    no: "02",
    tag: "Khoa học & Công nghệ",
    title: "Từ nghiên cứu ứng dụng đến bài toán triển khai.",
    body: "Các nội dung về công nghệ, thử nghiệm, kiến trúc hệ thống và cách đưa kết quả nghiên cứu vào bối cảnh sử dụng thực tế.",
    href: "/du-an",
    cta: "Khám phá dự án",
  },
  {
    no: "03",
    tag: "AI & Dữ liệu",
    title: "Góc nhìn thực tiễn về dữ liệu, AI và tự động hóa.",
    body: "Tập trung vào dữ liệu đầu vào, quy trình, quyền truy cập, cách kiểm soát đầu ra và giá trị vận hành có thể đo lường.",
    href: "/san-pham-nen-tang#ai-du-lieu",
    cta: "Xem năng lực AI",
  },
  {
    no: "04",
    tag: "Sự kiện & Tập huấn",
    title: "Không gian chuyên môn cho chia sẻ, đào tạo và chuyển giao.",
    body: "Các hoạt động hội thảo, chuyên đề và tập huấn được tổ chức theo nhu cầu thực tế và chỉ công bố khi thông tin đã được xác minh.",
    href: "/dao-tao-tap-huan",
    cta: "Xem chương trình",
  },
] as const;

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
      className="final-newsroom"
      aria-labelledby="final-newsroom-title"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="shell">
        <div className="final-newsroom-head">
          <div>
            <p>IAICT / Newsroom</p>
            <h2 id="final-newsroom-title">Tin tức, hoạt động<br />và tri thức chuyên môn.</h2>
          </div>
          <div className="final-newsroom-head-copy">
            <span />
            <p>Nội dung được tổ chức theo chủ đề để vừa phục vụ truyền thông hoạt động, vừa giúp người đọc tiếp cận tri thức có giá trị sử dụng.</p>
          </div>
        </div>

        <div className="final-newsroom-grid">
          <article className="final-newsroom-lead" key={current.no} aria-live="polite">
            <div className="final-newsroom-copy">
              <div className="final-newsroom-meta">
                <span>{current.no} / 04</span>
                <strong>{current.tag}</strong>
              </div>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
              <Link href={current.href}>{current.cta}<span aria-hidden="true">↗</span></Link>
            </div>

            <div className="final-newsroom-visual" aria-hidden="true">
              <div className="final-newsroom-orbit orbit-a" />
              <div className="final-newsroom-orbit orbit-b" />
              <div className="final-newsroom-core">
                <span>IAICT</span>
                <small>{current.tag}</small>
              </div>
              <i className="final-newsroom-node node-a" />
              <i className="final-newsroom-node node-b" />
              <i className="final-newsroom-node node-c" />
            </div>

            <div className="final-newsroom-controls" aria-label="Điều khiển nội dung nổi bật">
              <button type="button" onClick={() => setActive((active - 1 + channels.length) % channels.length)} aria-label="Nội dung trước">←</button>
              <div className="final-newsroom-progress" aria-hidden="true">
                <span style={{ width: `${((active + 1) / channels.length) * 100}%` }} />
              </div>
              <button type="button" onClick={() => setActive((active + 1) % channels.length)} aria-label="Nội dung tiếp theo">→</button>
              <button type="button" className="final-newsroom-play" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>
                {playing ? "Ⅱ" : "▷"}<span>{playing ? "Tạm dừng" : "Tự động"}</span>
              </button>
            </div>
          </article>

          <div className="final-newsroom-side">
            <div className="final-newsroom-list" role="list" aria-label="Chủ đề nội dung">
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

            <aside className="final-event-desk" aria-label="Sự kiện và hội thảo">
              <div className="final-event-desk-top"><span>EVENT DESK</span><i /></div>
              <h3>Sự kiện & Hội thảo</h3>
              <p>Lịch hoạt động chỉ hiển thị khi có thông tin chính thức và đã được xác minh.</p>
              <div className="final-event-tags"><span>Hội thảo</span><span>Tập huấn</span><span>Chuyên đề</span></div>
              <div className="final-event-links">
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
