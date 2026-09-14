import * as THREE from "three";

/**
 * Scene units are metres at the scale of the REAL Tiger I, so camera
 * distances read naturally. The hull is centred on the origin, the gun
 * points along +X, and the diorama base sits at y = 0.
 */
export type PartKey =
  | "turret"
  | "gun"
  | "runningGear"
  | "hull"
  | "deck"
  | "diorama";

export type SectionId =
  | "hero"
  | "overview"
  | PartKey
  | "assembly"
  | "specs"
  | "film"
  | "closing";

export interface CameraKeyframe {
  /** Camera world position. */
  position: [number, number, number];
  /** Point the camera looks at. */
  target: [number, number, number];
  /** Yaw applied to the whole artwork group, in radians. */
  modelYaw: number;
  fov: number;
}

export interface SectionDef {
  id: SectionId;
  /** Section height as a multiple of the viewport height. */
  vh: number;
  /** Which part of the model is highlighted; others dim. `null` = all lit. */
  focus: PartKey | null;
  camera: CameraKeyframe;
  /**
   * Metres to slide the look-at point along the camera's right axis on wide
   * screens, pushing the model off-centre so a text column can sit beside
   * it. Applied to the frustum, so projected callouts follow automatically.
   */
  bias?: number;
  /**
   * Which side of the viewport callout labels are placed on: -1 = left,
   * 1 = right. Chosen to sit opposite the section's copy panel so a label
   * can never land on top of it.
   */
  labelSide?: -1 | 1;
  /**
   * Fraction of the section over which the camera holds its keyframe.
   * A sticky copy panel unpins after `vh - 100` viewport heights, so the
   * default matches that window: the camera stays put while the text is
   * readable, then travels once the text has scrolled away.
   */
  holdUntil?: number;
  /**
   * Overall brightness of the model during this section, 1 = full. Used by
   * the full-width sections, where the copy covers the canvas and the model
   * should recede into a backdrop instead of competing with the text.
   */
  dim?: number;
}

export const SECTIONS: SectionDef[] = [
  {
    id: "hero",
    vh: 100,
    focus: null,
    bias: -1.0,
    camera: {
      position: [10.0, 4.8, 12.8],
      target: [0.4, -0.2, 0],
      modelYaw: -0.35,
      fov: 32,
    },
  },
  {
    id: "overview",
    vh: 185,
    focus: null,
    bias: -0.5,
    labelSide: 1,
    camera: {
      position: [1.4, 6.6, 16.2],
      target: [0, 1.2, 0],
      modelYaw: -0.95,
      fov: 36,
    },
  },
  {
    id: "turret",
    vh: 185,
    focus: "turret",
    bias: 0.55,
    labelSide: -1,
    camera: {
      position: [4.4, 4.7, 7.5],
      target: [-0.3, 2.35, 0],
      modelYaw: -0.55,
      fov: 36,
    },
  },
  {
    id: "gun",
    vh: 185,
    focus: "gun",
    bias: 0.55,
    labelSide: -1,
    camera: {
      position: [9.6, 3.0, 5.4],
      target: [3.2, 2.1, 0],
      modelYaw: -0.18,
      fov: 34,
    },
  },
  {
    id: "runningGear",
    vh: 185,
    focus: "runningGear",
    bias: 0.55,
    labelSide: -1,
    camera: {
      position: [1.9, 1.5, 10.5],
      target: [0.2, 0.85, 1.5],
      modelYaw: 0.06,
      fov: 36,
    },
  },
  {
    id: "hull",
    vh: 185,
    focus: "hull",
    bias: 0.55,
    labelSide: -1,
    camera: {
      position: [9.2, 2.3, 6.5],
      target: [2.6, 1.35, 0.3],
      modelYaw: -0.16,
      fov: 36,
    },
  },
  {
    id: "deck",
    vh: 185,
    focus: "deck",
    bias: 0.55,
    labelSide: -1,
    camera: {
      position: [-6.0, 5.9, 7.0],
      target: [-2.2, 1.75, 0],
      modelYaw: -0.62,
      fov: 36,
    },
  },
  {
    id: "diorama",
    vh: 185,
    focus: "diorama",
    bias: 0.55,
    labelSide: -1,
    camera: {
      position: [0.4, 3.4, 13.4],
      target: [0, 0.35, 0],
      modelYaw: -1.25,
      fov: 38,
    },
  },
  {
    id: "assembly",
    holdUntil: 0.92,
    vh: 300,
    focus: null,
    bias: -1.2,
    camera: {
      position: [3.2, 4.3, 15.0],
      target: [0, 1.4, 0],
      modelYaw: -0.45,
      fov: 36,
    },
  },
  {
    id: "specs",
    holdUntil: 0.92,
    vh: 150,
    focus: null,
    dim: 0.3,
    camera: {
      position: [-3.0, 8.2, 21.5],
      target: [0, 1.2, 0],
      modelYaw: -2.15,
      fov: 34,
    },
  },
  {
    id: "film",
    vh: 140,
    focus: null,
    // The clip takes the whole screen, so the model is pulled back and
    // faded almost to black behind the blackout.
    dim: 0.04,
    camera: {
      position: [0, 6.0, 24.0],
      target: [0, 1.2, 0],
      modelYaw: -1.6,
      fov: 32,
    },
  },
  {
    id: "closing",
    vh: 170,
    focus: null,
    bias: -0.9,
    camera: {
      position: [7.4, 3.9, 12.4],
      target: [0, 1.5, 0],
      modelYaw: -0.35,
      fov: 36,
    },
  },
];

