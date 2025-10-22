import type { PathGeometry } from '@/lib/geometry';
import { pathGeometryToSvgPath } from '@/lib/svg';
import { boundsPath } from 'geom-wasm';
import type { Matrix } from '@/lib/matrix';
import { buildFullTransform } from '@/features/editor/renderer/transform';

// Handle identifiers are index-based to avoid implying world/cardinal directions.
// Corners: c0..c3 go clockwise starting at local (minX,minY)
// Edges:   e0..e3 are edges: top, right, bottom, left in local space
export type HandleId = 'c0' | 'c1' | 'c2' | 'c3' | 'e0' | 'e1' | 'e2' | 'e3';

export const HANDLE_SIZE = 12;
export const HANDLE_HIT_SLOP = 4;

export type Point = { x: number; y: number };

/**
 * Compute the selection bounding box corners in canvas space,
 * applying overlay and node transforms.
 */
export function computeSelectionCornersCanvas(
  geom: PathGeometry,
  dprTransform: Matrix,
  overlayTransform: Matrix | undefined,
  nodeTransform: Matrix | undefined,
): Point[] | null {
  if (!geom.contours.length) return null;

  // Build the full transform local -> canvas
  const localToCanvas = buildFullTransform({
    dprTransform,
    overlayTransform,
    nodeTransform,
  });

  // Compute local-space bounds of the geometry
  const svgPathLocal = pathGeometryToSvgPath(geom);
  const raw = boundsPath(svgPathLocal);
  if (raw == undefined) return null;
  const [bx0, by0, bx1, by1] = raw;
  if (!isFinite(bx0 + by0 + bx1 + by1)) return null;

  // Create local-rect corners and transform them to canvas space to respect the node transformations
  // Corner ordering is clockwise in local space starting from (minX,minY)
  const bboxCornersLocal = [
    { x: bx0, y: by0 }, // c0
    { x: bx1, y: by0 }, // c1
    { x: bx1, y: by1 }, // c2
    { x: bx0, y: by1 }, // c3
  ];
  const dm = localToCanvas;
  const bboxCornersCanvas = bboxCornersLocal.map((p) => {
    const x = dm.a * p.x + dm.c * p.y + dm.tx;
    const y = dm.b * p.x + dm.d * p.y + dm.ty;
    return { x, y };
  });

  return bboxCornersCanvas;
}

export type HandleRect = { id: HandleId; x: number; y: number; w: number; h: number };

/**
 * Given the selection corners in canvas space, returns handle rectangles centered on each corner.
 */
export function getCornerHandleRects(corners: Point[], handleSize: number): HandleRect[] {
  if (!corners || corners.length !== 4) return [];
  const half = handleSize / 2;
  const rectFor = (id: HandleId, p: Point): HandleRect => ({
    id,
    x: p.x - half,
    y: p.y - half,
    w: handleSize,
    h: handleSize,
  });
  return [rectFor('c0', corners[0]), rectFor('c1', corners[1]), rectFor('c2', corners[2]), rectFor('c3', corners[3])];
}

/**
 * Given the selection corners in canvas space, returns handle rectangles centered on the edge midpoints.
 */
export function getEdgeHandleRects(corners: Point[], handleSize: number): HandleRect[] {
  if (!corners || corners.length !== 4) return [];
  const half = handleSize / 2;
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const mids: Point[] = [
    mid(corners[0], corners[1]),
    mid(corners[1], corners[2]),
    mid(corners[2], corners[3]),
    mid(corners[3], corners[0]),
  ];
  const rectFor = (id: HandleId, p: Point): HandleRect => ({
    id,
    x: p.x - half,
    y: p.y - half,
    w: handleSize,
    h: handleSize,
  });
  return [rectFor('e0', mids[0]), rectFor('e1', mids[1]), rectFor('e2', mids[2]), rectFor('e3', mids[3])];
}

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  geom: PathGeometry,
  dprTransform: Matrix,
  overlayTransform: Matrix | undefined,
  nodeTransform: Matrix | undefined,
) {
  const bboxCornersCanvas = computeSelectionCornersCanvas(geom, dprTransform, overlayTransform, nodeTransform);
  if (!bboxCornersCanvas) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity transform to ensure we're drawing in canvas space
  ctx.strokeStyle = '#2D90F3';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(bboxCornersCanvas[0].x, bboxCornersCanvas[0].y);
  for (let i = 1; i < bboxCornersCanvas.length; i++) {
    ctx.lineTo(bboxCornersCanvas[i].x, bboxCornersCanvas[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  drawBoundingBoxHandles(ctx, bboxCornersCanvas, HANDLE_SIZE);
  ctx.restore();
}

function drawBoundingBoxHandles(ctx: CanvasRenderingContext2D, bboxCorners: Point[], handleSize: number) {
  const half = handleSize / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#2D90F3';
  // Draw corner handles
  for (const c of bboxCorners) {
    // Draw each a different color
    ctx.beginPath();
    ctx.rect(c.x - half, c.y - half, handleSize, handleSize);
    ctx.fill();
    ctx.stroke();
  }
  // Draw edge handles at midpoints
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const mids: Point[] = [
    mid(bboxCorners[0], bboxCorners[1]),
    mid(bboxCorners[1], bboxCorners[2]),
    mid(bboxCorners[2], bboxCorners[3]),
    mid(bboxCorners[3], bboxCorners[0]),
  ];
  for (const m of mids) {
    ctx.beginPath();
    ctx.rect(m.x - half, m.y - half, handleSize, handleSize);
    ctx.fill();
    ctx.stroke();
  }
}
