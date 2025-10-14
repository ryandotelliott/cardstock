import type { Kernel } from '@/features/engine/kernels/types';

export const EllipseKernel: Kernel<'Shape.Ellipse'> = (_in, params) => {
  const { cx = 0, cy = 0, rx = 50, ry = rx } = params;
  // 4-cubic approximation of ellipse
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
};

