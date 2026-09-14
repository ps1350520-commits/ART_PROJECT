/**
 * Bridge between the WebGL scene and the DOM callout overlay.
 *
 * The scene writes projected screen coordinates here every frame; the SVG
 * overlay reads them in its own animation frame and moves elements by
 * mutating refs. Nothing here passes through React state, so a 60 fps
 * camera move costs zero re-renders.
 */

export interface ProjectedAnchor {
  /** Screen position in CSS pixels, relative to the canvas. */
  x: number;
  y: number;
  /** False when the anchor is behind the camera or off-screen. */
  visible: boolean;
}

const anchors = new Map<string, ProjectedAnchor>();

export const writeAnchor = (id: string, x: number, y: number, visible: boolean) => {
  const existing = anchors.get(id);
  if (existing) {
    existing.x = x;
    existing.y = y;
    existing.visible = visible;
  } else {
    anchors.set(id, { x, y, visible });
  }
};

export const readAnchor = (id: string): ProjectedAnchor | undefined => anchors.get(id);

/** Cleared when the scene unmounts so stale positions never linger. */
export const clearAnchors = () => anchors.clear();

/** Set once the first frame has rendered, to fade the loading screen out. */
export const sceneReady = { value: false };
