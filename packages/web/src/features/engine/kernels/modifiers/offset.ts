import type { Kernel } from '@/features/engine/kernels/types';
import { pathGeometryToSvgPath, svgPathToPathGeometry } from '@/lib/svg';
import { offsetPath } from 'geom-wasm';

export const OffsetKernel: Kernel<'Modifier.Offset'> = (inputs, params) => {
  const src = inputs.in;
  if (!src || !src.geom) {
    throw new Error('Modifier.Offset requires an input');
  }

  const { amount } = params;
  const svgPath = pathGeometryToSvgPath(src.geom);

  // Negate the amount, because Kurbo uses negative for outward offset
  const offsetSvgPath = offsetPath(svgPath, -amount);
  const offsetGeom = svgPathToPathGeometry(offsetSvgPath);
  return {
    geom: offsetGeom,
    localToWorld: src.localToWorld,
  };
};
