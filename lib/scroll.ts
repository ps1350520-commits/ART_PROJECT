"use client";

import { useEffect, useState } from "react";
import { CAMERA_TRACK, SECTIONS, SECTION_RANGES, makeCameraTrack, sectionIndexAt } from "./sections";
import type { CameraTrack, SectionId } from "./sections";
import { clamp, smoothstep } from "./math";

/**
 * Scroll state lives outside React so `useFrame` can read it every frame
 * without triggering a re-render. Components that need the *section* (a
 * low-frequency value) subscribe through `useActiveSection`.
 */
const state = {
  /** Global scroll progress, 0 at the top of the page, 1 at the bottom. */
  progress: 0,
  /** Raw scroll offset in pixels, for anything measured against the DOM. */
  scrollY: 0,
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
  const next = indexAt(p);
  if (next !== state.sectionIndex) {
    state.sectionIndex = next;
    listeners.forEach((l) => l(next));
  }
};

/* ------------------------- measured layout -------------------------- */

/**
 * `lib/sections` declares each section's height in viewport units, but the
 * document does not always agree: the assembly section carries a photo
 * gallery and the specs section is laid out in normal flow, so both render
 * taller than the height declared for them. Mapping scroll progress through
 * the declared heights therefore drifts further out of step with the DOM
 * the further down the page you are, and the camera, the callouts and the
 * copy panels end up describing a different section from the one on screen.
 *
 * So the ranges are measured from the laid-out page instead, and everything
 * scroll-driven reads them from here.
 */
interface Range {
  start: number;
  end: number;
}

let measured: Record<SectionId, Range> | null = null;
let track: CameraTrack = CAMERA_TRACK;

/** Where the assembly animation sits in the document, in pixels of scroll. */
interface BuildTrack {
  /** Top of the assembly section: the model starts coming apart here. */
  explodeFrom: number;
  /** Scroll offset at which each step card sits in the middle of the screen. */
  anchors: number[];
  /** Scroll distance given to the final stage, past the last card. */
  tail: number;
}

let buildTrack: BuildTrack | null = null;

export const rangeOf = (id: SectionId): Range => measured?.[id] ?? SECTION_RANGES[id];

export const getCameraTrack = () => track;

const indexAt = (p: number) => {
  if (!measured) return sectionIndexAt(p);
  for (let i = 0; i < SECTIONS.length; i++) {
    if (p < measured[SECTIONS[i].id].end) return i;
  }
  return SECTIONS.length - 1;
};

/**
 * How far the model is assembled: 0 = every piece apart, 1 = finished.
 *
 * Anchored to the step cards themselves rather than to a fraction of the
 * section, so the piece flying into place is always the one the card beside
 * it describes, however tall the section happens to be.
 */
export const getBuild = () => {
  const build = buildTrack;
  if (!build) {
    // Before the first measure, fall back to the declared section range.
    const range = SECTION_RANGES.assembly;
    const p = state.progress;
    if (p <= range.start || p >= range.end) return 1;
    const local = (p - range.start) / (range.end - range.start);
    return local < 0.1 ? 1 - smoothstep(local / 0.1) : smoothstep(clamp((local - 0.1) / 0.82));
  }

  const { anchors, explodeFrom, tail } = build;
  const y = state.scrollY;
  const count = anchors.length;
  const first = anchors[0];

  if (y <= explodeFrom) return 1;
  // The model comes apart while the section's opening copy is read.
  if (y < first) return 1 - smoothstep((y - explodeFrom) / (first - explodeFrom || 1));

  for (let i = 0; i < count - 1; i++) {
    if (y < anchors[i + 1]) {
      const span = anchors[i + 1] - anchors[i] || 1;
      return (i + (y - anchors[i]) / span) / count;
    }
  }
  return clamp((count - 1 + (y - anchors[count - 1]) / (tail || 1)) / count);
};

/**
 * Reads the section offsets and the assembly step positions out of the DOM.
 * Called after mount and whenever the page reflows.
 */
const measureLayout = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;

  const next = {} as Record<SectionId, Range>;
  for (const section of SECTIONS) {
    const el = document.getElementById(section.id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    next[section.id] = { start: top / maxScroll, end: (top + rect.height) / maxScroll };
  }
  measured = next;
  track = makeCameraTrack(rangeOf);

  const steps = document.querySelectorAll<HTMLElement>("#assembly ol li[data-index]");
  const assembly = document.getElementById("assembly");
  if (assembly && steps.length > 1) {
    const middle = window.innerHeight / 2;
    const anchors = Array.from(steps, (li) => {
      const rect = li.getBoundingClientRect();
      return rect.top + window.scrollY + rect.height / 2 - middle;
    });
    const gaps = anchors.slice(1).map((a, i) => a - anchors[i]);
    const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

    // The last stage — the fittings and the paint — has no card after it to
    // pace against, so it is given whatever room is left before the gallery
    // takes over the screen. Without that the model finishes painting with
    // the photographs already covering it.
    const gallery = document.querySelector<HTMLElement>("#assembly [data-gallery]");
    const last = anchors[anchors.length - 1];
    const room = gallery
      ? gallery.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.55 - last
      : average;

    buildTrack = {
      explodeFrom: Math.min(assembly.getBoundingClientRect().top + window.scrollY, anchors[0] - 1),
      anchors,
      tail: clamp(room, average * 0.4, average),
    };
  }
};

/**
 * The live Lenis instance, kept so overlays can freeze the page behind
 * them. Null in reduced-motion mode, where native scrolling is in charge.
 */
let lenisInstance: { stop: () => void; start: () => void } | null = null;
let lockDepth = 0;

/**
 * Freezes or releases page scrolling while a full-screen overlay is open.
 * Reference-counted, so nested overlays cannot unlock each other. Lenis is
 * paused *and* the body is locked, because Lenis only owns wheel and touch
 * input — the keyboard would still scroll the page behind the overlay.
 */
export const setScrollLocked = (locked: boolean) => {
  lockDepth = Math.max(0, lockDepth + (locked ? 1 : -1));
  const { style } = document.body;
  if (lockDepth > 0) {
    // Compensate for the vanishing scrollbar so the page does not shift.
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = "hidden";
    if (gutter > 0) style.paddingRight = `${gutter}px`;
    lenisInstance?.stop();
  } else {
    style.overflow = "";
    style.paddingRight = "";
    lenisInstance?.start();
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
    state.scrollY = window.scrollY;
    setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
  };

  // Re-measure on anything that can change the shape of the document: the
  // first paint, a resize, a font swap, a section growing as it settles.
  let pending = 0;
  const remeasure = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      measureLayout();
      read();
    });
  };
  const observer = new ResizeObserver(remeasure);
  observer.observe(document.body);
  remeasure();

  if (prefersReducedMotion()) {
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", remeasure);
    read();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(pending);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", remeasure);
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
    lenisInstance = instance;
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

  window.addEventListener("resize", remeasure);
  read();

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(pending);
    observer.disconnect();
    window.removeEventListener("resize", remeasure);
    window.removeEventListener("scroll", read);
    lenisInstance = null;
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
