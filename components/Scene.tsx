"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Preload } from "@react-three/drei";
import * as THREE from "three";
import ArtworkModel from "./ArtworkModel";
import { CALLOUTS } from "@/content/callouts";
import { CAMERA_TRACK, SECTIONS } from "@/lib/sections";
import type { PartKey } from "@/lib/sections";
import { clamp, damp, smoothstep } from "@/lib/math";
import { getBuild, getCameraTrack, getScroll, prefersReducedMotion } from "@/lib/scroll";
import { clearAnchors, sceneReady, writeAnchor } from "@/lib/projection";

const PART_KEYS: PartKey[] = ["turret", "gun", "runningGear", "hull", "deck", "diorama"];
const DIM_LEVEL = 0.2;

/** The screen shape every camera keyframe was composed against. */
const DESIGN_ASPECT = 16 / 9;
/** The vertical lens never opens past this; distance takes over instead. */
const MAX_FOV = 70;
const RAD = Math.PI / 180;

/**
 * A three.js `fov` is vertical, so a narrow viewport keeps the framing
 * top-to-bottom and crops the sides — on a phone the model arrives filling
 * the whole screen with its nose and tail off the edges.
 *
 * Opening the vertical fov holds the *horizontal* angle at what the
 * keyframes were composed for, which is what actually frames a vehicle
 * three times longer than it is tall. Past `MAX_FOV` the correction is
 * taken as camera distance rather than lens, so a portrait phone pulls
 * back instead of going fish-eye.
 */
const fitToAspect = (fov: number, aspect: number) => {
  if (!(aspect > 0) || aspect >= DESIGN_ASPECT) return { fov, pull: 1 };
  const halfHorizontal = Math.atan(Math.tan((fov * RAD) / 2) * DESIGN_ASPECT);
  const needed = (2 * Math.atan(Math.tan(halfHorizontal) / aspect)) / RAD;
  const capped = Math.min(needed, MAX_FOV);
  return {
    fov: capped,
    pull: Math.tan((needed * RAD) / 2) / Math.tan((capped * RAD) / 2),
  };
};

/** Weight given to each part at a given scroll position. */
const focusTargets = (index: number): Record<PartKey, number> => {
  const section = SECTIONS[index];
  const overall = section.dim ?? 1;
  const out = {} as Record<PartKey, number>;
  for (const key of PART_KEYS) {
    const lit = section.focus === null ? 1 : section.focus === key ? 1 : DIM_LEVEL;
    out[key] = lit * overall;
  }
  return out;
};

/**
 * Drives the camera, the model yaw, the per-part dimming and the assembly
 * animation — all from scroll progress alone, with exponential damping so
 * scrolling back up lands on exactly the same frame.
 */
function ScrollRig({
  focusRef,
  buildRef,
  groupRef,
  orbitEnabled,
}: {
  focusRef: React.MutableRefObject<Record<PartKey, number>>;
  buildRef: React.MutableRefObject<number>;
  groupRef: React.MutableRefObject<THREE.Group | null>;
  orbitEnabled: boolean;
}) {
  const { camera, size } = useThree();
  const lookTarget = useRef(new THREE.Vector3(...CAMERA_TRACK[0].target));
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const worldAnchor = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const anchors = useMemo(
    () => CALLOUTS.map((c) => ({ id: c.id, local: new THREE.Vector3(...c.anchor) })),
    []
  );
  /** Eases the camera in on first load, then hands over to scroll. */
  const intro = useRef(0);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 20);
    const scroll = getScroll();
    const progress = scroll.progress;

    /* ---- interpolate the camera track ---- */
    // Measured from the laid-out document, so the keyframes stay aligned
    // with the copy panels whatever height a section ends up at.
    const track = getCameraTrack();
    let i = 0;
    while (i < track.length - 1 && progress > track[i + 1].t) i++;
    const a = track[i];
    const b = track[Math.min(i + 1, track.length - 1)];
    const span = b.t - a.t;
    const k = smoothstep(span > 0 ? clamp((progress - a.t) / span) : 0);

    desiredPos.copy(a.positionVec).lerp(b.positionVec, k);
    desiredTarget.copy(a.targetVec).lerp(b.targetVec, k);
    const yaw = a.modelYaw + (b.modelYaw - a.modelYaw) * k;

    // Keep the composed horizontal framing whatever shape the screen is.
    const fitted = fitToAspect(a.fov + (b.fov - a.fov) * k, size.width / size.height);
    const fov = fitted.fov;
    if (fitted.pull > 1) {
      desiredPos.sub(desiredTarget).multiplyScalar(fitted.pull).add(desiredTarget);
    }

    // Slide the look-at point sideways so a text column can sit beside the
    // model on wide screens. Narrow screens keep it centred.
    const bias = size.width >= 1024 ? a.bias + (b.bias - a.bias) * k : 0;
    if (bias !== 0) {
      forward.subVectors(desiredTarget, desiredPos).normalize();
      right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize();
      desiredTarget.addScaledVector(right, bias);
      desiredPos.addScaledVector(right, bias);
    }

    /* ---- model yaw, dimming and assembly ---- */
    if (groupRef.current) {
      groupRef.current.rotation.y = damp(groupRef.current.rotation.y, yaw, 3.6, dt);
    }

    const targets = focusTargets(scroll.sectionIndex);
    for (const key of PART_KEYS) {
      focusRef.current[key] = damp(focusRef.current[key], targets[key], 5, dt);
    }
    buildRef.current = damp(buildRef.current, getBuild(), 9, dt);

    /* ---- camera ---- */
    if (!orbitEnabled) {
      intro.current = Math.min(1, intro.current + dt / 1.4);
      const lambda = 3.2 + intro.current * 2.4;
      camera.position.lerp(desiredPos, 1 - Math.exp(-lambda * dt));
      lookTarget.current.lerp(desiredTarget, 1 - Math.exp(-lambda * dt));
      camera.lookAt(lookTarget.current);

      const perspective = camera as THREE.PerspectiveCamera;
      if (Math.abs(perspective.fov - fov) > 0.01) {
        perspective.fov = damp(perspective.fov, fov, 4, dt);
        perspective.updateProjectionMatrix();
      }
    }

    /* ---- project callout anchors to screen space ---- */
    const group = groupRef.current;
    if (group) {
      group.updateWorldMatrix(true, false);
      for (const anchor of anchors) {
        worldAnchor.copy(anchor.local).applyMatrix4(group.matrixWorld);
        projected.copy(worldAnchor).project(camera);
        const behind = projected.z > 1;
        writeAnchor(
          anchor.id,
          (projected.x * 0.5 + 0.5) * size.width,
          (-projected.y * 0.5 + 0.5) * size.height,
          !behind &&
            projected.x > -1.05 &&
            projected.x < 1.05 &&
            projected.y > -1.05 &&
            projected.y < 1.05
        );
      }
    }

    sceneReady.value = true;
  });

  useEffect(() => () => clearAnchors(), []);
  return null;
}

