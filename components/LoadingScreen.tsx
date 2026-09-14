"use client";

import { META } from "@/content/site";

/**
 * Covers the canvas until the first frame has rendered, so the page never
 * shows a blank rectangle where the model belongs.
 */
export default function LoadingScreen({ done }: { done: boolean }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-steel-950 transition-opacity duration-700"
      style={{ opacity: done ? 0 : 1, visibility: done ? "hidden" : "visible" }}
      aria-hidden={done}
      role="status"
      aria-live="polite"
    >
      <p className="text-[0.68rem] uppercase tracking-widest2 text-ember">{META.subject.th}</p>
      <p className="mt-4 text-2xl font-light text-steel-200">{META.title.th}</p>
      <p className="mt-1 text-sm text-steel-400" lang="en">
        {META.title.en}
      </p>

      <div className="mt-8 h-px w-40 overflow-hidden bg-steel-800">
        <div className="h-full w-1/3 animate-[load-sweep_1.4s_ease-in-out_infinite] bg-ember" />
      </div>
      <p className="mt-4 text-[0.72rem] text-steel-400">
        กำลังโหลดโมเดล 3 มิติ · <span lang="en">Loading the 3D scene</span>
      </p>
    </div>
  );
}
