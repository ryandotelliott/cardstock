import type { Kernel } from '@/features/engine/kernels/types';

export const RectKernel: Kernel<'Shape.Rect'> = (_in, params) => {
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
};

