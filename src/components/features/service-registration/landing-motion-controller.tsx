"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const LANDING_MOTION_QUERIES = {
  desktop: "(min-width: 1024px)",
  mobile: "(max-width: 1023px)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface LandingMotionControllerProps {
  children: ReactNode;
}

/**
 * Landing-only GSAP lifecycle boundary. Visual timelines are added by the
 * approved section slices; this foundation intentionally leaves SSR content
 * at its final visible state.
 */
export function LandingMotionController({ children }: LandingMotionControllerProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      const prefersReducedMotion = window.matchMedia?.(
        LANDING_MOTION_QUERIES.reducedMotion,
      ).matches;

      function createHeroTimeline() {
        const heroItems = scope.current?.querySelectorAll("[data-hero-motion]");
        if (prefersReducedMotion || !heroItems?.length) return undefined;

        const timeline = gsap.timeline({ defaults: { ease: "power2.out" } }).from(heroItems, {
          autoAlpha: 0,
          clearProps: "transform,opacity,visibility",
          duration: 0.48,
          stagger: 0.08,
          y: 18,
        });

        gsap.to("[data-flow-path]", {
          duration: 4,
          ease: "none",
          repeat: -1,
          strokeDashoffset: -64,
        });
        gsap.to("[data-core-node]", {
          duration: 2.4,
          ease: "sine.inOut",
          repeat: -1,
          scale: 1.035,
          yoyo: true,
        });
        gsap.to("[data-flow-node]", {
          duration: 3.2,
          ease: "sine.inOut",
          repeat: -1,
          stagger: { each: 0.45, yoyo: true, repeat: -1 },
          y: -5,
        });
        gsap.to("[data-system-status]", {
          autoAlpha: 0.45,
          duration: 1.1,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        return timeline;
      }

      function createScrollScenes() {
        if (prefersReducedMotion || !scope.current) return;

        scope.current.querySelectorAll<HTMLElement>("[data-landing-reveal]").forEach((section) => {
          const items = section.querySelectorAll("[data-reveal-item]");
          gsap.from(items.length ? items : section, {
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            y: 34,
            scrollTrigger: { trigger: section, start: "top 78%", once: true },
          });
        });

      }

      media.add(LANDING_MOTION_QUERIES.desktop, () => { createHeroTimeline(); createScrollScenes(); });
      media.add(LANDING_MOTION_QUERIES.mobile, () => { createHeroTimeline(); createScrollScenes(); });
      media.add(LANDING_MOTION_QUERIES.reducedMotion, () => undefined);

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="contents" data-landing-motion-root>
      {children}
    </div>
  );
}
