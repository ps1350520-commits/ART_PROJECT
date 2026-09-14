"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { FILM } from "@/content/site";
import { SECTIONS } from "@/lib/sections";
import { setScrollLocked, useActiveSection } from "@/lib/scroll";
import { StaticMode } from "./Sections";

const FILM_VH = SECTIONS.find((s) => s.id === "film")?.vh ?? 140;
/** Sections close enough that the clip is worth downloading in full. */
const NEARBY = new Set(["assembly", "specs", "film", "closing"]);
/** Events that count as the interaction browsers require before sound. */
const GESTURES = ["pointerdown", "keydown", "touchstart"] as const;
/**
 * How long the page is held when the reader first arrives, so a fast scroll
 * lands on the film instead of flying past it. Short enough to read as the
 * page catching you rather than the page breaking, and driven by nothing
 * but this timer: it releases on its own whatever the clip, the tab or the
 * network happen to be doing.
 */
const CATCH_MS = 1200;

/**
 * The group's own film of the finished model, shown between the specs and
 * the credits.
 *
 * Reaching the section blacks the page out and brings the clip up quickly,
 * with sound. The page is held for `CATCH_MS` on arrival and not one moment
 * longer — enough that a fast scroll lands here rather than shooting past,
 * never enough to feel stuck. After that scrolling is the reader's again,
 * and leaving the section pauses the clip where it stands.
 */
