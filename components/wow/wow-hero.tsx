"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./wow.module.css";
import { CapabilityNetwork } from "./capability-network";

const slides = [
  {
    kicker: "Applied Technology · Real-world Value",
    title: "Ứng dụng công nghệ để tạo ra giá trị có thể triển khai.",
    lead: "IAICT kết nối nghiên cứu ứng dụng, thiết kế giải pháp, triển khai hệ thống, chuyển giao và đào tạo trong một hành trình thống nhất.",
    primary: { label: "Khám phá năng lực", href: "/giai-phap-dich-vu" },
    secondary: { label: "Dự án tiêu biểu", href: "/du-an" },
    focus: "Applied Technology",
    signal: "Technology → Solutions → Transfer → Academy",
  },
  {
    kicker: "AI · Data · Digital Workflow",
    title: "Biến dữ liệu thành năng lực ra quyết định.",
    lead: "Tổ chức dữ liệu, tự động hóa quy trình và ứng dụng AI có kiểm soát để hỗ trợ công việc, quản trị và ra quyết định.",
    primary: { label: "AI & Dữ liệu", href: "/san-pham-nen-tang#ai-du-lieu" },
    secondary: { label: "Giải pháp & Dịch vụ", href: "/giai-phap-dich-vu" },
    focus: "AI & Data",
    signal: "Data → Workflow → Intelligence → Decision",
  },
  {
    kicker: "IoT · Field Systems · Traceability",
    title: "Kết nối hiện trường với hệ thống số.",
    lead: "Từ cảm biến, gateway và kết nối hiện trường đến server, cơ sở dữ liệu, giám sát, truy xuất nguồn gốc và quản lý vòng đời.",
    primary: { label: "Trâm Rừng", href: "/du-an/tram-rung" },
    secondary: { label: "IoT & Quan trắc", href: "/san-pham-nen-tang#iot-quan-trac" },
    focus: "IoT & Field Data",
    signal: "Sense → Connect → Store → Understand",
  },
];

const topicLabels = ["Công nghệ ứng dụng", "AI & Dữ liệu", "IoT & Hiện trường"];

export function WowHero() {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!playing || hovered || focused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 7600);
    return () => window.clearInterval(timer);
  }, [playing, hovered, focused]);

  const slide = slides[active];

  return (
    <section className={`${styles.wowHero} v11-hero`} aria-label="IAICT - năng lực và định hướng"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className={`${styles.heroAtmosphere} v11-hero-atmosphere`} aria-hidden="true">
        <span className={styles.glowA} />
        <span className={styles.glowB} />
        <span className={styles.gridFade} />
      </div>

      <div className={`shell ${styles.heroShell} v11-hero-grid`}>
        <div className={styles.heroCopy}>
          <div className={`${styles.heroIndex} v11-overline`}><span>IAICT</span><i /> <span>{String(active + 1).padStart(2, "0")} / 03</span></div>
          <p className={`${styles.eyebrow} v11-eyebrow`}>{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <p className={`${styles.heroLead} v11-lead`}>{slide.lead}</p>

          <div className={styles.heroActions}>
            <Link className={`${styles.primaryAction} v11-primary`} href={slide.primary.href}>
              {slide.primary.label}<span aria-hidden="true">↗</span>
            </Link>
            <Link className={`${styles.secondaryAction} v11-secondary`} href={slide.secondary.href}>
              {slide.secondary.label}
            </Link>
          </div>

          <div className={`${styles.heroMeta} v11-meta`} aria-label="Hệ sinh thái IAICT">
            <span>Technology</span>
            <span>Solutions</span>
            <span>Transfer</span>
            <span>Academy</span>
          </div>
        </div>

        <CapabilityNetwork />
      </div>

      <div className={`shell ${styles.heroRail} v11-rail`}>
        <div className={`${styles.heroRailText} v11-rail-text`}>Research · Application · Integration · Transfer · Training</div>
        <div className="v12-topics" role="group" aria-label="Chuyển nội dung giới thiệu">
          {slides.map((item, index) => (
            <button
              key={item.kicker}
              disabled={!ready}
              className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
              aria-label={topicLabels[index]}
              aria-pressed={index === active}
              onClick={() => { setActive(index); setPlaying(false); }}
            ><span>{String(index + 1).padStart(2, "0")}</span><strong>{topicLabels[index]}</strong></button>
          ))}
          <button type="button" disabled={!ready} className="v12-play" onClick={() => setPlaying(!playing)} aria-pressed={playing} aria-label="Tự động chuyển nội dung">{playing ? "Ⅱ Tạm dừng" : "▷ Tự động"}</button>
        </div>
      </div>
    </section>
  );
}

