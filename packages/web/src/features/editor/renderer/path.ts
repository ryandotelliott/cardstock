import type { Knot, PathGeometry } from '@/lib/geometry';

export function toPath2D(geo: PathGeometry): Path2D {
  const path = new Path2D();
  for (const contour of geo.contours) {
    if (!contour.knots.length) continue;
    const k0 = contour.knots[0];
    path.moveTo(k0.pos.x, k0.pos.y);
    for (let i = 1; i < contour.knots.length; i++) {
      addSegmentToPath(path, contour.knots[i - 1], contour.knots[i]);
    }

    if (contour.closed) {
      const last = contour.knots[contour.knots.length - 1];
      addSegmentToPath(path, last, k0);
      path.closePath();
    }
  }
  return path;
}

function addSegmentToPath(path: Path2D, a: Knot, b: Knot) {
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
