import { Matrix } from './matrix';

export type Handle = {
  dx: number;
  dy: number;
};

export type Knot = {
  pos: { x: number; y: number };
  hIn?: Handle;
  hOut?: Handle;
};

export type PathContour = {
  closed: boolean;
  knots: Knot[];
};

export type PathGeometry = {
  contours: PathContour[];
};

export function getPathBounds(geo: PathGeometry): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;
  for (const contour of geo.contours) {
    for (const k of contour.knots) {
      const { x, y } = k.pos;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      found = true;
    }
  }
  return found ? { minX, minY, maxX, maxY } : null;
}

/**
 * Transform all knots in a path geometry by a matrix
 */
export function transformPathGeometry(geom: PathGeometry, m: Matrix): PathGeometry {
  return {
    contours: geom.contours.map((contour) => ({
      closed: contour.closed,
      knots: contour.knots.map((knot) => ({
        pos: m.transformPoint(knot.pos),
        hIn: knot.hIn ? m.transformVec(knot.hIn) : undefined,
        hOut: knot.hOut ? m.transformVec(knot.hOut) : undefined,
      })),
    })),
  };
}
