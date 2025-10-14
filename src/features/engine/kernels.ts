import type { NodeInputsByType, NodeParamsByType, NodeType } from '@/features/nodes/node-types';
import type { EvalResult } from '@/features/engine/document';
import { Matrix } from '@/lib/matrix';

type KernelInputsByType = {
  [T in NodeType]: { [K in keyof NodeInputsByType[T]]: EvalResult | undefined };
};

type Kernel<T extends NodeType> = (inputs: KernelInputsByType[T], params: NodeParamsByType[T]) => EvalResult;

export const Kernels: { [T in NodeType]: Kernel<T> } = {
  'Shape.Rect': (_in, params) => {
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
  'Shape.Ellipse': (_in, params) => {
    const { cx = 0, cy = 0, rx = 50, ry = rx } = params;
    // v0: 4-cubic approximation of ellipse (keep simple)
    const k = 0.5522847498; // circle handle factor
    const knots = [
      {
        pos: { x: cx + rx, y: cy },
        hIn: { dx: 0, dy: -k * ry },
        hOut: { dx: 0, dy: k * ry },
      },
      {
        pos: { x: cx, y: cy + ry },
        hIn: { dx: k * rx, dy: 0 },
        hOut: { dx: -k * rx, dy: 0 },
      },
      {
        pos: { x: cx - rx, y: cy },
        hIn: { dx: 0, dy: k * ry },
        hOut: { dx: 0, dy: -k * ry },
      },
      {
        pos: { x: cx, y: cy - ry },
        hIn: { dx: -k * rx, dy: 0 },
        hOut: { dx: k * rx, dy: 0 },
      },
    ];
    return { geom: { contours: [{ closed: true, knots }] } };
  },
  'Modifier.Transform': (inputs, params) => {
    const src = inputs.in;
    if (!src || !src.geom) {
      throw new Error('Modifier.Transform requires an input');
    }

    const transform = matrixFromParams(params);
    return {
      geom: src.geom,
      transform: Matrix.multiply(src.transform, transform),
    };
  },
};

// helpers
function matrixFromParams(params: NodeParamsByType['Modifier.Transform']): Matrix {
  const sx = params.sx ?? 1,
    sy = params.sy ?? 1,
    r = ((params.r ?? 0) * Math.PI) / 180,
    tx = params.tx ?? 0,
    ty = params.ty ?? 0;
  return new Matrix().translate(tx, ty).rotate(r).scale(sx, sy);
}
