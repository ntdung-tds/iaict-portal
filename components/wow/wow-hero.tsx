"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./wow.module.css";

const slides = [
  {
    kicker: "Applied Technology / Real Impact",
    title: "Công nghệ để giải bài toán thực tiễn.",
    lead: "IAICT kết nối nghiên cứu ứng dụng, triển khai công nghệ, chuyển giao và đào tạo trong một hành trình thống nhất.",
    primary: { label: "Khám phá giải pháp", href: "/giai-phap-dich-vu" },
    secondary: { label: "Dự án tiêu biểu", href: "/du-an" },
  },
  {
    kicker: "AI · Data · Digital workflow",
    title: "Biến dữ liệu thành năng lực ra quyết định.",
    lead: "Từ dữ liệu phân tán đến quy trình số, AI có kiểm soát và hệ thống hỗ trợ ra quyết định phù hợp từng tổ chức.",
    primary: { label: "AI & Dữ liệu", href: "/san-pham-nen-tang#ai-du-lieu" },
    secondary: { label: "Đào tạo & Tập huấn", href: "/dao-tao-tap-huan" },
  },
  {
    kicker: "IoT · Field data · Traceability",
    title: "Kết nối hiện trường với hệ thống số.",
    lead: "Thu thập dữ liệu cảm biến, truyền dẫn, lưu trữ, giám sát và mở rộng sang truy xuất nguồn gốc, quản lý vòng đời.",
    primary: { label: "Case study Trâm Rừng", href: "/du-an/tram-rung" },
    secondary: { label: "IoT & Quan trắc", href: "/san-pham-nen-tang#iot-quan-trac" },
  },
];

export function WowHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section className={styles.wowHero} aria-label="IAICT giới thiệu năng lực">
      <div className={`shell ${styles.heroShell}`}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <p className={styles.heroLead}>{slide.lead}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href={slide.primary.href}>{slide.primary.label}</Link>
            <Link className={styles.secondaryAction} href={slide.secondary.href}>{slide.secondary.label}</Link>
          </div>
          <div className={styles.heroMeta} aria-label="Bốn trụ cột IAICT">
            <span>Technology</span><span>Solutions</span><span>Transfer</span><span>Academy</span>
          </div>
        </div>

        <aside className={styles.command} aria-label="IAICT Digital Command Center - giao diện mô phỏng">
          <div className={styles.commandTop}>
            <strong>IAICT Digital Command Center</strong>
            <span className={styles.demoBadge}>DEMO MODE</span>
          </div>
          <div className={styles.commandCore}>
            <div className={styles.coreRing} aria-hidden="true" />
            <div className={styles.coreRing2} aria-hidden="true" />
            <div className={styles.core}><div><span>IAICT</span><strong>Connect</strong></div></div>
            <div className={`${styles.node} ${styles.nodeA}`}>AI</div>
            <div className={`${styles.node} ${styles.nodeB}`}>IoT</div>
            <div className={`${styles.node} ${styles.nodeC}`}>Data</div>
            <div className={`${styles.node} ${styles.nodeD}`}>DX</div>
          </div>
          <div className={styles.commandStats}>
            <div><span>Experience</span><strong>Public Portal</strong></div>
            <div><span>Operations</span><strong>Project Lab</strong></div>
            <div><span>Learning</span><strong>IAICT Academy</strong></div>
          </div>
        </aside>
      </div>
      <div className={styles.dots} role="tablist" aria-label="Chuyển slide giới thiệu">
        {slides.map((item, index) => (
          <button
            key={item.kicker}
            className={`${styles.dot} ${index === active ? styles.dotActive : ""}`}
            aria-label={`Slide ${index + 1}`}
            aria-selected={index === active}
            role="tab"
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}
