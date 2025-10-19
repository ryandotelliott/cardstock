import { transformPathGeometry, type Knot, type PathGeometry } from '@/lib/geometry';
import { pathGeometryToSvgPath } from '@/lib/svg';
import { boundsPath } from 'geom-wasm';
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
  if (!geom.contours.length) return;

  // Build the full transform local -> canvas
  const localToCanvas = buildFullTransform({
    dprTransform,
    overlayTransform,
    nodeTransform,
  });

  // Transform the entire path to be in canvas space so bounds are axis-aligned in canvas space
  const canvasGeom = transformPathGeometry(geom, localToCanvas);
  const svgPathCanvas = pathGeometryToSvgPath(canvasGeom);

  const raw = boundsPath(svgPathCanvas);
  if (raw == undefined) return;
  const [bx0, by0, bx1, by1] = raw;
  if (!isFinite(bx0 + by0 + bx1 + by1)) return;

  const w = bx1 - bx0;
  const h = by1 - by0;
  if (!(w > 0 && h > 0) || !isFinite(w + h)) return;

  ctx.save();
  // Draw in canvas pixel space (identity transform)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = '#0362fc';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.strokeRect(bx0, by0, w, h);
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
