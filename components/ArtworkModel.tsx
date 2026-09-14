"use client";

/**
 * The artwork itself: a procedural stand-in for the handmade cardboard
 * Tiger I and its diorama base, built from R3F primitives and a few
 * hand-written geometries. Proportions follow the real Tiger I (scene
 * units are metres) while the surface detail follows the photographs in
 * `public/photos/`.
 *
 * ---------------------------------------------------------------------
 * SWAPPING IN A GLTF FILE
 * Put the file in `public/` and set GLTF_MODEL_URL below. That is the
 * only edit required - the callout anchors and the per-part focus
 * dimming keep working as long as the GLTF's child objects are named
 * with the same part keys: turret, gun, runningGear, hull, deck,
 * diorama. The staged assembly and the paint transition are specific to
 * the procedural build; the GLTF path only fades the model in.
 * ---------------------------------------------------------------------
 */

export const GLTF_MODEL_URL: string | null = null;

/**
 * Set to false to build the model without the wartime national flag over
 * the turret. The Balkenkreuz hull crosses are unaffected.
 */
export const SHOW_NATIONAL_FLAG = true;

import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { PartKey } from "@/lib/sections";
import { clamp, remap, smoothstep } from "@/lib/math";

/* ---------------------------- palette ------------------------------- */

/** Finished (painted) colours, sampled from the photographs. */
const PAINTED = {
  armour: "#6d747a",
  armourDark: "#4b5257",
  plateEdge: "#5a6166",
  gunSteel: "#54595e",
  trackSteel: "#3b4046",
  wheelFace: "#b9bcbd",
  wheelHub: "#2f3337",
} as const;

/** Bare corrugated cardboard, before the paint build stage. */
const CARDBOARD = {
  armour: "#b08655",
  armourDark: "#8d6840",
  plateEdge: "#c39a65",
  gunSteel: "#a97f4e",
  trackSteel: "#7d5c38",
  wheelFace: "#d2b183",
  wheelHub: "#6f5130",
} as const;

/** Diorama materials are never repainted; they are built as-is. */
const SCENERY = {
  grass: "#397c31",
  grassDeep: "#275c22",
  mud: "#7a4a30",
  rut: "#5c3521",
  board: "#4a3220",
  wood: "#9d7a4e",
  woodDark: "#6b5132",
  ember: "#e2762c",
} as const;

type MatKey = keyof typeof PAINTED;

/* ------------------------ material bank & focus --------------------- */

interface BankEntry {
  material: THREE.MeshStandardMaterial;
  painted: THREE.Color;
  raw: THREE.Color;
  dim: THREE.Color;
  part: PartKey | null;
}

/**
 * One material instance per (part, colour) pair so a single part can be
 * dimmed without touching the rest of the model. Roughly thirty small
 * materials - cheap, and it leaves the draw-call count unchanged.
 */
class MaterialBank {
  private entries = new Map<string, BankEntry>();

  get(part: PartKey, key: MatKey): THREE.MeshStandardMaterial {
    const id = `${part}:${key}`;
    const existing = this.entries.get(id);
    if (existing) return existing.material;

    const painted = new THREE.Color(PAINTED[key]);
    const raw = new THREE.Color(CARDBOARD[key]);
    const metallic = key === "gunSteel" || key === "trackSteel";

    const material = new THREE.MeshStandardMaterial({
      color: painted.clone(),
      roughness: metallic ? 0.5 : key === "wheelFace" ? 0.72 : 0.78,
      metalness: metallic ? 0.55 : key === "wheelFace" ? 0.2 : 0.22,
    });

    this.entries.set(id, {
      material,
      painted,
      raw,
      dim: painted.clone().lerp(new THREE.Color("#12161a"), 0.72),
      part,
    });
    return material;
  }

  /** Scenery material: dims with the diorama, never repaints. */
  scenery(
    color: string,
    opts: { roughness?: number; emissive?: string; emissiveIntensity?: number } = {}
  ): THREE.MeshStandardMaterial {
    const id = `scenery:${color}:${opts.emissive ?? ""}`;
    const existing = this.entries.get(id);
    if (existing) return existing.material;

    const base = new THREE.Color(color);
    const material = new THREE.MeshStandardMaterial({
      color: base.clone(),
      roughness: opts.roughness ?? 0.95,
      metalness: 0.03,
      emissive: new THREE.Color(opts.emissive ?? "#000000"),
      emissiveIntensity: opts.emissiveIntensity ?? 1,
    });

    this.entries.set(id, {
      material,
      painted: base,
      raw: base,
      dim: base.clone().lerp(new THREE.Color("#12161a"), 0.72),
      part: "diorama",
    });
    return material;
  }