export const PART_SECTIONS = SECTIONS.filter(
  (s): s is SectionDef & { focus: PartKey } => s.focus !== null
);

export const TOTAL_VH = SECTIONS.reduce((sum, s) => sum + s.vh, 0);

/** Cumulative [start, end] of every section in global progress space (0..1). */
export const SECTION_RANGES: Record<SectionId, { start: number; end: number; center: number }> =
  (() => {
    const out = {} as Record<SectionId, { start: number; end: number; center: number }>;
    let acc = 0;
    for (const s of SECTIONS) {
      const start = acc / TOTAL_VH;
      acc += s.vh;
      const end = acc / TOTAL_VH;
      out[s.id] = { start, end, center: (start + end) / 2 };
    }
    return out;
  })();

/** The camera keyframe of every section, without a position on the track. */
const FRAMES = SECTIONS.map((s) => ({
  id: s.id,
  bias: s.bias ?? 0,
  ...s.camera,
  positionVec: new THREE.Vector3(...s.camera.position),
  targetVec: new THREE.Vector3(...s.camera.target),
}));

/**
 * Two keyframes per section: the camera *arrives* just after that
 * section's copy appears, then *holds* that exact frame until the copy
 * unpins and scrolls away. All the movement therefore happens between
 * sections, never underneath the text being read.
 *
 * The track is built from whatever section ranges it is handed. At runtime
 * those are measured from the laid-out document (see `lib/scroll`), so the
 * camera keeps step with the copy even when a section renders taller than
 * the `vh` figure declared here.
 */
export const makeCameraTrack = (rangeOf: (id: SectionId) => { start: number; end: number }) =>
  SECTIONS.flatMap((s, i) => {
    const { start, end } = rangeOf(s.id);
    const span = end - start;
    const frame = FRAMES[i];
    return [
      { ...frame, t: i === 0 ? 0 : start + span * 0.09 },
      { ...frame, t: start + span * (s.holdUntil ?? 0.46) },
    ];
  });

/** Fallback track from the declared heights, used until the first measure. */
export const CAMERA_TRACK = makeCameraTrack((id) => SECTION_RANGES[id]);

export type CameraTrack = ReturnType<typeof makeCameraTrack>;

export const sectionIndexAt = (progress: number) => {
  for (let i = 0; i < SECTIONS.length; i++) {
    const r = SECTION_RANGES[SECTIONS[i].id];
    if (progress < r.end) return i;
  }
  return SECTIONS.length - 1;
};
