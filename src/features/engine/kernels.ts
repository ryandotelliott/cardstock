import type { EvalResult, NodeSpec, PathGeometry } from "./document";

type Kernel = (
  inputs: Record<string, EvalResult | undefined>,
  params: Record<string, any>,
) => EvalResult;

export const Kernels: Record<NodeSpec["type"], Kernel> = {
  "Shape.Rect": (_in, params) => {
    const { x = 0, y = 0, w = 100, h = 100, rx = 0, ry = rx } = params;

    return {
      geom: {
        contours: [
          {
            closed: true,
            knots: [
              {
                pos: { x, y },
                hIn: { dx: -rx, dy: 0 },
                hOut: { dx: rx, dy: 0 },
              },
              {
                pos: { x: x + w, y },
                hIn: { dx: 0, dy: -ry },
                hOut: { dx: 0, dy: ry },
              },
              {
                pos: { x: x + w, y: y + h },
                hIn: { dx: rx, dy: 0 },
                hOut: { dx: -rx, dy: 0 },
              },
              {
                pos: { x, y: y + h },
                hIn: { dx: 0, dy: ry },
                hOut: { dx: 0, dy: -ry },
              },
            ],
          },
        ],
      },
    };
  },
  "Shape.Ellipse": (_in, params) => {
    const { cx = 0, cy = 0, rx = 50, ry = rx } = params;
    // v0: 4-cubic approximation of ellipse (keep simple)
    const k = 0.5522847498; // circle handle factor
    const knots = [
      {
        pos: { x: cx + rx, y: cy },
        hIn: { dx: 0, dy: k * ry },
        hOut: { dx: 0, dy: -k * ry },
      },
      {
        pos: { x: cx, y: cy + ry },
        hIn: { dx: k * rx, dy: 0 },
        hOut: { dx: -k * rx, dy: 0 },
      },
      {
        pos: { x: cx - rx, y: cy },
        hIn: { dx: 0, dy: -k * ry },
        hOut: { dx: 0, dy: k * ry },
      },
      {
        pos: { x: cx, y: cy - ry },
        hIn: { dx: -k * rx, dy: 0 },
        hOut: { dx: k * rx, dy: 0 },
      },
    ];
    return { geom: { contours: [{ closed: true, knots }] } };
  },
  "Modifier.Transform": (inputs, params) => {
    const src = inputs.in;
    if (!src || !src.geom) {
      throw new Error("Modifier.Transform requires an input");
    }

    const transform = matrixFromParams(params);
    return {
      geom: transformGeometry(src.geom, transform),
      transform: multiplyTransforms(src.transform, transform),
    };
  },
};

// helpers
function matrixFromParams(pos: Record<string, any>): DOMMatrix {
  const matrix = new DOMMatrix();
  const sx = pos.sx ?? 1,
    sy = pos.sy ?? 1,
    r = ((pos.r ?? 0) * Math.PI) / 180,
    tx = pos.tx ?? 0,
    ty = pos.ty ?? 0;
  return matrix
    .translateSelf(tx, ty)
    .rotateSelf((r * 180) / Math.PI)
    .scaleSelf(sx, sy);
}

function transformGeometry(
  geo: PathGeometry,
  transformationMatrix: DOMMatrix,
): PathGeometry {
  const point = (x: number, y: number) => {
    const p = new DOMPoint(x, y).matrixTransform(transformationMatrix);
    return { x: p.x, y: p.y };
  };

  const delta = (dx: number, dy: number) => {
    // approximate handle transform as linear (ignores rotation from anchor) — fine for v0
    const p = new DOMPoint(dx, dy).matrixTransform(transformationMatrix);
    return { dx: p.x, dy: p.y };
  };

  return {
    contours: geo.contours.map((c) => ({
      closed: c.closed,
      knots: c.knots.map((k) => ({
        pos: point(k.pos.x, k.pos.y),
        handleIn: k.hIn ? delta(k.hIn.dx, k.hIn.dy) : undefined,
        handleOut: k.hOut ? delta(k.hOut.dx, k.hOut.dy) : undefined,
      })),
    })),
  };
}

function multiplyTransforms(a?: DOMMatrix, b?: DOMMatrix) {
  if (!a && !b) return undefined;
  if (!a) return b!;
  if (!b) return a!;
  return a.multiply(b);
}
