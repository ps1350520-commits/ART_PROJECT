"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ALL_PHOTOS,
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
import type { Callout } from "@/content/callouts";
import { PhotoFrame, ReadMore, useOverlay } from "./Overlay";
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
            ? "mx-auto w-full max-w-6xl px-5 py-16 phone:px-3 phone:py-8 sm:px-8"
            : // Pinned copy runs to the viewport edge rather than sitting
              // inside a centred column, so it never covers the model.
              // The right inset keeps clear of the section rail.
              `flex w-full px-5 pb-28 pt-24 phone:px-3 phone:pb-10 phone:pt-12 sm:px-8 md:sticky md:top-0 md:h-[100svh] md:py-0 lg:pr-28 ${placement}`
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
            className="mt-4 text-[2.6rem] font-light leading-[1.08] tracking-tight text-steel-200 phone:mt-2 phone:text-[1.55rem] sm:text-6xl"
          >
            {META.title.th}
          </h1>
          <p className="mt-2 text-lg font-light text-steel-400 phone:text-[0.8rem]" lang="en">
            {META.title.en}
          </p>
          <div className="my-6 h-px w-16 bg-ember phone:my-3" />
          <p className="body-th max-w-xl">{META.heroLine.th}</p>
          <p className="body-en mt-2 max-w-xl" lang="en">
            {META.heroLine.en}
          </p>
          <p className="mt-10 text-[0.72rem] uppercase tracking-widest2 text-steel-400 phone:mt-4 phone:text-[0.58rem]">
            {OVERVIEW.note.th}
          </p>
        </Reveal>
      </div>
    </Shell>
  );
}

/* ------------------------------ overview ---------------------------- */

