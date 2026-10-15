"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./home-hero.module.css";

const slides = [
  {
    kicker: "Applied Technology · End-to-end Capability",
    title: "Từ nghiên cứu ứng dụng đến những hệ thống vận hành trong thực tế.",
    lead: "IAICT kết nối nghiên cứu, kiến trúc giải pháp, phát triển hệ thống, triển khai hiện trường, chuyển giao và đào tạo trong một năng lực triển khai thống nhất.",
    primary: { label: "Khám phá năng lực IAICT", href: "/giai-phap-dich-vu" },
    secondary: { label: "Dự án & năng lực thực tế", href: "/du-an" },
    focus: "Applied Technology",
    signal: "Research → Architecture → Build → Operate → Transfer",
    image: "https://images.unsplash.com/photo-1764835711461-117d67799a7d?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
  {
    kicker: "AI · Data · Digital Workflow",
    title: "Biến dữ liệu thành năng lực vận hành và ra quyết định.",
    lead: "Từ tổ chức dữ liệu, tích hợp hệ thống đến AI có kiểm soát và tự động hóa quy trình — thiết kế để đi vào công việc thực, không dừng ở trình diễn công nghệ.",
    primary: { label: "AI & Dữ liệu", href: "/san-pham-nen-tang#ai-du-lieu" },
    secondary: { label: "Giải pháp & Dịch vụ", href: "/giai-phap-dich-vu" },
    focus: "AI & Data",
    signal: "Data → Workflow → Intelligence → Decision",
    image: "https://images.unsplash.com/photo-1768224656445-33d078c250b7?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
  {
    kicker: "IoT · Field Systems · Traceability",
    title: "Kết nối thế giới thực với hạ tầng dữ liệu và nền tảng số.",
    lead: "IAICT thiết kế chuỗi công nghệ từ cảm biến, gateway, kết nối hiện trường đến server, cơ sở dữ liệu, giám sát, truy xuất nguồn gốc và các ứng dụng khai thác dữ liệu.",
    primary: { label: "Dự án Trâm Rừng", href: "/du-an/tram-rung" },
    secondary: { label: "IoT & Quan trắc", href: "/san-pham-nen-tang#iot-quan-trac" },
    focus: "IoT & Field Data",
    signal: "Sense → Connect → Store → Understand → Act",
    image: "https://images.unsplash.com/photo-1783434640967-1e0098a362df?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
];

const topicLabels = ["Năng lực triển khai", "AI & Dữ liệu", "IoT & Hiện trường"];
const deliverySpectrum = [
  ["01", "Strategy", "Bài toán · lộ trình"],
  ["02", "Architecture", "Dữ liệu · hệ thống"],
  ["03", "Engineering", "AI · IoT · software"],
  ["04", "Deployment", "Cloud · field · integration"],
  ["05", "Transfer", "Đào tạo · vận hành"],
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
    }, 7600);
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

      <div className={`shell ${styles.inner}`}>
        <div className={styles.copy}>
          <div className={styles.indexRow}>
            <span>IAICT</span><i aria-hidden="true" /><span>{String(active + 1).padStart(2, "0")} / 03 · {slide.focus}</span>
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
        </div>

        <aside className={`${styles.sideCard} ia-v16-capability-panel`} aria-label="Phạm vi năng lực triển khai IAICT">
          <div className={styles.sideTop}><span>IAICT / Delivery Spectrum</span><i aria-hidden="true" /></div>
          <strong>{slide.focus}</strong>
          <p>{slide.signal}</p>
          <div className="ia-v16-spectrum" aria-label="Các lớp năng lực triển khai">
            {deliverySpectrum.map(([no, title, body]) => (
              <div className="ia-v16-spectrum-row" key={no}>
                <span>{no}</span>
                <strong>{title}</strong>
                <small>{body}</small>
              </div>
            ))}
          </div>
          <div className="ia-v16-capability-note">
            <span>END-TO-END</span>
            <p>Từ bài toán, dữ liệu và kiến trúc đến triển khai, vận hành và chuyển giao.</p>
          </div>
        </aside>
      </div>

      <div className={`shell ${styles.bottom}`}>
        <div className={styles.progressWrap} aria-hidden="true">
          <span>{String(active + 1).padStart(2, "0")}</span>
          <div className={styles.progress}><span style={{ width: `${((active + 1) / slides.length) * 100}%` }} /></div>
          <span>03</span>
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