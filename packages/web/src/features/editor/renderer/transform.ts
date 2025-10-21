import type { Matrix } from '@/lib/matrix';

export function buildFullTransform({
  dprTransform,
  overlayTransform,
  nodeTransform,
}: {
  dprTransform: Matrix;
  overlayTransform?: Matrix;
  nodeTransform?: Matrix;
}) {
  let transform = dprTransform;
  if (overlayTransform) {
    transform = transform.multiply(overlayTransform);
  }
  if (nodeTransform) {
    transform = transform.multiply(nodeTransform);
  }
  return transform;
}
