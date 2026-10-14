"use client";

import { useEffect } from "react";

const revealSelectors = [
  ".v11-entry-label",
  ".v11-entry-grid > a",
  ".v11-heading",
  ".v12-service",
  ".homeV7-ecosystemRow",
  ".homeV7-project",
  ".homeV7-journeyStep",
  ".homeV7-expertiseCard",
  ".homeV7-galleryCard",
  ".homeV7-knowledgeCard",
  ".homeV7-capabilityItem",
].join(",");

const tiltSelectors = [
  ".v11-entry-grid > a",
  ".homeV7-galleryCard",
  ".homeV7-knowledgeCard",
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
        { threshold: 0.11, rootMargin: "0px 0px -7% 0px" },
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

    const hero = document.querySelector<HTMLElement>(".v11-hero");
    const onHeroPointer = (event: PointerEvent) => {
      if (!hero || reduced || event.pointerType === "touch") return;
      const rect = hero.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      hero.style.setProperty("--hero-x", `${Math.round(x * 100)}%`);
      hero.style.setProperty("--hero-y", `${Math.round(y * 100)}%`);
      hero.style.setProperty("--hero-shift-x", `${((x - 0.5) * 18).toFixed(2)}px`);
      hero.style.setProperty("--hero-shift-y", `${((y - 0.5) * 14).toFixed(2)}px`);
    };
    hero?.addEventListener("pointermove", onHeroPointer);

    const tilts = Array.from(document.querySelectorAll<HTMLElement>(tiltSelectors));
    const tiltCleanups = tilts.map((card) => {
      const onMove = (event: PointerEvent) => {
        if (reduced || event.pointerType === "touch") return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-y", `${(x * 3.2).toFixed(2)}deg`);
        card.style.setProperty("--tilt-x", `${(-y * 3.2).toFixed(2)}deg`);
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
      hero?.removeEventListener("pointermove", onHeroPointer);
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