/**
 * Three-point lighting plus a small locally-rendered environment map, so
 * materials read correctly without fetching an HDR from a CDN.
 */
function Lighting({ shadows }: { shadows: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null);

  // Setting shadow-camera-* props does not rebuild the projection matrix,
  // so without this the frustum stays at its default and shadows drop out.
  useEffect(() => {
    const light = key.current;
    if (!light) return;
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
  }, [shadows]);

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight
        ref={key}
        position={[7, 9, 6]}
        intensity={3.0}
        color="#fff3e2"
        castShadow={shadows}
        shadow-mapSize={[1536, 1536]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      <directionalLight position={[-7, 4, -5]} intensity={0.35} color="#8fa6bd" />
      <directionalLight position={[-5, 5, -10]} intensity={1.25} color="#b9cddd" />
      <Environment resolution={128}>
        <Lightformer intensity={0.5} position={[0, 7, 0]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={0.38} position={[-6, 2, 4]} scale={[8, 8, 1]} rotation-y={Math.PI / 4} />
        <Lightformer intensity={0.28} color="#7f8fa0" position={[6, 1, -5]} scale={[8, 8, 1]} rotation-y={-Math.PI / 3} />
      </Environment>
    </>
  );
}

export interface SceneProps {
  /** True once the closing section is reached; unlocks free orbit. */
  orbitEnabled: boolean;
  onReady: () => void;
}

export default function Scene({ orbitEnabled, onReady }: SceneProps) {
  const focusRef = useRef<Record<PartKey, number>>({
    turret: 1,
    gun: 1,
    runningGear: 1,
    hull: 1,
    deck: 1,
    diorama: 1,
  });
  const buildRef = useRef(1);
  const groupRef = useRef<THREE.Group | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(prefersReducedMotion()), []);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      if (sceneReady.value) return onReady();
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    // If WebGL never produces a frame (blocked GPU, software renderer that
    // stalls), lift the loading overlay anyway rather than trapping the
    // reader behind it.
    const bail = window.setTimeout(onReady, 8000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(bail);
    };
  }, [onReady]);

  return (
    <Canvas
      shadows={!reduced}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: CAMERA_TRACK[0].position, fov: CAMERA_TRACK[0].fov, near: 0.5, far: 80 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.fog = new THREE.Fog("#0a0c0e", 24, 52);
      }}
    >
      <color attach="background" args={["#0a0c0e"]} />
      <Lighting shadows={!reduced} />
      <ArtworkModel focusRef={focusRef} buildRef={buildRef} groupRef={groupRef} />
      <ScrollRig
        focusRef={focusRef}
        buildRef={buildRef}
        groupRef={groupRef}
        orbitEnabled={orbitEnabled}
      />
      {orbitEnabled && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 1.5, 0]}
        />
      )}
      <Preload all />
    </Canvas>
  );
}
