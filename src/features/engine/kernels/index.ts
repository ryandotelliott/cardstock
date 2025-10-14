import type { NodeType } from '@/features/nodes/node-types';
import type { Kernel } from '@/features/engine/kernels/types';

import { RectKernel } from './shapes/rect';
import { EllipseKernel } from './shapes/ellipse';
import { TransformKernel } from './modifiers/transform';
import { OffsetKernel } from './modifiers/offset';

export const Kernels: { [T in NodeType]: Kernel<T> } = {
  'Shape.Rect': RectKernel,
  'Shape.Ellipse': EllipseKernel,
  'Modifier.Transform': TransformKernel,
  'Modifier.Offset': OffsetKernel,
};

export type { Kernel } from './types';

