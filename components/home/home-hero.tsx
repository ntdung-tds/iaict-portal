"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./home-hero.module.css";

const slides = [
  {
    kicker: "IAICT · Technology for Impact",
    title: "Công nghệ mạnh. Triển khai thật. Giá trị nhìn thấy được.",
    lead: "IAICT kết nối tư vấn, nghiên cứu ứng dụng, AI, dữ liệu, IoT, phát triển nền tảng, triển khai hiện trường, chuyển giao và đào tạo trong một hành trình thống nhất.",
    primary: { label: "Khám phá năng lực IAICT", href: "/giai-phap-dich-vu" },
    secondary: { label: "Xem dự án tiêu biểu", href: "/du-an" },
    focus: "Technology for Impact",
    signal: "Strategy → Technology → Deployment → Transfer",
    image: "https://images.unsplash.com/photo-1764835711461-117d67799a7d?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
  {
    kicker: "AI · Data · Automation",
    title: "Đưa AI vào công việc. Không chỉ vào bản trình diễn.",
    lead: "Từ dữ liệu phân tán đến quy trình số, trợ lý AI, phân tích và tự động hóa — IAICT thiết kế giải pháp để công nghệ đi vào vận hành thực tế.",
    primary: { label: "Khám phá AI & Dữ liệu", href: "/san-pham-nen-tang#ai-du-lieu" },
    secondary: { label: "Giải pháp cho tổ chức", href: "/giai-phap-dich-vu" },
    focus: "AI & Data",
    signal: "Data → Workflow → Intelligence → Decision",
    image: "https://images.unsplash.com/photo-1768224656445-33d078c250b7?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
  {
    kicker: "IoT · Traceability · Smart Systems",
    title: "Từ hiện trường đến trung tâm dữ liệu — một hệ thống liền mạch.",
    lead: "Cảm biến, gateway, kết nối, server, cơ sở dữ liệu, dashboard, truy xuất nguồn gốc và quản lý vòng đời được thiết kế như một chuỗi công nghệ thống nhất.",
    primary: { label: "Khám phá dự án Trâm Rừng", href: "/du-an/tram-rung" },
    secondary: { label: "IoT & Quan trắc", href: "/san-pham-nen-tang#iot-quan-trac" },
    focus: "IoT & Smart Systems",
    signal: "Sense → Connect → Store → Understand → Act",
    image: "https://images.unsplash.com/photo-1783434640967-1e0098a362df?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
  {
    kicker: "Transfer · Academy · Scale",
    title: "Không chỉ bàn giao công nghệ. Chúng tôi giúp tổ chức làm chủ công nghệ.",
    lead: "IAICT chuẩn hóa quy trình, tài liệu, đào tạo theo vai trò và hỗ trợ chuyển giao để hệ thống có thể tiếp tục vận hành, mở rộng và tạo giá trị sau triển khai.",
    primary: { label: "Đào tạo & Chuyển giao", href: "/dao-tao-tap-huan" },
    secondary: { label: "Chuyển giao công nghệ", href: "/chuyen-giao-cong-nghe" },
    focus: "Transfer & Academy",
    signal: "Build → Transfer → Operate → Improve → Scale",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
];

const topicLabels = ["Năng lực tổng thể", "AI & Dữ liệu", "IoT & Hệ thống", "Chuyển giao"];
const capabilityShowcase = [
  ["AI", "AI & GenAI", "Ứng dụng AI vào nghiệp vụ"],
  ["DATA", "Dữ liệu & Tích hợp", "Tổ chức và khai thác dữ liệu"],
  ["IOT", "IoT & Edge", "Kết nối dữ liệu hiện trường"],
  ["TRACE", "Truy xuất", "Minh bạch chuỗi và vòng đời"],
  ["SOFT", "Nền tảng số", "Thiết kế và phát triển hệ thống"],
  ["EDU", "Đào tạo & Chuyển giao", "Giúp tổ chức làm chủ công nghệ"],
];
const heroImageWidths = [960, 1600, 2200] as const;

function responsiveImageUrl(source: string, width: number, quality = 76) {
  const url = new URL(source);
  url.searchParams.set("auto", "format");
  url.searchParams.delete("fm");
  url.searchParams.set("q", String(quality));
  url.searchParams.set("w", String(width));
  return url.toString();
}

function responsiveImageSrcSet(source: string) {
  return heroImageWidths.map((width) => `${responsiveImageUrl(source, width)} ${width}w`).join(", ");
}

export function HomeHero() {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!playing || hovered || focused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6800);
    return () => window.clearInterval(timer);
  }, [playing, hovered, focused]);

  const slide = slides[active];

  return (
    <section
      className={styles.hero}
      aria-label="IAICT - năng lực và định hướng"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div key={slide.image} className={styles.background} aria-hidden="true">
        <img
          src={responsiveImageUrl(slide.image, 1600)}
          srcSet={responsiveImageSrcSet(slide.image)}
          sizes="100vw"
          alt=""
          loading={active === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={active === 0 ? "high" : "auto"}
        />
      </div>
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.texture} aria-hidden="true" />
      <div className="ia-v16-promo-orbit" aria-hidden="true"><i /><i /><i /></div>

      <div className={`shell ${styles.inner}`}>
        <div className={styles.copy}>
          <div className={styles.indexRow}>
            <span>IAICT</span><i aria-hidden="true" /><span>{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")} · {slide.focus}</span>
          </div>
          <p className={styles.eyebrow}>{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <p className={styles.lead}>{slide.lead}</p>

          <div className={styles.actions}>
            <Link className={styles.primary} href={slide.primary.href}>
              {slide.primary.label}<span aria-hidden="true">↗</span>
            </Link>
            <Link className={styles.secondary} href={slide.secondary.href}>
              {slide.secondary.label}
            </Link>
          </div>

          <div className="ia-v16-promo-tags" aria-label="Năng lực công nghệ nổi bật">
            <span>AI & DATA</span><span>IOT & EDGE</span><span>SOFTWARE</span><span>TRACEABILITY</span><span>TRANSFER</span>
          </div>
        </div>

        <aside className={`${styles.sideCard} ia-v16-capability-panel ia-v16-promo-panel`} aria-label="Năng lực nổi bật của IAICT">
          <div className={styles.sideTop}><span>IAICT / Capability Showcase</span><i aria-hidden="true" /></div>
          <strong>{slide.focus}</strong>
          <p>{slide.signal}</p>
          <div className="ia-v16-showcase-grid" aria-label="Các nhóm năng lực nổi bật">
            {capabilityShowcase.map(([code, title, body]) => (
              <div className="ia-v16-showcase-item" key={code}>
                <span>{code}</span>
                <div><strong>{title}</strong><small>{body}</small></div>
              </div>
            ))}
          </div>
          <div className="ia-v16-promo-statement">
            <span>END-TO-END DELIVERY</span>
            <strong>Từ bài toán thực tế đến hệ thống vận hành được.</strong>
          </div>
        </aside>
      </div>

      <div className={`shell ${styles.bottom}`}>
        <div className={styles.progressWrap} aria-hidden="true">
          <span>{String(active + 1).padStart(2, "0")}</span>
          <div className={styles.progress}><span style={{ width: `${((active + 1) / slides.length) * 100}%` }} /></div>
          <span>{String(slides.length).padStart(2, "0")}</span>
        </div>

        <div className={styles.topics} role="group" aria-label="Chuyển nội dung giới thiệu">
          {slides.map((item, index) => (
            <button
              key={item.kicker}
              disabled={!ready}
              className={`${styles.topic} ${index === active ? styles.topicActive : ""}`}
              aria-label={topicLabels[index]}
              aria-pressed={index === active}
              onClick={() => {
                setActive(index);
                setPlaying(false);
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{topicLabels[index]}</strong>
            </button>
          ))}
          <button
            type="button"
            disabled={!ready}
            className={styles.play}
            onClick={() => setPlaying(!playing)}
            aria-pressed={playing}
            aria-label="Tự động chuyển nội dung"
          >
            {playing ? "Ⅱ Tạm dừng" : "▷ Tự động"}
          </button>
        </div>
      </div>
    </section>
  );
}
