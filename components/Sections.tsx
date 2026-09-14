"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  ARTWORK_SPECS,
  CLOSING,
  MEMBERS,
  META,
  OVERVIEW,
  PARTS,
  STORY,
  VEHICLE_SPECS,
  ALL_SOURCES,
} from "@/content/site";
import type { Bi, PartContent, SpecRow } from "@/content/site";
import { calloutsForSection } from "@/content/callouts";
import { SECTIONS } from "@/lib/sections";
import type { SectionId } from "@/lib/sections";
import { useActiveSection } from "@/lib/scroll";

const vhOf = (id: SectionId) => SECTIONS.find((s) => s.id === id)?.vh ?? 100;

/**
 * True when `prefers-reduced-motion` is set. In that mode there is no
 * canvas and no scroll-jacking: every section becomes an ordinary block in
 * the document flow, and callouts are rendered as plain lists so nothing
 * that the animated version shows is lost.
 */
export const StaticMode = createContext(false);

/* ----------------------------- primitives --------------------------- */

/** Fades its children in the first time the block enters the viewport. */
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} data-visible={visible}>
      {children}
    </div>
  );
}

/** Thai copy with its English counterpart beneath it. */
function Bilingual({ value, className = "" }: { value: Bi; className?: string }) {
  return (
    <div className={className}>
      <p className="body-th">{renderWithMissing(value.th)}</p>
      <p className="body-en mt-1.5" lang="en">
        {renderWithMissing(value.en)}
      </p>
    </div>
  );
}