export default function FilmSection() {
  const isStatic = useContext(StaticMode);
  const { index, section } = useActiveSection();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [paused, setPaused] = useState(true);
  const [ended, setEnded] = useState(false);
  /** The browser would not start playback on its own. */
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  /** True during the brief pause that catches the reader on arrival. */
  const [caught, setCaught] = useState(false);
  /** The catch is offered once per visit, on the way down only. */
  const spent = useRef(false);
  const cameFrom = useRef(index);
  const catchTimer = useRef(0);

  const active = isStatic || section.id === "film";
  const shown = active;
  // Read inside the play() callbacks, which resolve a moment (or, on a slow
  // connection, a long moment) after the section asked the clip to play.
  const activeRef = useRef(active);
  activeRef.current = active;

  // Arriving from above kills the leftover scroll momentum for a beat, so
  // the clip is never missed at speed. Once per visit, never on the way
  // back up, and never on a page that opens here.
  useEffect(() => {
    const fromAbove = cameFrom.current < index;
    cameFrom.current = index;
    if (isStatic || !active || spent.current || !fromAbove) return;
    spent.current = true;
    setCaught(true);
    // Deliberately outside the effect's cleanup: nothing that happens later
    // may cancel the release.
    catchTimer.current = window.setTimeout(() => setCaught(false), CATCH_MS);
  }, [active, index, isStatic]);

  useEffect(() => () => window.clearTimeout(catchTimer.current), []);

  // `caught` owns the hold outright, so it is balanced by construction and
  // released if this section ever unmounts mid-catch.
  useEffect(() => {
    if (!caught) return;
    setScrollLocked(true);
    return () => setScrollLocked(false);
  }, [caught]);

  // Play as the section takes the screen, pause as it leaves — so the
  // sound never carries on over the credits.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isStatic) return;

    if (!active) {
      video.pause();
      return;
    }
    if (video.ended) return;

    // Sound first. Browsers block unmuted autoplay until the reader has
    // interacted with the page, so silence is the fallback rather than the
    // default — and the first click or keypress turns the sound on.
    video.muted = false;
    setMuted(false);
    video
      .play()
      .then(() => {
        if (!activeRef.current) video.pause();
      })
      .catch(() => {
        video.muted = true;
        setMuted(true);
        return video
          .play()
          .then(() => {
            if (!activeRef.current) video.pause();
          })
          .catch(() => setBlocked(true));
      });
  }, [active, isStatic]);

  // Lift the fallback mute at the first gesture anywhere on the page.
  useEffect(() => {
    if (isStatic || !muted) return;
    const unmute = () => {
      const video = videoRef.current;
      if (video) {
        video.muted = false;
        setMuted(false);
      }
    };
    for (const type of GESTURES) window.addEventListener(type, unmute, { once: true });
    return () => {
      for (const type of GESTURES) window.removeEventListener(type, unmute);
    };
  }, [muted, isStatic]);

  const start = () => {
    const video = videoRef.current;
    if (!video) return;
    // Started by hand, so sound is allowed from the first frame.
    video.muted = false;
    setMuted(false);
    setBlocked(false);
    setEnded(false);
    video.play().catch(() => setBlocked(true));
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setEnded(false);
    void video.play();
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const played = duration > 0 ? Math.min(1, elapsed / duration) : 0;

  return (
    <section
      id="film"
      aria-labelledby="film-heading"
      className="pointer-events-none relative"
      style={isStatic ? undefined : { minHeight: `${FILM_VH}vh` }}
    >
      <div
        className={
          isStatic
            ? "mx-auto w-full max-w-5xl px-5 py-16 sm:px-8"
            : "sticky top-0 flex h-[100svh] w-full items-center justify-center px-4 phone:px-3 sm:px-8"
        }
      >
        {/* The blackout: the model recedes and the screen is handed over. */}
        {!isStatic && (
          <div
            className="absolute inset-0 bg-steel-950"
            style={{ opacity: shown ? 1 : 0, transition: "opacity 620ms ease" }}
          />
        )}

        <div
          className="pointer-events-auto relative w-full max-w-5xl"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? "none" : "scale(0.985)",
            transition: "opacity 240ms ease, transform 240ms ease",
          }}
        >
          <p className="eyebrow">
            {FILM.eyebrow.th} · <span lang="en">{FILM.eyebrow.en}</span>
          </p>
          <h2 id="film-heading" className="mt-2 text-xl font-light text-steel-200 phone:mt-1 phone:text-[0.95rem] sm:text-2xl">
            {FILM.heading.th}
            <span className="ml-3 text-[0.8rem] text-steel-400 phone:ml-2 phone:text-[0.62rem]" lang="en">
              {FILM.heading.en}
            </span>
          </h2>

          <div className="relative mt-4 overflow-hidden rounded-sm border border-steel-700/70 bg-black phone:mt-2 phone:flex phone:justify-center">
            <video
              ref={videoRef}
              src={FILM.src}
              poster={FILM.poster}
              preload={NEARBY.has(section.id) || isStatic ? "auto" : "metadata"}
              playsInline
              muted={muted}
              controls={isStatic}
              className="block h-auto w-full phone:mx-auto phone:max-h-[54svh] phone:w-auto"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onEnded={() => setEnded(true)}
              onError={() => setBlocked(true)}
            />

            {/* Whenever the clip is not running, one control covers it:
                start it, pick it back up, or watch it again. */}
            {!isStatic && paused && (
              <button
                type="button"
                onClick={blocked ? start : ended ? replay : start}
                className="absolute inset-0 flex items-center justify-center bg-steel-950/55 backdrop-blur-[2px] transition-colors hover:bg-steel-950/40"
              >
                <span className="flex items-center gap-2.5 rounded-sm border border-steel-700/70 bg-steel-950/85 px-4 py-2.5 text-[0.72rem] uppercase tracking-widest2 text-steel-200">
                  <span aria-hidden="true">{ended ? "↺" : "▶"}</span>
                  {ended ? FILM.replay.th : FILM.play.th}
                </span>
              </button>
            )}

            {/* Playing, but the browser insisted on silence. */}
            {!isStatic && !paused && muted && (
              <button
                type="button"
                onClick={toggleSound}
                className="absolute bottom-3 right-3 flex items-center gap-2 rounded-sm border border-ember/60 bg-steel-950/85 px-3 py-2 text-[0.68rem] uppercase tracking-widest2 text-ember backdrop-blur"
              >
                <span aria-hidden="true">♪</span>
                {FILM.soundPrompt.th}
              </button>
            )}
          </div>

          {!isStatic && (
            <>
              <div className="mt-3 h-px w-full bg-steel-800 phone:mt-2">
                <div
                  className="h-full bg-ember"
                  style={{ width: `${played * 100}%`, transition: "width 220ms linear" }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 phone:mt-2 phone:gap-2">
                <p className="text-[0.7rem] text-steel-400 phone:text-[0.58rem]">
                  {caught ? FILM.catchNote.th : FILM.hint.th}
                  <span className="ml-2 text-steel-500" lang="en">
                    {caught ? FILM.catchNote.en : FILM.hint.en}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={toggleSound}
                  className="shrink-0 rounded-sm border border-steel-700/70 px-3 py-1.5 text-[0.66rem] uppercase tracking-widest2 text-steel-300 transition-colors phone:px-2 phone:py-1 phone:text-[0.55rem] hover:border-ember/60 hover:text-ember"
                >
                  {muted ? FILM.sound.th : FILM.muted.th}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
