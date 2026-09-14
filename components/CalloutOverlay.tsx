"use client";

import { useEffect, useMemo, useRef } from "react";
import { CALLOUTS, calloutsForSection } from "@/content/callouts";
import { SECTIONS } from "@/lib/sections";
import type { SectionId } from "@/lib/sections";
import { readAnchor } from "@/lib/projection";
import { getScroll, rangeOf, useMediaQuery } from "@/lib/scroll";

/** Callouts shown over the canvas at once on a narrow screen. */
const MOBILE_LIMIT = 2;
/** Minimum vertical distance between two label blocks, in pixels. */
const LABEL_GAP = 74;
/** Width reserved for the section rail on large screens. */
const NAV_RESERVE = 104;

interface Nodes {
  group: SVGGElement | null;
  dot: SVGCircleElement | null;
  halo: SVGCircleElement | null;
  line: SVGPolylineElement | null;
  label: HTMLDivElement | null;
}

const sideForSection = (id: SectionId): -1 | 1 =>
  SECTIONS.find((s) => s.id === id)?.labelSide ?? 1;

/**
 * Callouts belong to the reading window of their section: they appear as
 * the copy panel pins and leave with it, a little before the camera starts
 * travelling. Without this the outgoing labels linger under the incoming
 * panel during the crossfade.
 */
const withinHold = (id: SectionId, progress: number) => {
  const range = rangeOf(id);
  const section = SECTIONS.find((s) => s.id === id);
  const local = (progress - range.start) / (range.end - range.start || 1);
  return local <= (section?.holdUntil ?? 0.46) + 0.06;
};

/**
 * SVG leader lines drawn over the WebGL canvas. Anchor positions come from
 * `lib/projection`, which the scene fills each frame, so the overlay never
 * re-renders while the camera moves — it just mutates attributes.
 *
 * Labels are all pushed to whichever side the section's copy panel is not
 * on, clamped inside the viewport, and spread apart vertically so two
 * leader lines never end on top of each other.
 */