/** Highlights any `[ต้องการข้อมูลเพิ่ม: ...]` marker so it cannot be missed. */
function renderWithMissing(text: string) {
  const parts = text.split(/(\[ต้องการข้อมูลเพิ่ม:[^\]]*\])/g);
  return parts.map((part, i) =>
    part.startsWith("[ต้องการข้อมูลเพิ่ม:") ? (
      <mark key={i} className="missing">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface ShellProps {
  id: SectionId;
  children: ReactNode;
  /** Where the pinned copy sits inside the viewport on desktop. */
  place?: "right" | "left" | "centre" | "bottom";
  /** Let the content scroll normally instead of pinning it. */
  flow?: boolean;
}

function Shell({ id, children, place = "right", flow = false }: ShellProps) {
  const isStatic = useContext(StaticMode);
  const { section } = useActiveSection();
  // A pinned panel physically slides into view during the tail of the
  // previous section, before the camera has moved on. Keeping it invisible
  // until its own section is active makes copy and camera arrive together.
  const shown = isStatic || flow || section.id === id;
  const placement =
    place === "right"
      ? "md:items-center md:justify-end"
      : place === "left"
        ? "md:items-center md:justify-start"
        : place === "bottom"
          ? "md:items-end md:justify-start md:pb-16"
          : "md:items-center md:justify-center";

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="pointer-events-none relative"
      style={isStatic ? undefined : { minHeight: `${vhOf(id)}vh` }}
    >
      <div
        className={
          flow || isStatic
            ? "mx-auto w-full max-w-6xl px-5 py-16 sm:px-8"
            : // Pinned copy runs to the viewport edge rather than sitting
              // inside a centred column, so it never covers the model.
              // The right inset keeps clear of the section rail.
              `flex w-full px-5 pb-28 pt-24 sm:px-8 md:sticky md:top-0 md:h-[100svh] md:py-0 lg:pr-28 ${placement}`
        }
        style={{ opacity: shown ? 1 : 0, transition: "opacity 520ms ease" }}
      >
        {children}
      </div>
    </section>
  );
}

/* -------------------------------- hero ------------------------------ */

export function Hero() {
  return (
    <Shell id="hero" place="bottom">
      <div className="pointer-events-auto w-full max-w-xl pb-0">
        <Reveal>
          <p className="eyebrow">{META.subject.th}</p>
          <h1
            id="hero-heading"
            className="mt-4 text-[2.6rem] font-light leading-[1.08] tracking-tight text-steel-200 sm:text-6xl"
          >
            {META.title.th}
          </h1>
          <p className="mt-2 text-lg font-light text-steel-400" lang="en">
            {META.title.en}
          </p>
          <div className="my-6 h-px w-16 bg-ember" />
          <p className="body-th max-w-xl">{META.heroLine.th}</p>
          <p className="body-en mt-2 max-w-xl" lang="en">
            {META.heroLine.en}
          </p>
          <p className="mt-10 text-[0.72rem] uppercase tracking-widest2 text-steel-400">
            {OVERVIEW.note.th}
          </p>
        </Reveal>
      </div>
    </Shell>
  );
}

/* ------------------------------ overview ---------------------------- */

export function Overview() {
  return (
    <Shell id="overview" place="left">
      <div className="pointer-events-auto w-full max-w-[22rem]">
        <Reveal>
          <div className="panel p-6 sm:p-7">
            <p className="eyebrow">{OVERVIEW.eyebrow.th}</p>
            <h2
              id="overview-heading"
              className="mt-3 text-2xl font-light leading-snug text-steel-200 sm:text-3xl"
            >
              {OVERVIEW.heading.th}
            </h2>
            <p className="mt-1 text-sm text-steel-400" lang="en">
              {OVERVIEW.heading.en}
            </p>

            <div className="mt-6 space-y-5">
              {[OVERVIEW.concept, OVERVIEW.inspiration].map((block) => (
                <div key={block.label.en}>
                  <h3 className="text-[0.7rem] uppercase tracking-widest2 text-steel-400">
                    {block.label.th} · <span lang="en">{block.label.en}</span>
                  </h3>
                  <Bilingual value={block.body} className="mt-2" />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Shell>
  );
}

/* ---------------------------- part sections ------------------------- */

const QA_LABELS: Array<{ key: keyof PartContent["qa"]; th: string; en: string }> = [
  { key: "function", th: "ทำหน้าที่อะไร", en: "What it does" },
  { key: "purpose", th: "สร้างขึ้นเพื่ออะไร", en: "Why it was built" },
  { key: "inspiration", th: "ที่มาและแรงบันดาลใจ", en: "Origin and inspiration" },
  { key: "engineering", th: "วิศวกรรมเบื้องหลัง", en: "The engineering behind it" },
];

export function PartSection({ part }: { part: PartContent }) {
  const isStatic = useContext(StaticMode);
  const callouts = calloutsForSection(part.key);

  return (
    <Shell id={part.key} place="right">
      <div className="pointer-events-auto w-full max-w-[23rem]">
        <Reveal>
          <div className="panel px-5 py-5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[0.7rem] text-ember">{part.index}</span>
              <div className="hairline flex-1" />
              <span className="text-[0.66rem] text-steel-400">{part.tag.th}</span>
            </div>

            <h2
              id={`${part.key}-heading`}
              className="mt-3 text-[1.55rem] font-light leading-tight text-steel-200"
            >
              {part.name.th}
            </h2>
            <p className="text-[0.82rem] text-steel-400" lang="en">
              {part.name.en}
            </p>

            <dl className="mt-4 space-y-3">
              {QA_LABELS.map(({ key, th, en }) => (
                <div key={key}>
                  <dt className="text-[0.62rem] uppercase tracking-widest2 text-steel-400">
                    {th} · <span lang="en">{en}</span>
                  </dt>
                  <dd className="mt-1">
                    <p className="text-[0.84rem] leading-[1.5] text-steel-200">
                      {renderWithMissing(part.qa[key].th)}
                    </p>
                    <p className="mt-0.5 text-[0.72rem] leading-[1.45] text-steel-400" lang="en">
                      {renderWithMissing(part.qa[key].en)}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>

            <figure className="mt-4 flex items-start gap-3">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border border-steel-700/70">
                <Image
                  src={part.photo.src}
                  alt={part.photo.alt.th}
                  fill
                  sizes="6rem"
                  className="object-cover"
                />
              </div>
              <figcaption className="text-[0.7rem] leading-[1.45] text-steel-400">
                <span className="text-ember">ในโมเดล · </span>
                {part.build.th}
              </figcaption>
            </figure>

            {/* Full-length answers stay one click away rather than forcing
                the card to scroll. */}
            <details className="group mt-4 border-t border-steel-700/70 pt-3">
              <summary className="cursor-pointer list-none text-[0.66rem] uppercase tracking-widest2 text-steel-400 hover:text-steel-200">
                <span className="group-open:hidden">+ รายละเอียดฉบับเต็ม · Read in full</span>
                <span className="hidden group-open:inline">− ย่อกลับ · Collapse</span>
              </summary>
              <dl className="mt-3 space-y-3">
                {QA_LABELS.map(({ key, th }) => (
                  <div key={key}>
                    <dt className="text-[0.62rem] uppercase tracking-widest2 text-steel-400">
                      {th}
                    </dt>
                    <dd className="mt-1">
                      <p className="text-[0.8rem] leading-relaxed text-steel-200">
                        {renderWithMissing(part.deep[key].th)}
                      </p>
                      <p className="mt-1 text-[0.7rem] leading-relaxed text-steel-400" lang="en">
                        {renderWithMissing(part.deep[key].en)}
                      </p>
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="text-[0.62rem] uppercase tracking-widest2 text-ember">
                    ชิ้นนี้ทำขึ้นอย่างไรในโมเดล
                  </dt>
                  <dd className="mt-1">
                    <p className="text-[0.8rem] leading-relaxed text-steel-200">{part.build.th}</p>
                    <p className="mt-1 text-[0.7rem] leading-relaxed text-steel-400" lang="en">
                      {part.build.en}
                    </p>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[0.68rem] leading-relaxed text-steel-400">
                {part.photo.alt.th}
              </p>
            </details>

            {isStatic && callouts.length > 0 && (
              <div className="mt-4 border-t border-steel-700/70 pt-3">
                <h3 className="text-[0.62rem] uppercase tracking-widest2 text-steel-400">
                  จุดที่ชี้บนโมเดล · <span lang="en">Points marked on the model</span>
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {callouts.map((callout) => (
                    <li key={callout.id} className="flex gap-2.5">
                      <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                      <span>
                        <span className="text-[0.82rem] text-steel-200">{callout.label.th}</span>
                        <span className="ml-2 text-[0.7rem] text-steel-400" lang="en">
                          {callout.label.en}
                        </span>
                        <span className="block text-[0.72rem] text-steel-400">
                          {callout.detail.th}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </Shell>
  );
}

export function PartSections() {
  return (
    <>
      {PARTS.map((part) => (
        <PartSection key={part.key} part={part} />
      ))}
    </>
  );
}

/* --------------------------- story / assembly ----------------------- */

export function Assembly() {
  const isStatic = useContext(StaticMode);
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    for (const el of stepRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="assembly"
      aria-labelledby="assembly-heading"
      className="pointer-events-none relative"
      style={isStatic ? undefined : { minHeight: `${vhOf("assembly")}vh` }}
    >
      <div className="w-full px-5 sm:px-8 lg:pr-28">
        <div className="pointer-events-auto max-w-[26rem] pt-16 md:pt-24">
          <Reveal>
            <p className="eyebrow">{STORY.eyebrow.th}</p>
            <h2
              id="assembly-heading"
              className="mt-3 text-3xl font-light leading-snug text-steel-200 sm:text-4xl"
            >
              {STORY.heading.th}
            </h2>
            <p className="mt-1 text-sm text-steel-400" lang="en">
              {STORY.heading.en}
            </p>
            <Bilingual value={STORY.lede} className="mt-5" />

            <dl className="mt-6 flex gap-8 border-t border-steel-700/70 pt-5">
              <div>
                <dt className="text-[0.68rem] uppercase tracking-widest2 text-steel-400">
                  ระยะเวลารวม
                </dt>
                <dd className="mt-1 text-lg font-light text-steel-200">{STORY.totalDays.th}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-widest2 text-steel-400">
                  ลงมือจริง
                </dt>
                <dd className="mt-1 text-lg font-light text-steel-200">2 วัน</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        {/* Steps scroll past while the model assembles behind them. */}
        <ol
          className={`pointer-events-auto max-w-[24rem] ${
            isStatic ? "mt-10 space-y-5 pb-16" : "mt-24 space-y-[46vh] pb-[26vh]"
          }`}
        >
          {STORY.steps.map((step, i) => (
            <li
              key={step.stage}
              data-index={i}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="panel p-6 transition-[border-color,opacity] duration-500"
              style={
                isStatic
                  ? undefined
                  : {
                      opacity: active === i ? 1 : 0.55,
                      borderColor: active === i ? "rgba(217,112,54,0.55)" : undefined,
                    }
              }
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-ember">{step.no}</span>
                <h3 className="text-xl font-light text-steel-200">{step.title.th}</h3>
              </div>
              <p className="mt-0.5 pl-9 text-sm text-steel-400" lang="en">
                {step.title.en}
              </p>
              <Bilingual value={step.body} className="mt-3 pl-9" />
            </li>
          ))}
        </ol>

        {/* Photographs of the finished piece. */}
        <div className="pointer-events-auto mx-auto grid max-w-5xl gap-4 pb-24 sm:grid-cols-3">
          {STORY.gallery.map((shot) => (
            <Reveal key={shot.src}>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-steel-700/70">
                  <Image
                    src={shot.src}
                    alt={shot.alt.th}
                    fill
                    sizes="(max-width: 640px) 100vw, 20rem"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-[0.72rem] leading-relaxed text-steel-400">
                  {shot.alt.th}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- specs ------------------------------ */

function SpecTable({ caption, rows }: { caption: Bi; rows: SpecRow[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-steel-700/70 px-5 py-4">
        <h3 className="text-sm font-medium text-steel-200">{caption.th}</h3>
        <p className="text-[0.72rem] text-steel-400" lang="en">
          {caption.en}
        </p>
      </div>
      <table className="w-full text-left">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label.en} className="border-b border-steel-800 last:border-0 align-top">
              <th scope="row" className="w-2/5 px-5 py-3 text-[0.78rem] font-normal text-steel-400">
                {row.label.th}
                <span className="block text-[0.68rem] text-steel-500" lang="en">
                  {row.label.en}
                </span>
              </th>
              <td className="px-5 py-3 text-[0.84rem] leading-relaxed text-steel-200">
                {renderWithMissing(row.value.th)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Specs() {
  return (
    <Shell id="specs" flow>
      <div className="pointer-events-auto">
        <Reveal>
          <p className="eyebrow">ข้อมูลจำเพาะ · <span lang="en">Specifications</span></p>
          <h2
            id="specs-heading"
            className="mt-3 max-w-2xl text-3xl font-light leading-snug text-steel-200 sm:text-4xl"
          >
            ผลงานกับต้นแบบ วางเทียบกัน
          </h2>
          <p className="mt-1 text-sm text-steel-400" lang="en">
            The model and the original vehicle, side by side
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <SpecTable caption={{ th: "ผลงาน", en: "The artwork" }} rows={ARTWORK_SPECS} />
          </Reveal>
          <Reveal>
            <SpecTable
              caption={{ th: "ต้นแบบ: รถถัง Tiger I", en: "The original: Tiger I" }}
              rows={VEHICLE_SPECS}
            />
          </Reveal>
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------ closing ----------------------------- */

export function Closing() {
  return (
    <Shell id="closing" place="left">
      <div className="pointer-events-auto w-full max-w-[22rem]">
        <Reveal>
          <div className="panel p-6 sm:p-7">
            <p className="eyebrow">{CLOSING.eyebrow.th}</p>
            <h2
              id="closing-heading"
              className="mt-3 text-2xl font-light leading-snug text-steel-200 sm:text-3xl"
            >
              {CLOSING.heading.th}
            </h2>
            <p className="mt-1 text-sm text-steel-400" lang="en">
              {CLOSING.heading.en}
            </p>

            <ul className="mt-6 space-y-2.5">
              {MEMBERS.map((member) => (
                <li key={member.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-[0.92rem] text-steel-200">{member.name}</span>
                  <span className="shrink-0 font-mono text-[0.7rem] text-steel-400">
                    {member.no} · {member.id}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 flex items-center gap-2 border-t border-steel-700/70 pt-4 text-[0.78rem] text-ember">
              <span aria-hidden="true">↔</span>
              {CLOSING.orbitHint.th}
            </p>

            <details className="mt-5">
              <summary className="cursor-pointer text-[0.72rem] uppercase tracking-widest2 text-steel-400 hover:text-steel-200">
                {CLOSING.sourcesHeading.th}
              </summary>
              <ul className="mt-3 space-y-1.5">
                {ALL_SOURCES.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-[0.72rem] text-steel-400 underline decoration-steel-600 underline-offset-2 hover:text-ember"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            <p className="mt-6 text-[0.7rem] leading-relaxed text-steel-400">
              {CLOSING.historicalNote.th}
            </p>
          </div>
        </Reveal>
      </div>
    </Shell>
  );
}