  /**
   * Drives dimming and the paint transition. `focus[part]` is 1 for a
   * fully lit part and 0 for a fully dimmed one; `paint` is 0 for bare
   * cardboard and 1 for the finished paint job.
   */
  update(focus: Record<PartKey, number>, paint: number) {
    this.entries.forEach((entry) => {
      const lit = entry.part ? (focus[entry.part] ?? 1) : 1;
      entry.material.color
        .copy(entry.raw)
        .lerp(entry.painted, paint)
        .lerp(entry.dim, 1 - lit);
    });
  }

  dispose() {
    this.entries.forEach((e) => e.material.dispose());
    this.entries.clear();
  }
}

/* -------------------------- canvas textures ------------------------- */

/** Balkenkreuz - the black-and-white national cross carried on the hull. */
const makeBalkenkreuzTexture = () => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const half = size / 2;
  const cross = (thickness: number, length: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(half - length, half - thickness, length * 2, thickness * 2);
    ctx.fillRect(half - thickness, half - length, thickness * 2, length * 2);
  };

  ctx.clearRect(0, 0, size, size);
  cross(size * 0.19, half * 0.95, "#f2f2f2");
  cross(size * 0.1, half * 0.72, "#141414");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

/**
 * The wartime national flag as it appears draped over the turret in the
 * source photographs, where it stands in for the air-recognition flag
 * German crews laid on the engine deck. Drawn procedurally so the site
 * ships no such image asset; set SHOW_NATIONAL_FLAG to false to omit it.
 */
const makeFlagTexture = () => {
  const w = 256;
  const h = 160;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#c8102e";
  ctx.fillRect(0, 0, w, h);

  const band = h * 0.055;
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, h * 0.5 - band * 2.1, w, band * 4.2);
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, h * 0.5 - band * 1.1, w, band * 2.2);

  const cx = w * 0.42;
  const cy = h * 0.5;
  const r = h * 0.3;
  ctx.fillStyle = "#f2f2f2";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#141414";
  ctx.lineWidth = r * 0.3;
  const a = r * 0.6;
  const strokes: Array<[number, number, number, number]> = [
    [-a, 0, a, 0],
    [0, -a, 0, a],
    [a, 0, a, -a],
    [-a, 0, -a, a],
    [0, a, a, a],
    [0, -a, -a, -a],
  ];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of strokes) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

/* ---------------------------- geometries ---------------------------- */

/** Closed track band: a stadium loop with a matching hole punched in it. */
const makeTrackGeometry = (
  frontX: number,
  rearX: number,
  centreY: number,
  innerR: number,
  thickness: number,
  width: number
) => {
  const outerR = innerR + thickness;

  const outline = new THREE.Shape();
  outline.absarc(frontX, centreY, outerR, -Math.PI / 2, Math.PI / 2, false);
  outline.absarc(rearX, centreY, outerR, Math.PI / 2, (Math.PI * 3) / 2, false);
  outline.closePath();

  const hole = new THREE.Path();
  hole.absarc(frontX, centreY, innerR, -Math.PI / 2, Math.PI / 2, false);
  hole.absarc(rearX, centreY, innerR, Math.PI / 2, (Math.PI * 3) / 2, false);
  hole.closePath();
  outline.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: width,
    bevelEnabled: false,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -width / 2);
  return geometry;
};

/** The turret's faceted top-down outline, extruded upward. */
const makeTurretGeometry = (height: number) => {
  const pts: Array<[number, number]> = [
    [1.62, -0.52],
    [1.62, 0.52],
    [1.18, 1.22],
    [-0.75, 1.34],
    [-1.48, 1.06],
    [-1.7, 0.36],
    [-1.7, -0.36],
    [-1.48, -1.06],
    [-0.75, -1.34],
    [1.18, -1.22],
  ];

  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  // The shape plane (x, y) becomes world (x, z); extrusion becomes +Y.
  geometry.rotateX(-Math.PI / 2);
  return geometry;
};

