"use client";

import { Component, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import CalloutOverlay from "./CalloutOverlay";
import FilmSection from "./FilmSection";
import { OverlayProvider, PhotoFrame } from "./Overlay";
import LoadingScreen from "./LoadingScreen";
import MobileGate from "./MobileGate";
import ProgressNav from "./ProgressNav";
import {
  Assembly,
  Closing,
  Hero,
  Overview,
  PartSections,
  Specs,
  StaticMode,
} from "./Sections";
import { STORY } from "@/content/site";
import { initScrollDriver, prefersReducedMotion, useActiveSection } from "@/lib/scroll";

/** WebGL never runs on the server, and never in reduced-motion mode. */
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/**
 * A WebGL failure (no context, lost GPU) throws inside the canvas. Rather
 * than a blank page, hand the reader the same static version that
 * reduced-motion visitors get.
 */
class SceneBoundary extends Component<
  { onFail: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Showcase() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const { index, section } = useActiveSection();
  const handleReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const isReduced = prefersReducedMotion();
    setReduced(isReduced);
    if (isReduced) return;
    return initScrollDriver();
  }, []);

  // Nothing is committed until we know which mode to render, so the
  // reduced-motion visitor never sees a canvas mount and tear down.
  if (reduced === null) return <LoadingScreen done={false} />;

  if (reduced) {
    return (
      <OverlayProvider>
        <StaticMode.Provider value={true}>
          <MobileGate />
          <main className="mx-auto max-w-none">
            <div className="relative mx-auto max-w-6xl px-5 pt-16 sm:px-8">
              <PhotoFrame
                src="/photos/hero-front-quarter.jpg"
                alt={STORY.gallery[0].alt.th}
                priority
                sizes="(max-width: 1152px) 100vw, 72rem"
                className="aspect-[16/9]"
              />
              <p className="mt-3 text-[0.72rem] text-steel-400">
                แสดงผลแบบภาพนิ่งตามการตั้งค่าลดการเคลื่อนไหวของอุปกรณ์ ·{" "}
                <span lang="en">
                  Shown as a static page because this device requests reduced motion.
                </span>
              </p>
            </div>
            <Hero />
            <Overview />
            <PartSections />
            <Assembly />
            <Specs />
            <FilmSection />
            <Closing />
          </main>
        </StaticMode.Provider>
      </OverlayProvider>
    );
  }

  const orbitEnabled = section.id === "closing";

  return (
    <OverlayProvider>
      <StaticMode.Provider value={false}>
        <MobileGate />
        <LoadingScreen done={ready} />
        <ProgressNav activeIndex={index} />

        <a
          href="#specs"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-steel-900 focus:px-4 focus:py-2 focus:text-sm"
        >
          ข้ามไปยังข้อมูลจำเพาะ
        </a>

        <main className="relative">
          {/* The 3D scene stays pinned for the whole document. */}
          <div
            className={`sticky top-0 z-0 h-[100svh] w-full ${
              orbitEnabled ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <SceneBoundary onFail={() => setReduced(true)}>
              <Scene orbitEnabled={orbitEnabled} onReady={handleReady} />
            </SceneBoundary>
            {/* Scrim: keeps copy legible wherever the model happens to sit,
                without flattening the render behind it. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,12,14,0.94) 0%, rgba(10,12,14,0.62) 26%, rgba(10,12,14,0) 58%)",
              }}
            />
            <CalloutOverlay activeSection={section.id} />
          </div>

          {/* Copy scrolls over the pinned scene. */}
          <div className="pointer-events-none relative z-10" style={{ marginTop: "-100svh" }}>
            <Hero />
            <Overview />
            <PartSections />
            <Assembly />
            <Specs />
            <FilmSection />
            <Closing />
          </div>
        </main>
      </StaticMode.Provider>
    </OverlayProvider>
  );
}
