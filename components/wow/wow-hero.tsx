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
    <section className={styles.wowHero} aria-label="IAICT - năng lực và định hướng">
      <div className={styles.heroAtmosphere} aria-hidden="true">
        <span className={styles.glowA} />
        <span className={styles.glowB} />
        <span className={styles.gridFade} />
      </div>

      <div className={`shell ${styles.heroShell}`}>
        <div className={styles.heroCopy}>
          <div className={styles.heroIndex}><span>IAICT</span><i /> <span>01 — 04</span></div>
          <p className={styles.eyebrow}>{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <p className={styles.heroLead}>{slide.lead}</p>

          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href={slide.primary.href}>
              {slide.primary.label}<span aria-hidden="true">↗</span>
            </Link>
            <Link className={styles.secondaryAction} href={slide.secondary.href}>
              {slide.secondary.label}
            </Link>
          </div>

          <div className={styles.heroMeta} aria-label="Hệ sinh thái IAICT">
            <span>Technology</span>
            <span>Solutions</span>
            <span>Transfer</span>
            <span>Academy</span>
          </div>
        </div>

        <aside className={styles.nexus} aria-label="Mô hình năng lực IAICT">
          <div className={styles.nexusTop}>
            <div>
              <small>IAICT / Capability Nexus</small>
              <strong>{slide.focus}</strong>
            </div>
            <span className={styles.liveSignal}>Connected</span>
          </div>

          <div className={styles.nexusStage}>
            <div className={styles.orbitOuter} aria-hidden="true" />
            <div className={styles.orbitMiddle} aria-hidden="true" />
            <div className={styles.orbitInner} aria-hidden="true" />

            <div className={styles.nexusCore}>
              <span>IAICT</span>
              <strong>APPLIED</strong>
              <small>technology</small>
            </div>

            {orbitLabels.map((label, index) => (
              <div className={`${styles.orbitNode} ${styles[`orbitNode${index + 1}`]}`} key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>

          <div className={styles.nexusFooter}>
            <span>{slide.signal}</span>
            <div className={styles.signalBars} aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
        </aside>
      </div>

      <div className={`shell ${styles.heroRail}`}>
        <div className={styles.heroRailText}>Research · Application · Integration · Transfer · Training</div>
        <div className={styles.dots} role="tablist" aria-label="Chuyển nội dung giới thiệu">
          {slides.map((item, index) => (
            <button
              key={item.kicker}
              className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
              aria-label={`Nội dung ${index + 1}`}
              aria-selected={index === active}
              role="tab"
              onClick={() => setActive(index)}
            ><span>{String(index + 1).padStart(2, "0")}</span></button>
          ))}
        </div>
      </div>
    </section>
  );
}