/** Transforms for the cleats instanced around one track loop. */
const trackLinkTransforms = (
  frontX: number,
  rearX: number,
  centreY: number,
  radius: number,
  count: number
) => {
  const straight = frontX - rearX;
  const arc = Math.PI * radius;
  const perimeter = straight * 2 + arc * 2;
  const out: Array<{ position: THREE.Vector3; rotation: number }> = [];

  for (let i = 0; i < count; i++) {
    let d = (i / count) * perimeter;
    let x: number;
    let y: number;
    let rot: number;

    if (d < straight) {
      x = rearX + d;
      y = centreY + radius;
      rot = 0;
    } else if (d < straight + arc) {
      const t = (d - straight) / radius;
      x = frontX + Math.sin(t) * radius;
      y = centreY + Math.cos(t) * radius;
      rot = -t;
    } else if (d < straight * 2 + arc) {
      d -= straight + arc;
      x = frontX - d;
      y = centreY - radius;
      rot = Math.PI;
    } else {
      const t = (d - (straight * 2 + arc)) / radius;
      x = rearX - Math.sin(t) * radius;
      y = centreY - Math.cos(t) * radius;
      rot = Math.PI - t;
    }
    out.push({ position: new THREE.Vector3(x, y, 0), rotation: rot });
  }
  return out;
};

/* ------------------------ assembly build stages --------------------- */

/**
 * Build order taken from INFO.md: wheels first, then the hull core, then
 * the tracks, then the fittings and the paint.
 */
export const BUILD_STAGES = ["wheels", "hull", "tracks", "finish"] as const;
export type BuildStage = (typeof BUILD_STAGES)[number];

const STAGE_INDEX: Record<BuildStage, number> = {
  wheels: 0,
  hull: 1,
  tracks: 2,
  finish: 3,
};

/** 0 = not yet placed, 1 = seated in its final position. */
export const stageProgress = (build: number, stage: BuildStage) => {
  const span = 1 / BUILD_STAGES.length;
  const start = STAGE_INDEX[stage] * span;
  return smoothstep(remap(build, start, start + span * 0.82));
};

/** Paint arrives during the final stage. */
export const paintProgress = (build: number) => smoothstep(remap(build, 0.78, 1));

interface StageGroupProps {
  stage: BuildStage;
  /** Offset the piece flies in from, in metres. */
  from?: [number, number, number];
  buildRef: MutableRefObject<number>;
  children: ReactNode;
}

/** Lifts its children into place as the assembly timeline advances. */
const StageGroup = ({ stage, from = [0, 5, 0], buildRef, children }: StageGroupProps) => {
  const ref = useRef<THREE.Group>(null);
  const offset = useMemo(() => new THREE.Vector3(from[0], from[1], from[2]), [from]);

  useFrame(() => {
    const group = ref.current;
    if (!group) return;

    const t = stageProgress(buildRef.current, stage);
    group.visible = t > 0.002;
    if (!group.visible) return;

    // A touch of overshoot, so pieces "click" into place.
    const settle = 1 + Math.sin(t * Math.PI) * 0.04;
    group.position.set(
      offset.x * (1 - t),
      offset.y * (1 - t),
      offset.z * (1 - t)
    );
    group.scale.setScalar(t >= 1 ? 1 : Math.max(0.002, t * settle));
  });

  return <group ref={ref}>{children}</group>;
};

/* ----------------------------- the model ---------------------------- */

export interface ArtworkModelProps {
  /** Per-part lighting weight, 1 = lit, 0 = dimmed. Mutated every frame. */
  focusRef: MutableRefObject<Record<PartKey, number>>;
  /** Assembly progress, 0 = nothing built, 1 = finished and painted. */
  buildRef: MutableRefObject<number>;
  /** Receives the root group so callouts can project their anchors. */
  groupRef: MutableRefObject<THREE.Group | null>;
}

const TRACK_FRONT_X = 2.95;
const TRACK_REAR_X = -2.95;
const WHEEL_Y = 0.52;
const WHEEL_R = 0.45;
const TRACK_HALF_WIDTH = 1.55;
/** Lowers the diorama so the ground meets the bottom of the tracks. */
const DIORAMA_DROP = -0.11;
const ROAD_WHEEL_X = [-2.3, -1.15, 0, 1.15, 2.3];
const DECK_HATCHES: Array<[number, number]> = [
  [-1.55, 0.95],
  [-1.55, -0.95],
  [-2.45, 0],
];
const DRUM_Z = [-1.4, -0.7, 0, 0.7, 1.4];
const EMBER_PUFFS: Array<[number, number, number, number]> = [
  [0, 0.42, 0, 0.42],
  [0.3, 0.62, 0.12, 0.3],
  [-0.26, 0.58, -0.1, 0.27],
  [0.06, 0.86, -0.04, 0.22],
];

