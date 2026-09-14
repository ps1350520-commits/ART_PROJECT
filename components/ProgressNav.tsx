"use client";

import { NAV_LABELS } from "@/content/site";
import { SECTIONS } from "@/lib/sections";

/** Section rail on the right edge; hidden on narrow screens. */
export default function ProgressNav({ activeIndex }: { activeIndex: number }) {
  return (
    <nav
      aria-label="ส่วนต่าง ๆ ของหน้า"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <ul className="space-y-3">
        {SECTIONS.map((section, i) => {
          const active = i === activeIndex;
          const label = NAV_LABELS[section.id];
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? "true" : undefined}
                className="group flex items-center justify-end gap-2.5"
              >
                <span
                  className={`whitespace-nowrap text-[0.68rem] transition-opacity duration-300 ${
                    active
                      ? "text-steel-200 opacity-100"
                      : "text-steel-400 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  }`}
                >
                  {label?.th ?? section.id}
                </span>
                <span
                  className={`block h-px transition-all duration-300 ${
                    active ? "w-7 bg-ember" : "w-3.5 bg-steel-600 group-hover:w-5 group-hover:bg-steel-400"
                  }`}
                />
                <span className="sr-only">{label?.en ?? section.id}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
