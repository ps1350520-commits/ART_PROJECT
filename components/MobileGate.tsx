"use client";

import { useEffect, useState } from "react";
import { MOBILE_GATE } from "@/content/site";
import { useMediaQuery } from "@/lib/scroll";

/**
 * Phones, portrait: the page is composed around a wide screen with the
 * model on one side and a panel on the other, which a portrait phone
 * cannot show. So the reader is asked to turn the device first, and
 * offered full screen while they are here — landscape plus full screen is
 * the closest a phone gets to the layout this was built for.
 *
 * It is a suggestion, not a wall: `MOBILE_GATE.dismiss` goes straight
 * through to the page, and turning the phone dismisses it by itself.
 */
export default function MobileGate() {
  const isPhone = useMediaQuery("(max-width: 767px), (max-height: 500px) and (orientation: landscape)");
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const [dismissed, setDismissed] = useState(false);

  // Turning the phone answers the question; nothing left to ask.
  useEffect(() => {
    if (!isPortrait) setDismissed(false);
  }, [isPortrait]);

  if (!isPhone || !isPortrait || dismissed) return null;

  const goFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      // Only available inside full screen, and only on some phones.
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (to: string) => Promise<void>;
      };
      await orientation.lock?.("landscape");
    } catch {
      // Either step may be refused; the reader can still turn the phone.
    }
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-heading"
      className="fixed inset-0 z-[70] flex touch-none flex-col items-center justify-center overscroll-none bg-steel-950 px-8 text-center"
    >
      {/* A phone turning on its side. */}
      <svg
        viewBox="0 0 96 64"
        className="h-20 w-28 text-ember"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="8"
          width="56"
          height="36"
          rx="7"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M34 56c4 3 9 4 14 4s10-1 14-4"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M62 60l6-3-1 6z"
          fill="currentColor"
          opacity="0.75"
        />
      </svg>

      <h2 id="gate-heading" className="mt-7 text-lg font-semibold text-ember">
        {MOBILE_GATE.heading.th}
      </h2>
      <p className="mt-1 text-[0.72rem] uppercase tracking-widest2 text-steel-500" lang="en">
        {MOBILE_GATE.heading.en}
      </p>

      <p className="mt-4 max-w-xs text-[0.82rem] leading-relaxed text-steel-400">
        {MOBILE_GATE.body.th}
      </p>

      <button
        type="button"
        onClick={goFullscreen}
        className="mt-8 rounded-full border-2 border-ember bg-ember/10 px-8 py-3 text-[0.92rem] font-semibold text-ember transition-colors active:bg-ember/20"
      >
        {MOBILE_GATE.fullscreen.th}
      </button>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-5 text-[0.74rem] text-steel-500 underline decoration-steel-700 underline-offset-4"
      >
        {MOBILE_GATE.dismiss.th}
      </button>
    </div>
  );
}