function ProceduralArtwork({ focusRef, buildRef, groupRef }: ArtworkModelProps) {
  const bank = useMemo(() => new MaterialBank(), []);
  const crossTexture = useMemo(() => makeBalkenkreuzTexture(), []);
  const flagTexture = useMemo(() => (SHOW_NATIONAL_FLAG ? makeFlagTexture() : null), []);
  const trackGeometry = useMemo(
    () => makeTrackGeometry(TRACK_FRONT_X, TRACK_REAR_X, WHEEL_Y, WHEEL_R, 0.11, 0.66),
    []
  );
  const turretGeometry = useMemo(() => makeTurretGeometry(0.78), []);
  const links = useMemo(
    () => trackLinkTransforms(TRACK_FRONT_X, TRACK_REAR_X, WHEEL_Y, WHEEL_R + 0.055, 46),
    []
  );

  const leftLinks = useRef<THREE.InstancedMesh>(null);
  const rightLinks = useRef<THREE.InstancedMesh>(null);

  useEffect(
    () => () => {
      bank.dispose();
      crossTexture?.dispose();
      flagTexture?.dispose();
      trackGeometry.dispose();
      turretGeometry.dispose();
    },
    [bank, crossTexture, flagTexture, trackGeometry, turretGeometry]
  );

  useEffect(() => {
    const dummy = new THREE.Object3D();
    for (const mesh of [leftLinks.current, rightLinks.current]) {
      if (!mesh) continue;
      links.forEach((link, i) => {
        dummy.position.copy(link.position);
        dummy.rotation.set(0, 0, link.rotation);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [links]);

  useFrame(() => {
    bank.update(focusRef.current, paintProgress(buildRef.current));
  });

  const mat = (part: PartKey, key: MatKey) => bank.get(part, key);

  const runningGearSide = (side: 1 | -1) => (
    <group key={side} position={[0, 0, side * TRACK_HALF_WIDTH]}>
      <StageGroup stage="wheels" from={[0, 3.2, side * 1.8]} buildRef={buildRef}>
        {ROAD_WHEEL_X.map((x) => (
          <group key={x} position={[x, WHEEL_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={mat("runningGear", "wheelFace")} castShadow>
              <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.3, 22]} />
            </mesh>
            <mesh material={mat("runningGear", "wheelHub")} position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.04, 12]} />
            </mesh>
          </group>
        ))}
        <mesh
          material={mat("runningGear", "trackSteel")}
          position={[TRACK_FRONT_X, WHEEL_Y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.42, 0.42, 0.28, 12]} />
        </mesh>
        <mesh
          material={mat("runningGear", "trackSteel")}
          position={[TRACK_REAR_X, WHEEL_Y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.4, 0.4, 0.28, 14]} />
        </mesh>
      </StageGroup>

      <StageGroup stage="tracks" from={[0, 2.4, side * 2.6]} buildRef={buildRef}>
        <mesh
          geometry={trackGeometry}
          material={mat("runningGear", "trackSteel")}
          castShadow
          receiveShadow
        />
        <instancedMesh
          ref={side === 1 ? leftLinks : rightLinks}
          args={[undefined, undefined, links.length]}
          material={mat("runningGear", "trackSteel")}
          castShadow
        >
          <boxGeometry args={[0.16, 0.06, 0.74]} />
        </instancedMesh>
        <mesh material={mat("runningGear", "plateEdge")} position={[-0.1, 1.26, 0.16]} castShadow>
          <boxGeometry args={[6.3, 0.07, 1.0]} />
        </mesh>
      </StageGroup>
    </group>
  );

  return (
    <group ref={groupRef} name="artwork">
      {/* ----------------------- hull ----------------------- */}
      <group name="hull">
        <StageGroup stage="hull" from={[0, 4.4, 0]} buildRef={buildRef}>
          <mesh material={mat("hull", "armour")} position={[0, 0.775, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.3, 0.95, 1.85]} />
          </mesh>
          <mesh material={mat("hull", "armour")} position={[-0.1, 1.51, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.1, 0.52, 3.45]} />
          </mesh>
          <mesh
            material={mat("hull", "armourDark")}
            position={[2.92, 1.47, 0]}
            rotation={[0, 0, -0.12]}
            castShadow
          >
            <boxGeometry args={[0.18, 0.66, 3.45]} />
          </mesh>
          <mesh
            material={mat("hull", "armourDark")}
            position={[3.12, 0.82, 0]}
            rotation={[0, 0, 0.22]}
            castShadow
          >
            <boxGeometry args={[0.18, 0.86, 1.85]} />
          </mesh>
          <mesh material={mat("hull", "armourDark")} position={[-3.02, 1.2, 0]} castShadow>
            <boxGeometry args={[0.16, 1.15, 3.4]} />
          </mesh>
          {/* Driver's visor block and the radio operator's hull machine gun. */}
          <mesh material={mat("hull", "armourDark")} position={[3.04, 1.52, 0.82]} castShadow>
            <boxGeometry args={[0.14, 0.26, 0.62]} />
          </mesh>
          <mesh material={mat("hull", "armourDark")} position={[3.04, 1.44, -0.78]} castShadow>
            <sphereGeometry args={[0.23, 14, 12]} />
          </mesh>
          <mesh
            material={mat("hull", "gunSteel")}
            position={[3.34, 1.44, -0.78]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.05, 0.52, 10]} />
          </mesh>
          {crossTexture &&
            ([1, -1] as const).map((side) => (
              <mesh
                key={side}
                position={[0.9, 1.5, side * 1.737]}
                rotation={[0, side === 1 ? 0 : Math.PI, 0]}
              >
                <planeGeometry args={[0.46, 0.46]} />
                <meshStandardMaterial
                  map={crossTexture}
                  transparent
                  roughness={0.85}
                  metalness={0}
                  polygonOffset
                  polygonOffsetFactor={-2}
                />
              </mesh>
            ))}
        </StageGroup>
      </group>

      {/* ------------------- running gear -------------------- */}
      <group name="runningGear">
        {runningGearSide(1)}
        {runningGearSide(-1)}
      </group>

      {/* ---------------------- turret ---------------------- */}
      <group name="turret">
        <StageGroup stage="hull" from={[0, 6.2, 0]} buildRef={buildRef}>
          <mesh
            geometry={turretGeometry}
            material={mat("turret", "armour")}
            position={[-0.35, 1.77, 0]}
            castShadow
            receiveShadow
          />
          <mesh material={mat("turret", "armourDark")} position={[1.34, 2.14, 0]} castShadow>
            <boxGeometry args={[0.32, 0.86, 1.38]} />
          </mesh>
        </StageGroup>

        <StageGroup stage="finish" from={[0, 2.2, 0]} buildRef={buildRef}>
          {/* Commander's cupola, hatch swung open as in the photographs. */}
          <mesh material={mat("turret", "armourDark")} position={[-1.15, 2.69, -0.52]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.3, 18]} />
          </mesh>
          <mesh
            material={mat("turret", "armourDark")}
            position={[-1.55, 2.94, -0.72]}
            rotation={[0, 0, -0.9]}
            castShadow
          >
            <cylinderGeometry args={[0.4, 0.4, 0.05, 18]} />
          </mesh>
          <mesh material={mat("turret", "armourDark")} position={[-0.75, 2.57, 0.66]} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.06, 16]} />
          </mesh>
          <mesh material={mat("turret", "armourDark")} position={[0.15, 2.57, 0.1]}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 14]} />
          </mesh>
          {/* Smoke-grenade launcher clusters on both turret cheeks. */}
          {([1, -1] as const).map((side) =>
            [0, 1, 2].map((i) => (
              <mesh
                key={`${side}-${i}`}
                material={mat("turret", "gunSteel")}
                position={[0.62 - i * 0.16, 2.46, side * (1.04 + i * 0.05)]}
                rotation={[side * -0.35, 0, -0.35]}
                castShadow
              >
                <cylinderGeometry args={[0.055, 0.055, 0.34, 8]} />
              </mesh>
            ))
          )}
        </StageGroup>

        {flagTexture && (
          <StageGroup stage="finish" from={[0, 1.4, 0]} buildRef={buildRef}>
            <mesh position={[-1.62, 2.6, 0.3]} rotation={[-Math.PI / 2, 0, 0.52]}>
              <planeGeometry args={[1.05, 0.78, 6, 4]} />
              <meshStandardMaterial
                map={flagTexture}
                side={THREE.DoubleSide}
                roughness={0.95}
                metalness={0}
              />
            </mesh>
          </StageGroup>
        )}
      </group>

      {/* ------------------------ gun ----------------------- */}
      <group name="gun">
        <StageGroup stage="hull" from={[3.5, 3.2, 0]} buildRef={buildRef}>
          <mesh
            material={mat("gun", "gunSteel")}
            position={[3.1, 2.14, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.115, 0.135, 3.3, 16]} />
          </mesh>
          <mesh
            material={mat("gun", "gunSteel")}
            position={[4.66, 2.14, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.17, 0.17, 0.42, 16]} />
          </mesh>
          {/* Hollow bore, as cut into the rolled cardboard barrel. */}
          <mesh position={[4.885, 2.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.085, 0.085, 0.06, 14]} />
            <meshStandardMaterial color="#0b0d0f" roughness={1} metalness={0} />
          </mesh>
        </StageGroup>
      </group>

      {/* ---------------- deck fittings & rear --------------- */}
      <group name="deck">
        <StageGroup stage="finish" from={[-2.4, 2.6, 0]} buildRef={buildRef}>
          {DECK_HATCHES.map(([x, z]) => (
            <mesh
              key={`${x}:${z}`}
              material={mat("deck", "armourDark")}
              position={[x, 1.79, z]}
              castShadow
            >
              <cylinderGeometry args={[0.33, 0.33, 0.06, 16]} />
            </mesh>
          ))}
          <mesh material={mat("deck", "armourDark")} position={[-0.95, 1.79, 0]} castShadow>
            <boxGeometry args={[0.62, 0.06, 1.1]} />
          </mesh>
          {/* Fuel and exhaust drums across the rear plate. */}
          {DRUM_Z.map((z) => (
            <mesh
              key={z}
              material={mat("deck", "armourDark")}
              position={[-3.32, 1.06, z]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.2, 0.2, 0.6, 12]} />
            </mesh>
          ))}
          {/* Stowage box, tow cable and tools along the fenders. */}
          <mesh material={mat("deck", "plateEdge")} position={[-2.1, 1.94, 1.62]} castShadow>
            <boxGeometry args={[0.9, 0.28, 0.34]} />
          </mesh>
          <mesh
            material={mat("deck", "gunSteel")}
            position={[1.4, 1.84, 1.66]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
          </mesh>
          <mesh material={mat("deck", "plateEdge")} position={[1.2, 1.84, -1.62]} castShadow>
            <boxGeometry args={[1.2, 0.1, 0.22]} />
          </mesh>
        </StageGroup>
      </group>

      {/* --------------------- diorama ---------------------- */}
      <group name="diorama">
        <StageGroup stage="finish" from={[0, -1.8, 0]} buildRef={buildRef}>
          {/* The track run bottoms out at y = -0.04; this offset puts the
              ground right under it instead of halfway up the wheels. */}
          <group position={[0, DIORAMA_DROP, 0]}>
          <mesh
            position={[-0.4, -0.09, 0]}
            material={bank.scenery(SCENERY.board)}
            receiveShadow
          >
            <boxGeometry args={[10.0, 0.16, 6.2]} />
          </mesh>
          <mesh
            position={[-0.4, 0, 0]}
            material={bank.scenery(SCENERY.grass, { roughness: 1 })}
            receiveShadow
          >
            <boxGeometry args={[9.7, 0.12, 5.95]} />
          </mesh>
          <mesh
            position={[-0.4, 0.061, 2.6]}
            material={bank.scenery(SCENERY.grassDeep, { roughness: 1 })}
            receiveShadow
          >
            <boxGeometry args={[9.7, 0.02, 0.7]} />
          </mesh>
          {/* Churned mud the tank is crossing. */}
          <mesh
            position={[-0.3, 0.07, -0.1]}
            rotation={[0, 0.16, 0]}
            material={bank.scenery(SCENERY.mud, { roughness: 1 })}
            receiveShadow
          >
            <boxGeometry args={[9.5, 0.03, 4.3]} />
          </mesh>
          {([1, -1] as const).map((side) => (
            <mesh
              key={side}
              position={[-2.6, 0.088, side * TRACK_HALF_WIDTH - 0.1]}
              rotation={[0, 0.16, 0]}
              material={bank.scenery(SCENERY.rut, { roughness: 1 })}
            >
              <boxGeometry args={[5.6, 0.02, 0.72]} />
            </mesh>
          ))}
          {/* Chopstick anti-tank barricade. */}
          <group position={[-3.3, 0.09, 2.5]} rotation={[0, -0.2, 0]}>
            {[-1.5, 0, 1.5].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                {[0.5, -0.5].map((tilt) => (
                  <mesh
                    key={tilt}
                    position={[0, 0.42, 0]}
                    rotation={[tilt, 0, 0]}
                    material={bank.scenery(SCENERY.wood)}
                    castShadow
                  >
                    <cylinderGeometry args={[0.055, 0.055, 1.05, 8]} />
                  </mesh>
                ))}
              </group>
            ))}
            {[0.52, 0.14].map((y) => (
              <mesh
                key={y}
                position={[0, y, 0]}
                rotation={[0, 0, Math.PI / 2]}
                material={bank.scenery(SCENERY.woodDark)}
                castShadow
              >
                <cylinderGeometry args={[0.05, 0.05, 3.6, 8]} />
              </mesh>
            ))}
          </group>
          {/* Cotton-wool shell burst at the far corner. */}
          <group position={[-3.9, 0.2, -2.1]}>
            {EMBER_PUFFS.map(([x, y, z, r], i) => (
              <mesh
                key={i}
                position={[x, y, z]}
                material={bank.scenery(SCENERY.ember, {
                  roughness: 0.8,
                  emissive: SCENERY.ember,
                  emissiveIntensity: 0.35,
                })}
                castShadow
              >
                <sphereGeometry args={[r, 12, 10]} />
              </mesh>
            ))}
            {[0, 1, 2, 3].map((i) => (
              <mesh
                key={`shard-${i}`}
                position={[
                  Math.cos((i / 4) * Math.PI * 2) * 0.34,
                  0.14,
                  Math.sin((i / 4) * Math.PI * 2) * 0.34,
                ]}
                rotation={[0, (i / 4) * Math.PI * 2, 0.5]}
                material={bank.scenery(SCENERY.woodDark)}
              >
                <boxGeometry args={[0.36, 0.04, 0.12]} />
              </mesh>
            ))}
          </group>
          </group>
        </StageGroup>
      </group>
    </group>
  );
}

