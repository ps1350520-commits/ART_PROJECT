"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ALL_PHOTOS, photoIndexOf } from "@/content/site";
import type { Photo } from "@/content/site";
import { setScrollLocked } from "@/lib/scroll";

/**
 * The page keeps its cards short and its photographs large; everything
 * that used to sit on a card in full now opens here instead.
 *
 * Two kinds of overlay share one stack: a light-box for photographs and a
 * reading pane for long copy. They stack rather than replace each other,
 * so opening a photo from inside a reading pane and closing it again
 * returns the reader to where it was.
 */
type View =
  | { kind: "photo"; photos: Photo[]; index: number }
  | { kind: "reader"; title: string; subtitle?: string; body: ReactNode };

interface OverlayApi {
  /** Opens the light-box on `src`, browsing `photos` (the whole set by default). */
  openPhoto: (src: string, photos?: Photo[]) => void;
  openReader: (view: { title: string; subtitle?: string; body: ReactNode }) => void;
  close: () => void;
}

const OverlayContext = createContext<OverlayApi | null>(null);

export function useOverlay() {
  const api = useContext(OverlayContext);
  if (!api) throw new Error("useOverlay must be used inside <OverlayProvider>");
  return api;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<View[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const api = useMemo<OverlayApi>(
    () => ({
      openPhoto: (src, photos = ALL_PHOTOS) => {
        const index = Math.max(
          0,
          photos === ALL_PHOTOS ? photoIndexOf(src) : photos.findIndex((p) => p.src === src)
        );
        setStack((s) => [...s, { kind: "photo", photos, index }]);
      },
      openReader: (view) => setStack((s) => [...s, { ...view, kind: "reader" }]),
      close: () => setStack((s) => s.slice(0, -1)),
    }),
    []
  );

  const top = stack[stack.length - 1];
  const isOpen = stack.length > 0;

  // One lock for the whole stack: the page stays frozen until the last
  // overlay closes, and is released if this unmounts mid-stack.
  useEffect(() => {
    if (!isOpen) return;
    setScrollLocked(true);
    return () => setScrollLocked(false);
  }, [isOpen]);

  // Escape is handled here rather than on the overlay element: opening a
  // photo from inside the reading pane unmounts whatever held focus, and a
  // handler bound to that element would go with it.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setStack((s) => s.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const step = useCallback(
    (delta: number) =>
      setStack((s) => {
        const current = s[s.length - 1];
        if (!current || current.kind !== "photo") return s;
        const count = current.photos.length;
        const index = (current.index + delta + count) % count;
        return [...s.slice(0, -1), { ...current, index }];
      }),
    []
  );

  return (
    <OverlayContext.Provider value={api}>
      {children}
      {mounted &&
        top &&
        createPortal(
          <OverlayFrame focusKey={`${stack.length}:${top.kind}`} labelledBy="overlay-title" onClose={api.close}>
            {top.kind === "photo" ? (
              <PhotoView view={top} onClose={api.close} onStep={step} />
            ) : (
              <ReaderView view={top} onClose={api.close} />
            )}
          </OverlayFrame>,
          document.body
        )}
    </OverlayContext.Provider>
  );
}

/* ---------------------------- overlay chrome ------------------------ */

/**
 * Backdrop, focus handling and the Escape key — everything both kinds of
 * overlay need. Focus moves inside on open, is kept inside while open, and
 * returns to whatever opened the overlay on close.
 */
function OverlayFrame({
  children,
  onClose,
  labelledBy,
  focusKey,
}: {
  children: ReactNode;
  onClose: () => void;
  labelledBy: string;
  /** Changes whenever a different view comes to the top of the stack. */
  focusKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Hand focus back to whatever opened the overlay once it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus?.();
  }, []);

  // Each new view takes focus, so the keyboard never drops back to the
  // frozen page behind the overlay.
  useEffect(() => {
    ref.current?.focus();
  }, [focusKey]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusables = ref.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="overlay-root fixed inset-0 z-[60] flex flex-col outline-none"
    >
      <button
        type="button"
        aria-label="ปิด"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-zoom-out bg-steel-950/95 backdrop-blur-md"
      />
      {children}
    </div>
  );
}

/** The round control used for close and for stepping between photos. */
function RoundButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-steel-700/70 bg-steel-950/80 text-steel-300 backdrop-blur transition-colors phone:h-9 phone:w-9 hover:border-ember/60 hover:text-ember ${className}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ light-box --------------------------- */

