import * as THREE from "three";

export const clamp = (v: number, min = 0, max = 1) =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Maps v from [inMin,inMax] to [0,1], clamped. */
export const remap = (v: number, inMin: number, inMax: number) =>
  clamp((v - inMin) / (inMax - inMin || 1));

/** Smooth 0..1 ease with zero derivative at both ends. */
export const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/**
 * Frame-rate independent exponential damping.
 * `lambda` is the decay rate: higher = snappier. Equivalent to a critically
 * damped approach, which is what the camera uses instead of linear lerp.
 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const dampVector = (
  current: THREE.Vector3,
  target: THREE.Vector3,
  lambda: number,
  dt: number
) => {
  const t = 1 - Math.exp(-lambda * dt);
  current.lerp(target, t);
  return current;
};

export const dampColor = (
  current: THREE.Color,
  target: THREE.Color,
  lambda: number,
  dt: number
) => {
  const t = 1 - Math.exp(-lambda * dt);
  current.lerp(target, t);
  return current;
};
