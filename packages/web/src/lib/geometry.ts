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