export default function CalloutOverlay({ activeSection }: { activeSection: SectionId }) {
  const isNarrow = useMediaQuery("(max-width: 767px)");
  const nodes = useRef(new Map<string, Nodes>());
  const narrowRef = useRef(isNarrow);
  narrowRef.current = isNarrow;

  const active = useMemo(() => {
    const list = calloutsForSection(activeSection);
    const shown = isNarrow ? list.slice(0, MOBILE_LIMIT) : list;
    return {
      id: activeSection,
      ids: new Set(shown.map((c) => c.id)),
      side: sideForSection(activeSection),
    };
  }, [activeSection, isNarrow]);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const narrow = narrowRef.current;
      const { ids, side, id: sectionId } = activeRef.current;
      const inHold = withinHold(sectionId, getScroll().progress);

      const labelWidth = width < 1180 ? 170 : 200;
      const reserve = width >= 1024 ? NAV_RESERVE : 16;
      /**
       * Labels sit in one fixed column against the viewport edge, the way
       * a technical drawing stacks its notes. The leader lines fan out to
       * the anchors, so a label can never land on the model or the panel.
       */
      const columnX =
        side === 1 ? width - reserve - labelWidth - 18 : 20 + labelWidth;

      // Collect what is on screen, then lay the labels out top to bottom.
      const placed: Array<{ id: string; x: number; y: number; labelY: number }> = [];
      for (const callout of CALLOUTS) {
        if (!inHold || !ids.has(callout.id)) continue;
        const anchor = readAnchor(callout.id);
        if (!anchor?.visible) continue;
        placed.push({ id: callout.id, x: anchor.x, y: anchor.y, labelY: anchor.y - 12 });
      }
      placed.sort((a, b) => a.labelY - b.labelY);

      let cursor = 92;
      for (const item of placed) {
        item.labelY = Math.max(item.labelY, cursor);
        cursor = item.labelY + LABEL_GAP;
      }
      // If the stack ran past the bottom, slide the whole column back up.
      const overflow = cursor - LABEL_GAP - (height - 118);
      if (overflow > 0) for (const item of placed) item.labelY -= overflow;

      const byId = new Map(placed.map((p) => [p.id, p]));

      for (const callout of CALLOUTS) {
        const node = nodes.current.get(callout.id);
        if (!node?.group) continue;

        const item = byId.get(callout.id);
        if (!item) {
          node.group.style.opacity = "0";
          if (node.label) node.label.style.opacity = "0";
          continue;
        }

        const { x, y } = item;
        node.group.style.opacity = "1";
        node.dot?.setAttribute("cx", String(x));
        node.dot?.setAttribute("cy", String(y));
        node.halo?.setAttribute("cx", String(x));
        node.halo?.setAttribute("cy", String(y));

        if (narrow || !node.label) {
          node.line?.setAttribute("points", `${x},${y} ${x},${y}`);
          if (node.label) node.label.style.opacity = "0";
          continue;
        }

        const labelY = Math.min(Math.max(item.labelY, 92), height - 118);
        const endX = columnX;
        // Short horizontal run off the label, then a straight diagonal in
        // to the anchor point.
        const elbowX = endX + side * -26;

        node.line?.setAttribute("points", `${x},${y} ${elbowX},${labelY} ${endX},${labelY}`);
        node.label.style.opacity = "1";
        node.label.style.left = `${endX}px`;
        node.label.style.top = `${labelY}px`;
        node.label.style.width = `${labelWidth}px`;
        node.label.style.transform = `translate(${side === 1 ? "10px" : "calc(-100% - 10px)"}, -50%)`;
        node.label.style.textAlign = side === 1 ? "left" : "right";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const register = (id: string, key: keyof Nodes) => (el: Nodes[typeof key]) => {
    const existing = nodes.current.get(id) ?? {
      group: null,
      dot: null,
      halo: null,
      line: null,
      label: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existing as any)[key] = el;
    nodes.current.set(id, existing);
  };

  const mobileList = isNarrow ? calloutsForSection(activeSection).slice(0, MOBILE_LIMIT) : [];

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        {CALLOUTS.map((callout) => (
          <g
            key={callout.id}
            ref={register(callout.id, "group")}
            style={{ opacity: 0, transition: "opacity 420ms ease" }}
          >
            <polyline
              ref={register(callout.id, "line")}
              points="0,0 0,0"
              fill="none"
              stroke="rgba(221,227,233,0.42)"
              strokeWidth="1"
            />
            <circle
              ref={register(callout.id, "halo")}
              r="8"
              fill="none"
              stroke="rgba(217,112,54,0.5)"
              strokeWidth="1"
            />
            <circle ref={register(callout.id, "dot")} r="3" fill="#d97036" />
          </g>
        ))}
      </svg>

      {/* Floating labels: DOM rather than SVG text, so Thai wraps properly. */}
      {CALLOUTS.map((callout) => (
        <div
          key={callout.id}
          ref={register(callout.id, "label")}
          className="pointer-events-none absolute leading-tight"
          style={{ opacity: 0, transition: "opacity 420ms ease" }}
        >
          <p className="text-[0.8rem] font-medium text-steel-200">{callout.label.th}</p>
          <p className="text-[0.68rem] text-steel-400" lang="en">
            {callout.label.en}
          </p>
          <p className="mt-0.5 text-[0.68rem] leading-snug text-steel-400">{callout.detail.th}</p>
        </div>
      ))}

      {/* Narrow screens: labels move out from under the model. */}
      {isNarrow && mobileList.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col gap-1.5 px-4">
          {mobileList.map((callout) => (
            <div
              key={callout.id}
              className="rounded border border-steel-700/70 bg-steel-950/80 px-3 py-2 backdrop-blur-sm"
            >
              <p className="text-[0.8rem] font-medium text-steel-200">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-ember align-middle" />
                {callout.label.th}
                <span className="ml-2 text-[0.7rem] font-normal text-steel-400" lang="en">
                  {callout.label.en}
                </span>
              </p>
              <p className="mt-0.5 text-[0.7rem] text-steel-400">{callout.detail.th}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