function PhotoView({
  view,
  onClose,
  onStep,
}: {
  view: Extract<View, { kind: "photo" }>;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const photo = view.photos[view.index];
  const many = view.photos.length > 1;

  useEffect(() => {
    if (!many) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onStep(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onStep(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [many, onStep]);

  return (
    <div className="pointer-events-none relative flex h-full w-full flex-col px-3 py-3 sm:px-6 sm:py-6">
      <div className="pointer-events-auto flex items-center justify-between gap-4">
        <p className="font-mono text-[0.7rem] text-steel-400">
          {String(view.index + 1).padStart(2, "0")} / {String(view.photos.length).padStart(2, "0")}
        </p>
        <RoundButton label="ปิดภาพ" onClick={onClose}>
          <span aria-hidden="true" className="text-lg leading-none">
            ✕
          </span>
        </RoundButton>
      </div>

      <div className="relative mt-2 min-h-0 flex-1">
        <Image
          key={photo.src}
          src={photo.src}
          alt={photo.alt.th}
          fill
          sizes="100vw"
          priority
          className="object-contain"
        />
      </div>

      <div className="pointer-events-auto mx-auto mt-3 flex w-full max-w-3xl items-end gap-4">
        {many && (
          <RoundButton label="ภาพก่อนหน้า" onClick={() => onStep(-1)} className="shrink-0">
            <span aria-hidden="true">←</span>
          </RoundButton>
        )}
        <div className="min-w-0 flex-1 text-center">
          <p id="overlay-title" className="text-sm font-light text-steel-200 phone:text-[0.76rem]">
            {photo.title.th}
            <span className="ml-2 text-[0.72rem] text-steel-400" lang="en">
              {photo.title.en}
            </span>
          </p>
          <p className="mt-1 text-[0.72rem] leading-relaxed text-steel-400 phone:mt-0.5 phone:text-[0.6rem]">{photo.alt.th}</p>
        </div>
        {many && (
          <RoundButton label="ภาพถัดไป" onClick={() => onStep(1)} className="shrink-0">
            <span aria-hidden="true">→</span>
          </RoundButton>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- reading pane -------------------------- */

function ReaderView({
  view,
  onClose,
}: {
  view: Extract<View, { kind: "reader" }>;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-none relative flex h-full w-full items-center justify-center p-3 sm:p-6">
      {/* The pane never grows past the viewport: the header stays put and
          the copy scrolls inside it. */}
      <div className="panel pointer-events-auto flex max-h-full w-full max-w-2xl flex-col bg-steel-950/95">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-steel-700/70 px-5 py-4 phone:px-3 phone:py-2.5 sm:px-7">
          <div className="min-w-0">
            <h2 id="overlay-title" className="text-xl font-light text-steel-200 phone:text-[1rem] sm:text-2xl">
              {view.title}
            </h2>
            {view.subtitle && (
              <p className="mt-0.5 text-[0.8rem] text-steel-400" lang="en">
                {view.subtitle}
              </p>
            )}
          </div>
          <RoundButton label="ปิด" onClick={onClose} className="shrink-0">
            <span aria-hidden="true" className="text-lg leading-none">
              ✕
            </span>
          </RoundButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 phone:px-3 phone:py-3 sm:px-7 sm:py-6">
          {view.body}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- clickable photo ------------------------ */

/**
 * A photograph that opens full size when clicked. Every image on the page
 * goes through this, so there is one behaviour to learn and one place to
 * change it.
 */
export function PhotoFrame({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
  children,
}: {
  src: string;
  alt: string;
  sizes: string;
  /** Aspect and radius classes for the frame itself. */
  className?: string;
  priority?: boolean;
  /** Optional badge drawn over the photograph. */
  children?: ReactNode;
}) {
  const { openPhoto } = useOverlay();

  return (
    <button
      type="button"
      onClick={() => openPhoto(src)}
      aria-label={`ดูภาพขนาดเต็ม: ${alt}`}
      className={`photo-frame group relative block w-full cursor-zoom-in overflow-hidden bg-steel-900 ${className}`}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-steel-700/70 bg-steel-950/70 text-[0.8rem] text-steel-300 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        ⤢
      </span>
    </button>
  );
}

/** The "read it in full" control that sits at the foot of every card. */
export function ReadMore({
  onClick,
  label = "อ่านฉบับเต็ม",
  labelEn = "Read in full",
}: {
  onClick: () => void;
  label?: string;
  labelEn?: string;
}) {
  return (
    <button type="button" onClick={onClick} className="read-more">
      <span>
        {label} · <span lang="en">{labelEn}</span>
      </span>
      <span aria-hidden="true">→</span>
    </button>
  );
}
