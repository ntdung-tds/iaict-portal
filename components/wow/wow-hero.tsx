"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./wow.module.css";

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

const orbitLabels = ["AI", "IoT", "DATA", "DX"];

export function WowHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 7600);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section className={`${styles.wowHero} v11-hero`} aria-label="IAICT - năng lực và định hướng">
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

        <aside className={`${styles.nexus} v11-visual`} aria-label="Mô hình năng lực IAICT">
          <div className={`${styles.nexusTop} v11-visual-top`}>
            <div>
              <small>IAICT / Capability Nexus</small>
              <strong>{slide.focus}</strong>
            </div>
            <span className={styles.liveSignal}>Connected</span>
          </div>

          <div className={`${styles.nexusStage} v11-visual-stage`}>
            <div className={styles.orbitOuter} aria-hidden="true" />
            <div className={styles.orbitMiddle} aria-hidden="true" />
            <div className={styles.orbitInner} aria-hidden="true" />

            <div className={`${styles.nexusCore} v11-visual-core`}>
              <span>IAICT</span>
              <strong>APPLIED</strong>
              <small>technology</small>
            </div>

            {orbitLabels.map((label, index) => (
              <div className={`${styles.orbitNode} v11-visual-node ${styles[`orbitNode${index + 1}`]}`} key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>

          <div className={`${styles.nexusFooter} v11-visual-footer`}>
            <span>{slide.signal}</span>
            <div className={styles.signalBars} aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
        </aside>
      </div>

      <div className={`shell ${styles.heroRail} v11-rail`}>
        <div className={`${styles.heroRailText} v11-rail-text`}>Research · Application · Integration · Transfer · Training</div>
        <div className={`${styles.dots} v11-tabs`} role="group" aria-label="Chuyển nội dung giới thiệu">
          {slides.map((item, index) => (
            <button
              key={item.kicker}
              className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
              aria-label={`Nội dung ${index + 1}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            ><span>{String(index + 1).padStart(2, "0")}</span></button>
          ))}
        </div>
      </div>
    </section>
  );
}

