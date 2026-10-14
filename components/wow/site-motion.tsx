"use client";

import { useEffect } from "react";

const revealSelectors = [
  ".ia-entry-label",
  ".ia-entry-grid > a",
  ".ia-section-heading",
  ".ia-service-row",
  ".ia-ecosystem-row",
  ".ia-project",
  ".final-project-architecture",
  ".ia-journey-step",
  ".ia-expertise-card",
  ".ia-gallery-card",
  ".final-newsroom-head",
  ".final-newsroom-lead",
  ".final-newsroom-list > button",
  ".final-event-desk",
  ".ia-knowledge-card",
  ".ia-capability-item",
  ".v6-card",
  ".v8-card",
  ".v8-principle",
  ".v8-topic",
  ".v8-story",
  ".v8-news article",
  ".v9-card",
  ".v9-feature",
  ".v9-path",
].join(",");

const tiltSelectors = [
  ".ia-entry-grid > a",
  ".ia-gallery-card",
  ".ia-knowledge-card",
  ".final-event-desk",
  ".v6-card",
  ".v8-card",
  ".v9-card",
].join(",");

export function SiteMotion() {
  useEffect(() => {
    const doc = document.documentElement;
    const body = document.body;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    doc.classList.add("iaict-motion-ready");

    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(revealSelectors));
    revealItems.forEach((item, index) => {
      item.classList.add("iaict-reveal");
      item.style.setProperty("--reveal-order", String(index % 6));
    });

    let observer: IntersectionObserver | null = null;
    if (reduced) {
      revealItems.forEach((item) => item.classList.add("iaict-visible"));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            (entry.target as HTMLElement).classList.add("iaict-visible");
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
      );
      revealItems.forEach((item) => observer?.observe(item));
    }

    let previousY = window.scrollY;
    let scrollFrame = 0;
    const updateScroll = () => {
      scrollFrame = 0;
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      doc.style.setProperty("--iaict-scroll", String(Math.min(1, y / max)));
      body.classList.toggle("iaict-scrolled", y > 22);
      if (Math.abs(y - previousY) > 8) {
        body.dataset.scrollDirection = y > previousY ? "down" : "up";
        previousY = y;
      }
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
    };
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const tilts = Array.from(document.querySelectorAll<HTMLElement>(tiltSelectors));
    const tiltCleanups = tilts.map((card) => {
      const onMove = (event: PointerEvent) => {
        if (reduced || event.pointerType === "touch" || window.innerWidth < 900) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-y", `${(x * 2.4).toFixed(2)}deg`);
        card.style.setProperty("--tilt-x", `${(-y * 2.4).toFixed(2)}deg`);
        card.classList.add("iaict-tilt-active");
      };
      const onLeave = () => {
        card.style.removeProperty("--tilt-y");
        card.style.removeProperty("--tilt-x");
        card.classList.remove("iaict-tilt-active");
      };
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      };
    });

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      tiltCleanups.forEach((cleanup) => cleanup());
      doc.classList.remove("iaict-motion-ready");
      body.classList.remove("iaict-scrolled");
      delete body.dataset.scrollDirection;
    };
  }, []);

  return (
    <div className="iaict-scroll-progress" aria-hidden="true">
      <span />
    </div>
  );
}
