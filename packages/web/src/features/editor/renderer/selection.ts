import type { PathGeometry } from '@/lib/geometry';
import { pathGeometryToSvgPath } from '@/lib/svg';
import { boundsPath } from 'geom-wasm';
import type { Matrix } from '@/lib/matrix';
import { buildFullTransform } from '@/features/editor/renderer/transform';

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  geom: PathGeometry,
  dprTransform: Matrix,
  overlayTransform: Matrix | undefined,
  nodeTransform: Matrix | undefined,
) {
  if (!geom.contours.length) return;

  // Build the full transform local -> canvas
  const localToCanvas = buildFullTransform({
    dprTransform,
    overlayTransform,
    nodeTransform,
  });

  // Compute local-space bounds of the geometry
  const svgPathLocal = pathGeometryToSvgPath(geom);
  const raw = boundsPath(svgPathLocal);
  if (raw == undefined) return;
  const [bx0, by0, bx1, by1] = raw;
  if (!isFinite(bx0 + by0 + bx1 + by1)) return;

  // Create local-rect corners and transform them to canvas space to draw a rotated box
  const cornersLocal = [
    { x: bx0, y: by0 },
    { x: bx1, y: by0 },
    { x: bx1, y: by1 },
    { x: bx0, y: by1 },
  ];
  const dm = localToCanvas.toDOMMatrix();
  const cornersCanvas = cornersLocal.map((p) => {
    const x = dm.a * p.x + dm.c * p.y + dm.e;
    const y = dm.b * p.x + dm.d * p.y + dm.f;
    return { x, y };
  });

  ctx.save();
  // Draw in canvas pixel space (identity transform) so stroke is 1px regardless of scale
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = '#2D90F3';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cornersCanvas[0].x, cornersCanvas[0].y);
  for (let i = 1; i < cornersCanvas.length; i++) {
    ctx.lineTo(cornersCanvas[i].x, cornersCanvas[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
