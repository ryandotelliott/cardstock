import { transformPathGeometry, type PathGeometry } from '@/lib/geometry';
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

  // Transform the entire path to be in canvas space so bounds are axis-aligned in canvas space
  const canvasGeom = transformPathGeometry(geom, localToCanvas);
  const svgPathCanvas = pathGeometryToSvgPath(canvasGeom);

  const raw = boundsPath(svgPathCanvas);
  if (raw == undefined) return;
  const [bx0, by0, bx1, by1] = raw;
  if (!isFinite(bx0 + by0 + bx1 + by1)) return;

  const w = bx1 - bx0;
  const h = by1 - by0;
  if (!(w > 0 && h > 0) || !isFinite(w + h)) return;

  ctx.save();
  // Draw in canvas pixel space (identity transform)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = '#2D90F3';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx0, by0, w, h);
  ctx.setLineDash([]);
  ctx.restore();
}
