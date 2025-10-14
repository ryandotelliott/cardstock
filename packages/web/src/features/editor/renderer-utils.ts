import type { Knot, PathGeometry } from '@/lib/geometry';
import { getPathBounds } from '@/lib/geometry';
import type { Matrix } from '@/lib/matrix';

export function buildFullTransform({
  dprTransform,
  overlayTransform,
  nodeTransform,
}: {
  dprTransform: Matrix;
  overlayTransform?: Matrix;
  nodeTransform?: Matrix;
}) {
  let transform = dprTransform;
  if (overlayTransform) {
    transform = transform.multiply(overlayTransform);
  }
  if (nodeTransform) {
    transform = transform.multiply(nodeTransform);
  }
  return transform;
}

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  geom: PathGeometry,
  dprTransform: Matrix,
  overlayTransform: Matrix | undefined,
  nodeTransform: Matrix | undefined,
) {
  const localBounds = getPathBounds(geom);
  if (!localBounds) return;

  // Build the full transform used for drawing to convert local bbox -> canvas space
  const localToCanvasTransform = buildFullTransform({
    dprTransform,
    overlayTransform,
    nodeTransform,
  });

  const corners = [
    { x: localBounds.minX, y: localBounds.minY },
    { x: localBounds.maxX, y: localBounds.minY },
    { x: localBounds.maxX, y: localBounds.maxY },
    { x: localBounds.minX, y: localBounds.maxY },
  ].map((p) => localToCanvasTransform.transformPoint(p));

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of corners) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  ctx.save();
  // Draw in canvas coordinates (no transform)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = '#0362fc';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  ctx.setLineDash([]);
  ctx.restore();
}

export function toPath2D(geo: PathGeometry): Path2D {
  const path = new Path2D();
  for (const contour of geo.contours) {
    if (!contour.knots.length) continue;
    const k0 = contour.knots[0];
    path.moveTo(k0.pos.x, k0.pos.y);
    for (let i = 1; i < contour.knots.length; i++) {
      drawKnotSegment(path, contour.knots[i - 1], contour.knots[i]);
    }

    if (contour.closed) {
      // connect last to first
      const last = contour.knots[contour.knots.length - 1];
      drawKnotSegment(path, last, k0);
      path.closePath();
    }
  }
  return path;
}

function drawKnotSegment(path: Path2D, a: Knot, b: Knot) {
  // Cubic if handles present, else line
  if (a.hOut || b.hIn) {
    const c1x = a.hOut ? a.pos.x + a.hOut.dx : a.pos.x;
    const c1y = a.hOut ? a.pos.y + a.hOut.dy : a.pos.y;
    const c2x = b.hIn ? b.pos.x + b.hIn.dx : b.pos.x;
    const c2y = b.hIn ? b.pos.y + b.hIn.dy : b.pos.y;
    path.bezierCurveTo(c1x, c1y, c2x, c2y, b.pos.x, b.pos.y);
  } else {
    path.lineTo(b.pos.x, b.pos.y);
  }
}