export function Overview() {
  const { openReader } = useOverlay();
  const shot = STORY.gallery[0];

  return (
    <Shell id="overview" place="left">
      <div className="pointer-events-auto w-full max-w-[24rem] phone:max-w-[16.5rem] phone:portrait:mx-auto phone:portrait:max-w-[19rem] 2xl:max-w-[27rem]">
        <Reveal>
          <div className="panel overflow-hidden">
            <PhotoFrame
              src={shot.src}
              alt={shot.alt.th}
              sizes="(max-width: 768px) 92vw, 24rem"
              className="aspect-[4/3] rounded-none border-x-0 border-t-0 phone:aspect-[16/9]"
            >
              <span className="photo-caption">
                <span className="eyebrow">{OVERVIEW.eyebrow.th}</span>
              </span>
            </PhotoFrame>

            <div className="p-5 phone:p-3 sm:p-6">
              <h2
                id="overview-heading"
                className="text-2xl font-light leading-snug text-steel-200 phone:text-[1.02rem] sm:text-[1.7rem]"
              >
                {OVERVIEW.heading.th}
              </h2>
              <p className="mt-0.5 text-sm text-steel-400 phone:text-[0.66rem]" lang="en">
                {OVERVIEW.heading.en}
              </p>

              {/* Only the concept stays on the card; the rest is one tap away. */}
              <p className="body-th mt-3 line-clamp-3 phone:mt-2 phone:line-clamp-2">{OVERVIEW.concept.body.th}</p>

              <div className="mt-5 phone:mt-3">
                <ReadMore
                  onClick={() =>
                    openReader({
                      title: OVERVIEW.heading.th,
                      subtitle: OVERVIEW.heading.en,
                      body: <OverviewDetail />,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Shell>
  );
}

/** Concept and inspiration in full, for the reading pane. */
function OverviewDetail() {
  return (
    <div className="space-y-6">
      {[OVERVIEW.concept, OVERVIEW.inspiration].map((block) => (
        <section key={block.label.en}>
          <h3 className="text-[0.66rem] uppercase tracking-widest2 text-steel-400">
            {block.label.th} · <span lang="en">{block.label.en}</span>
          </h3>
          <Bilingual value={block.body} className="mt-2" />
        </section>
      ))}
    </div>
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
  const { openReader } = useOverlay();
  const callouts = calloutsForSection(part.key);

  const readInFull = () =>
    openReader({
      title: part.name.th,
      subtitle: part.name.en,
      body: <PartDetail part={part} callouts={callouts} />,
    });

  return (
    <Shell id={part.key} place="right">
      <div className="pointer-events-auto w-full max-w-[24rem] phone:max-w-[16.5rem] phone:portrait:mx-auto phone:portrait:max-w-[19rem] 2xl:max-w-[27rem]">
        <Reveal>
          <article className="panel overflow-hidden">
            {/* The photograph leads; the card carries one line about the
                part and hands the rest to the reading pane. */}
            <PhotoFrame
              src={part.photo.src}
              alt={part.photo.alt.th}
              sizes="(max-width: 768px) 92vw, 24rem"
              className="aspect-[4/3] rounded-none border-x-0 border-t-0 phone:aspect-[16/9]"
            >
              <span className="photo-caption">
                <span className="font-mono text-[0.72rem] text-ember phone:text-[0.6rem]">{part.index}</span>
                <span className="text-[0.68rem] text-steel-300 phone:text-[0.58rem]">{part.tag.th}</span>
              </span>
            </PhotoFrame>

            <div className="p-5 phone:p-3">
              <h2
                id={`${part.key}-heading`}
                className="text-[1.5rem] font-light leading-tight text-steel-200 phone:text-[1.02rem]"
              >
                {part.name.th}
              </h2>
              <p className="mt-0.5 text-[0.8rem] text-steel-400 phone:text-[0.66rem]" lang="en">
                {part.name.en}
              </p>

              <p className="mt-3 line-clamp-3 text-[0.88rem] leading-[1.55] text-steel-200 phone:mt-2 phone:line-clamp-2 phone:text-[0.74rem] phone:leading-snug">
                {renderWithMissing(part.qa.function.th)}
              </p>

              <div className="mt-5 phone:mt-3">
                <ReadMore onClick={readInFull} />
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </Shell>
  );
}

/**
 * Everything the card leaves out: the four questions answered at length,
 * how the piece was made, the points marked on the model, and the sources.
 */
function PartDetail({ part, callouts }: { part: PartContent; callouts: Callout[] }) {
  return (
    <div>
      <PhotoFrame
        src={part.photo.src}
        alt={part.photo.alt.th}
        sizes="(max-width: 768px) 92vw, 40rem"
        className="aspect-[16/9]"
      />
      <p className="mt-2 text-[0.7rem] leading-relaxed text-steel-400">{part.photo.alt.th}</p>

      <dl className="mt-6 space-y-5">
        {QA_LABELS.map(({ key, th, en }) => (
          <div key={key}>
            <dt className="text-[0.64rem] uppercase tracking-widest2 text-steel-400">
              {th} · <span lang="en">{en}</span>
            </dt>
            <dd className="mt-1.5">
              <p className="text-[0.88rem] leading-relaxed text-steel-200">
                {renderWithMissing(part.deep[key].th)}
              </p>
              <p className="mt-1 text-[0.76rem] leading-relaxed text-steel-400" lang="en">
                {renderWithMissing(part.deep[key].en)}
              </p>
            </dd>
          </div>
        ))}
        <div className="border-t border-steel-700/70 pt-5">
          <dt className="text-[0.64rem] uppercase tracking-widest2 text-ember">
            ชิ้นนี้ทำขึ้นอย่างไรในโมเดล · <span lang="en">How it was made</span>
          </dt>
          <dd className="mt-1.5">
            <p className="text-[0.88rem] leading-relaxed text-steel-200">{part.build.th}</p>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-steel-400" lang="en">
              {part.build.en}
            </p>
          </dd>
        </div>
      </dl>

      {callouts.length > 0 && (
        <div className="mt-6 border-t border-steel-700/70 pt-5">
          <h3 className="text-[0.64rem] uppercase tracking-widest2 text-steel-400">
            จุดที่ชี้บนโมเดล · <span lang="en">Points marked on the model</span>
          </h3>
          <ul className="mt-3 space-y-2">
            {callouts.map((callout) => (
              <li key={callout.id} className="flex gap-2.5">
                <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                <span>
                  <span className="text-[0.86rem] text-steel-200">{callout.label.th}</span>
                  <span className="ml-2 text-[0.72rem] text-steel-400" lang="en">
                    {callout.label.en}
                  </span>
                  <span className="block text-[0.76rem] leading-relaxed text-steel-400">
                    {callout.detail.th}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-steel-700/70 pt-5">
        <h3 className="text-[0.64rem] uppercase tracking-widest2 text-steel-400">
          แหล่งอ้างอิง · <span lang="en">Sources</span>
        </h3>
        <ul className="mt-2 space-y-1.5">
          {part.sources.map((url) => (
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
      </div>
    </div>
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
        <div className="pointer-events-auto max-w-[26rem] pt-16 phone:max-w-[18rem] phone:pt-8 md:pt-24">
          <Reveal>
            <p className="eyebrow">{STORY.eyebrow.th}</p>
            <h2
              id="assembly-heading"
              className="mt-3 text-3xl font-light leading-snug text-steel-200 phone:mt-1.5 phone:text-[1.25rem] sm:text-4xl"
            >
              {STORY.heading.th}
            </h2>
            <p className="mt-1 text-sm text-steel-400" lang="en">
              {STORY.heading.en}
            </p>
            <Bilingual value={STORY.lede} className="mt-5" />

            <dl className="mt-6 flex gap-8 border-t border-steel-700/70 pt-5 phone:mt-3 phone:gap-5 phone:pt-3">
              <div>
                <dt className="text-[0.68rem] uppercase tracking-widest2 text-steel-400">
                  ระยะเวลารวม
                </dt>
                <dd className="mt-1 text-lg font-light text-steel-200 phone:text-sm">{STORY.totalDays.th}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-widest2 text-steel-400">
                  ลงมือจริง
                </dt>
                <dd className="mt-1 text-lg font-light text-steel-200 phone:text-sm">2 วัน</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        {/* Steps scroll past while the model assembles behind them. */}
        <ol
          className={`pointer-events-auto max-w-[24rem] phone:max-w-[17rem] ${
            isStatic
              ? "mt-10 space-y-5 pb-16"
              : "mt-24 space-y-[46vh] pb-[52vh] phone:mt-12"
          }`}
        >
          {STORY.steps.map((step, i) => (
            <li
              key={step.stage}
              data-index={i}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="panel p-6 transition-[border-color,opacity] duration-500 phone:p-3"
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
                <h3 className="text-xl font-light text-steel-200 phone:text-[0.95rem]">{step.title.th}</h3>
              </div>
              <p className="mt-0.5 pl-9 text-sm text-steel-400 phone:pl-6 phone:text-[0.64rem]" lang="en">
                {step.title.en}
              </p>
              <Bilingual value={step.body} className="mt-3 pl-9 phone:mt-1.5 phone:pl-6" />
            </li>
          ))}
        </ol>

        {/* Every photograph of the piece, large, and every one of them
            opens full size. */}
        <div data-gallery className="pointer-events-auto mx-auto w-full max-w-7xl pb-24 phone:pb-10">
          <Reveal>
            <p className="eyebrow">
              ภาพผลงาน · <span lang="en">Gallery</span>
            </p>
            <p className="mt-2 text-[0.72rem] text-steel-400">
              แตะที่ภาพเพื่อดูขนาดเต็ม ·{" "}
              <span lang="en">Tap any photograph to open it full size</span>
            </p>
          </Reveal>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {ALL_PHOTOS.map((shot, i) => (
              <Reveal key={shot.src} className={i === 0 ? "sm:col-span-2" : ""}>
                <PhotoFrame
                  src={shot.src}
                  alt={shot.alt.th}
                  sizes={
                    i === 0
                      ? "(max-width: 640px) 100vw, (max-width: 1152px) 100vw, 72rem"
                      : "(max-width: 640px) 100vw, 36rem"
                  }
                  className={i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}
                >
                  <span className="photo-caption">
                    <span className="text-[0.72rem] text-steel-200">{shot.title.th}</span>
                  </span>
                </PhotoFrame>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- specs ------------------------------ */

function SpecTable({ caption, rows }: { caption: Bi; rows: SpecRow[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-steel-700/70 px-5 py-4 phone:px-3 phone:py-2.5">
        <h3 className="text-sm font-medium text-steel-200 phone:text-[0.76rem]">{caption.th}</h3>
        <p className="text-[0.72rem] text-steel-400" lang="en">
          {caption.en}
        </p>
      </div>
      <table className="w-full text-left">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label.en} className="border-b border-steel-800 last:border-0 align-top">
              <th scope="row" className="w-2/5 px-5 py-3 text-[0.78rem] font-normal text-steel-400 phone:px-3 phone:py-2 phone:text-[0.66rem]">
                {row.label.th}
                <span className="block text-[0.68rem] text-steel-500" lang="en">
                  {row.label.en}
                </span>
              </th>
              <td className="px-5 py-3 text-[0.84rem] leading-relaxed text-steel-200 phone:px-3 phone:py-2 phone:text-[0.7rem]">
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
            className="mt-3 max-w-2xl text-3xl font-light leading-snug text-steel-200 phone:mt-1.5 phone:text-[1.25rem] sm:text-4xl"
          >
            ผลงานกับต้นแบบ วางเทียบกัน
          </h2>
          <p className="mt-1 text-sm text-steel-400" lang="en">
            The model and the original vehicle, side by side
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 phone:mt-5 phone:gap-3 lg:grid-cols-2">
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
  const { openReader } = useOverlay();

  return (
    <Shell id="closing" place="left">
      <div className="pointer-events-auto w-full max-w-[22rem] phone:max-w-[17rem] phone:portrait:mx-auto phone:portrait:max-w-[19rem]">
        <Reveal>
          <div className="panel p-6 phone:p-3.5 sm:p-7">
            <p className="eyebrow">{CLOSING.eyebrow.th}</p>
            <h2
              id="closing-heading"
              className="mt-3 text-2xl font-light leading-snug text-steel-200 phone:mt-1.5 phone:text-[1.02rem] sm:text-3xl"
            >
              {CLOSING.heading.th}
            </h2>
            <p className="mt-1 text-sm text-steel-400" lang="en">
              {CLOSING.heading.en}
            </p>

            <ul className="mt-6 space-y-2.5 phone:mt-3 phone:space-y-1">
              {MEMBERS.map((member) => (
                <li key={member.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-[0.92rem] text-steel-200 phone:text-[0.74rem]">{member.name}</span>
                  <span className="shrink-0 font-mono text-[0.7rem] text-steel-400 phone:text-[0.58rem]">
                    {member.no} · {member.id}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 flex items-center gap-2 border-t border-steel-700/70 pt-4 text-[0.78rem] text-ember phone:mt-3 phone:pt-2.5 phone:text-[0.66rem]">
              <span aria-hidden="true">↔</span>
              {CLOSING.orbitHint.th}
            </p>

            {/* Bibliography and the historical note live in the reading
                pane so the credits card stays a short list of names. */}
            <div className="mt-5 phone:mt-3">
              <ReadMore
                onClick={() =>
                  openReader({
                    title: CLOSING.sourcesHeading.th,
                    subtitle: CLOSING.sourcesHeading.en,
                    body: <SourcesDetail />,
                  })
                }
                label="แหล่งอ้างอิงและหมายเหตุ"
                labelEn="Sources and notes"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </Shell>
  );
}

/** The full bibliography, plus the note on the historical markings. */
function SourcesDetail() {
  return (
    <div>
      <ul className="space-y-2">
        {ALL_SOURCES.map((url) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[0.76rem] text-steel-400 underline decoration-steel-600 underline-offset-2 hover:text-ember"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-steel-700/70 pt-5">
        <h3 className="text-[0.64rem] uppercase tracking-widest2 text-steel-400">
          หมายเหตุ · <span lang="en">Note</span>
        </h3>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-steel-200">
          {CLOSING.historicalNote.th}
        </p>
        <p className="mt-1.5 text-[0.74rem] leading-relaxed text-steel-400" lang="en">
          {CLOSING.historicalNote.en}
        </p>
      </div>
    </div>
  );
}
