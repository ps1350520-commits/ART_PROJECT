"use client";

import { useEffect, useState } from "react";
import { SECTIONS, sectionIndexAt } from "./sections";

/**
 * Scroll state lives outside React so `useFrame` can read it every frame
 * without triggering a re-render. Components that need the *section* (a
 * low-frequency value) subscribe through `useActiveSection`.
 */
const state = {
  /** Global scroll progress, 0 at the top of the page, 1 at the bottom. */
  progress: 0,
  /** Index into SECTIONS. */
  sectionIndex: 0,
  /** True once the user has scrolled past the very top. */
  hasScrolled: false,
};

export const getScroll = () => state;

type Listener = (index: number) => void;
const listeners = new Set<Listener>();

const setProgress = (p: number) => {
  state.progress = p;
  if (p > 0.001) state.hasScrolled = true;
  const next = sectionIndexAt(p);
  if (next !== state.sectionIndex) {
    state.sectionIndex = next;
    listeners.forEach((l) => l(next));
  }
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Installs the scroll driver. Uses Lenis for smoothing when motion is
 * allowed, and falls back to raw scroll events otherwise. Returns a cleanup.
 */
export const initScrollDriver = (): (() => void) => {
  let raf = 0;
  let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
  let disposed = false;

  const read = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
  };

  if (prefersReducedMotion()) {
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    read();
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }

  import("lenis").then(({ default: Lenis }) => {
    if (disposed) return;
    const instance = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    instance.on("scroll", read);
    lenis = instance as unknown as typeof lenis;
    const loop = (time: number) => {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }).catch(() => {
    // The smoothing chunk failed to load; plain scroll events still drive
    // the camera, just without the easing.
    if (disposed) return;
    window.addEventListener("scroll", read, { passive: true });
    read();
  });

  window.addEventListener("resize", read);
  read();

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", read);
    window.removeEventListener("scroll", read);
    lenis?.destroy();
  };
};

/** Re-renders only when the active section changes. */
export const useActiveSection = () => {
  const [index, setIndex] = useState(state.sectionIndex);
  useEffect(() => {
    const listener: Listener = (i) => setIndex(i);
    listeners.add(listener);
    setIndex(state.sectionIndex);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return { index, section: SECTIONS[index] };
};

/** Media-query hook that is SSR-safe (always false on the server). */
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
};
