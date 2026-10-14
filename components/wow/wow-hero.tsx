"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./wow-hero-v13.module.css";

const slides = [
  {
    kicker: "Applied Technology · Real-world Value",
    title: "Ứng dụng công nghệ để tạo ra giá trị có thể triển khai.",
    lead: "IAICT kết nối nghiên cứu ứng dụng, thiết kế giải pháp, triển khai hệ thống, chuyển giao và đào tạo trong một hành trình thống nhất.",
    primary: { label: "Khám phá năng lực", href: "/giai-phap-dich-vu" },
    secondary: { label: "Dự án tiêu biểu", href: "/du-an" },
    focus: "Applied Technology",
    signal: "Research → Design → Prove → Transfer",
    image: "https://images.unsplash.com/photo-1764835711461-117d67799a7d?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
  {
    kicker: "AI · Data · Digital Workflow",
    title: "Biến dữ liệu thành năng lực ra quyết định.",
    lead: "Tổ chức dữ liệu, tự động hóa quy trình và ứng dụng AI có kiểm soát để hỗ trợ công việc, quản trị và ra quyết định.",
    primary: { label: "AI & Dữ liệu", href: "/san-pham-nen-tang#ai-du-lieu" },
    secondary: { label: "Giải pháp & Dịch vụ", href: "/giai-phap-dich-vu" },
    focus: "AI & Data",
    signal: "Data → Workflow → Intelligence → Decision",
    image: "https://images.unsplash.com/photo-1768224656445-33d078c250b7?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
  {
    kicker: "IoT · Field Systems · Traceability",
    title: "Kết nối hiện trường với hệ thống số.",
    lead: "Từ cảm biến, gateway và kết nối hiện trường đến server, cơ sở dữ liệu, giám sát, truy xuất nguồn gốc và quản lý vòng đời.",
    primary: { label: "Trâm Rừng", href: "/du-an/tram-rung" },
    secondary: { label: "IoT & Quan trắc", href: "/san-pham-nen-tang#iot-quan-trac" },
    focus: "IoT & Field Data",
    signal: "Sense → Connect → Store → Understand",
    image: "https://images.unsplash.com/photo-1783434640967-1e0098a362df?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=2400",
  },
];

const topicLabels = ["Công nghệ ứng dụng", "AI & Dữ liệu", "IoT & Hiện trường"];

export function WowHero() {
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
      <div
        key={slide.image}
        className={styles.background}
        aria-hidden="true"
        style={{ backgroundImage: `url("${slide.image}")` }}
      />
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

        <aside className={styles.sideCard} aria-label="Thông tin định vị IAICT">
          <div className={styles.sideTop}><span>IAICT / Capability Focus</span><i aria-hidden="true" /></div>
          <strong>{slide.focus}</strong>
          <p>{slide.signal}</p>
          <div className={styles.sideStats}>
            <span><b>04</b><small>trụ cột năng lực</small></span>
            <span><b>01</b><small>hành trình triển khai</small></span>
            <span><b>360°</b><small>từ bài toán đến vận hành</small></span>
            <span><b>IAICT</b><small>applied technology</small></span>
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
