import type { Kernel } from '@/features/engine/kernels/types';
import type { PathContour, PathGeometry, Knot } from '@/lib/geometry';

export const OffsetKernel: Kernel<'Modifier.Offset'> = (inputs, params) => {
  const src = inputs.in;
  if (!src || !src.geom) {
    throw new Error('Modifier.Offset requires an input');
  }

  const { amount } = params;
  const offsetGeom = offsetPath(src.geom, amount);

  return {
    geom: offsetGeom,
    transform: src.transform,
  };
};

function offsetPath(geom: PathGeometry, amount: number): PathGeometry {
  const offsetContours: PathContour[] = [];

  for (const contour of geom.contours) {
    if (contour.knots.length === 0) continue;

    const offsetKnots: Knot[] = [];
    const n = contour.knots.length;

    for (let i = 0; i < n; i++) {
      const knot = contour.knots[i];
      const prevKnot = contour.knots[(i - 1 + n) % n];
      const nextKnot = contour.knots[(i + 1) % n];

      const normal = calculateNormal(prevKnot, knot, nextKnot, contour.closed, i === 0, i === n - 1);

      const offsetPos = {
        x: knot.pos.x + normal.x * amount,
        y: knot.pos.y + normal.y * amount,
      };

      const offsetKnot: Knot = {
        pos: offsetPos,
        hIn: knot.hIn ? { dx: knot.hIn.dx, dy: knot.hIn.dy } : undefined,
        hOut: knot.hOut ? { dx: knot.hOut.dx, dy: knot.hOut.dy } : undefined,
      };

      offsetKnots.push(offsetKnot);
    }

    offsetContours.push({
      closed: contour.closed,
      knots: offsetKnots,
    });
  }

  return { contours: offsetContours };
}

function calculateNormal(
  prevKnot: Knot,
  knot: Knot,
  nextKnot: Knot,
  closed: boolean,
  isFirst: boolean,
  isLast: boolean,
): { x: number; y: number } {
  let normalX = 0;
  let normalY = 0;
  let count = 0;

  if (closed || !isFirst) {
    const dx = knot.pos.x - prevKnot.pos.x;
    const dy = knot.pos.y - prevKnot.pos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0.0001) {
      normalX += dy / len;
      normalY += -dx / len;
      count++;
    }
  }

  if (closed || !isLast) {
    const dx = nextKnot.pos.x - knot.pos.x;
    const dy = nextKnot.pos.y - knot.pos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0.0001) {
      normalX += dy / len;
      normalY += -dx / len;
      count++;
    }
  }

  if (count > 0) {
    normalX /= count;
    normalY /= count;
  }

  const len = Math.sqrt(normalX * normalX + normalY * normalY);
  if (len > 0.0001) {
    normalX /= len;
    normalY /= len;
  } else {
    normalX = 0;
    normalY = 1;
  }

  return { x: normalX, y: normalY };
}

