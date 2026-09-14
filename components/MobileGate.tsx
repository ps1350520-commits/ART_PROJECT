"use client";

import { useState } from "react";
import { MOBILE_GATE } from "@/content/site";
import { useMediaQuery } from "@/lib/scroll";

/**
 * Phones and small tablets: the page is composed for a desktop screen —
 * the model in the middle of a wide frame with a panel beside it — and a
 * phone-width viewport cannot carry that, so the reader is asked to turn
 * on their browser's desktop mode rather than shown a cut-down version.
 *
 * The test is deliberately viewport-width based: switching a browser to
 * desktop mode widens the layout viewport to around 980px, which takes it
 * past `GATE` and dismisses this screen by itself.
 *
 * It stays a request, not a wall — `MOBILE_GATE.dismiss` goes through to
 * the page for anyone whose browser has no such setting.
 */
const GATE = "(pointer: coarse) and (max-width: 900px)";

export default function MobileGate() {
  const needsDesktop = useMediaQuery(GATE);
  const [dismissed, setDismissed] = useState(false);

  if (!needsDesktop || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-heading"
      className="fixed inset-0 z-[70] flex touch-none flex-col items-center justify-center overscroll-none bg-steel-950 px-8 text-center"
    >
      {/* A desktop screen on its stand. */}
      <svg viewBox="0 0 96 72" className="h-20 w-24 text-ember" fill="none" aria-hidden="true">
        <rect x="8" y="6" width="80" height="50" rx="6" stroke="currentColor" strokeWidth="3" />
        <path d="M38 62h20M48 56v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 68h32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
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

      <ul className="mt-7 w-full max-w-xs space-y-2.5 text-left">
        {MOBILE_GATE.steps.map((step) => (
          <li
            key={step.browser}
            className="rounded-sm border border-steel-700/70 bg-steel-900/60 px-4 py-3"
          >
            <p className="text-[0.66rem] uppercase tracking-widest2 text-steel-500">
              {step.browser}
            </p>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-steel-200">{step.how.th}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[0.74rem] text-steel-500">{MOBILE_GATE.after.th}</p>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-6 text-[0.74rem] text-steel-600 underline decoration-steel-700 underline-offset-4"
      >
        {MOBILE_GATE.dismiss.th}
      </button>
    </div>
  );
}