/* -------------------- optional GLTF replacement --------------------- */

const PART_NAMES: PartKey[] = ["turret", "gun", "runningGear", "hull", "deck", "diorama"];

function GltfArtwork({ url, focusRef, buildRef, groupRef }: ArtworkModelProps & { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const targets = useRef<
    Array<{ material: THREE.MeshStandardMaterial; base: THREE.Color; dim: THREE.Color; part: PartKey }>
  >([]);

  useEffect(() => {
    const found: typeof targets.current = [];
    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;

      // Walk up to the nearest ancestor named after a part key.
      let node: THREE.Object3D | null = object;
      let part: PartKey = "hull";
      while (node) {
        if (PART_NAMES.includes(node.name as PartKey)) {
          part = node.name as PartKey;
          break;
        }
        node = node.parent;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        const base = material.color.clone();
        found.push({
          material,
          base,
          dim: base.clone().lerp(new THREE.Color("#12161a"), 0.72),
          part,
        });
      }
    });
    targets.current = found;
  }, [cloned]);

  useFrame(() => {
    for (const entry of targets.current) {
      const lit = focusRef.current[entry.part] ?? 1;
      entry.material.color.copy(entry.base).lerp(entry.dim, 1 - lit);
    }
    cloned.visible = clamp(buildRef.current) > 0.02;
  });

  return (
    <group ref={groupRef} name="artwork">
      <primitive object={cloned} />
    </group>
  );
}

export default function ArtworkModel(props: ArtworkModelProps) {
  if (GLTF_MODEL_URL) return <GltfArtwork url={GLTF_MODEL_URL} {...props} />;
  return <ProceduralArtwork {...props} />;
}

if (GLTF_MODEL_URL) useGLTF.preload(GLTF_MODEL_URL);
