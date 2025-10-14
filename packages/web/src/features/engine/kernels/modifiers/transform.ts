import { Matrix } from '@/lib/matrix';
import type { Kernel } from '@/features/engine/kernels/types';
import type { NodeParamsByType } from '@/features/nodes/node-types';

export const TransformKernel: Kernel<'Modifier.Transform'> = (inputs, params) => {
  const src = inputs.in;
  if (!src || !src.geom) {
    throw new Error('Modifier.Transform requires an input');
  }

  const transform = matrixFromParams(params);
  return {
    geom: src.geom,
    transform: Matrix.multiply(src.transform, transform),
  };
};

function matrixFromParams(params: NodeParamsByType['Modifier.Transform']): Matrix {
  const sx = params.sx ?? 1,
    sy = params.sy ?? 1,
    r = ((params.r ?? 0) * Math.PI) / 180,
    tx = params.tx ?? 0,
    ty = params.ty ?? 0;
  return new Matrix().translate(tx, ty).rotate(r).scale(sx, sy);
}

