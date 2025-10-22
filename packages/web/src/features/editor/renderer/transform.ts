import { Matrix } from '@/lib/matrix';

/**
 * Compose Local → Canvas using World → Canvas (DPR), optional Overlay (World), and Local → World.
 */
export function composeLocalToCanvas({
  worldToCanvas,
  overlayWorld,
  localToWorld,
}: {
  worldToCanvas: Matrix;
  overlayWorld?: Matrix;
  localToWorld?: Matrix;
}) {
  let transform = worldToCanvas;
  if (overlayWorld) {
    transform = transform.multiply(overlayWorld);
  }
  if (localToWorld) {
    transform = transform.multiply(localToWorld);
  }
  return transform;
}

/**
 * Build a local-space rotation delta around a local pivot.
 * Angle is in radians. Pivot is in the node's local coordinate space.
 */
export function localRotateDelta(angleRad: number, pivot: { x: number; y: number } = { x: 0, y: 0 }) {
  return new Matrix().translate(pivot.x, pivot.y).rotate(angleRad).translate(-pivot.x, -pivot.y);
}

/**
 * Build a local-space scale delta around a local pivot.
 * Pivot is in the node's local coordinate space.
 */
export function localScaleDelta(sx: number, sy: number, pivot: { x: number; y: number } = { x: 0, y: 0 }) {
  return new Matrix().translate(pivot.x, pivot.y).scale(sx, sy).translate(-pivot.x, -pivot.y);
}

/**
 * Convert a local-space delta into an equivalent world-space overlay that can be
 * pre-multiplied to the current transform (and used for preview).
 *
 * Given current node transform N and local delta L, this returns Δ = N * L * N^-1.
 *
 * Preview uses overlay * N, and commit pre-multiplies overlay as well, both yielding N * L.
 */
export function worldOverlayForLocalDelta(localToWorld?: Matrix, localDelta?: Matrix): Matrix | undefined {
  if (!localDelta) return undefined;
  const N = localToWorld ?? new Matrix();
  return N.multiply(localDelta).multiply(N.inverse());
}
