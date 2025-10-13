import type { Doc, EvalResult, PathGeometry } from '../engine/document';
import type { NodeId } from '../nodes/node-types';
import { Matrix } from '../../lib/matrix';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  draw(doc: Doc, results: Record<NodeId, EvalResult>, overlays?: Record<NodeId, Matrix>) {
    const dpr = doc.getMeta()?.dpr || 1;
    const canvas = this.ctx.canvas;

    // Ensure the canvas backing store matches CSS size * DPR
    const cssWidth = canvas.clientWidth || canvas.width;
    const cssHeight = canvas.clientHeight || canvas.height;
    const targetWidth = Math.max(1, Math.round(cssWidth * dpr));
    const targetHeight = Math.max(1, Math.round(cssHeight * dpr));
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Base transform that applies DPR scaling only.
    const base = new Matrix().scale(dpr, dpr);

    this.ctx.save();
    for (const id of doc.getDrawOrder()) {
      const out = results[id];
      if (!out) continue;

      this.ctx.fillStyle = 'red'; // TODO: Use a style from the node
      this.ctx.strokeStyle = 'blue'; // TODO: Use a style from the node

      let transform = base;

      // Apply overlay in world (pixel) space so drags are screen-aligned.
      const overlay = overlays?.[id];
      if (overlay) {
        transform = transform.multiply(overlay);
      }

      // Then apply the node's own transform
      if (out.transform) {
        transform = transform.multiply(out.transform);
      }

      this.ctx.setTransform(transform.toDOMMatrix());

      const path2d = toPath2D(out.geom);
      this.ctx.fill(path2d);
      this.ctx.stroke(path2d);
    }
    this.ctx.restore();
  }

  // Hit-test in CSS pixel space. Mirrors draw() DPR + transform logic.
  // Overlays are intentionally ignored for hit-testing for now.
  hitTest(doc: Doc, results: Record<NodeId, EvalResult>, hitX: number, hitY: number): NodeId | null {
    const dpr = doc.getMeta()?.dpr || 1;
    const base = new Matrix().scale(dpr, dpr);

    // Scale hit-test coordinates from CSS pixels to DPR-scaled pixels (canvas space).
    const hx = hitX * dpr;
    const hy = hitY * dpr;

    const order = doc.getDrawOrder();
    this.ctx.save();
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      const out = results[id];
      if (!out) continue;

      let transform = base;
      if (out.transform) {
        transform = transform.multiply(out.transform);
      }

      this.ctx.setTransform(transform.toDOMMatrix());
      const path = toPath2D(out.geom);
      if (this.ctx.isPointInPath(path, hx, hy) || this.ctx.isPointInStroke(path, hx, hy)) {
        this.ctx.restore();
        return id;
      }
    }
    this.ctx.restore();
    return null;
  }
}

function toPath2D(geo: PathGeometry): Path2D {
  const path = new Path2D();
  for (const contour of geo.contours) {
    if (!contour.knots.length) continue;
    const k0 = contour.knots[0];
    path.moveTo(k0.pos.x, k0.pos.y);
    for (let i = 1; i < contour.knots.length; i++) {
      const a = contour.knots[i - 1];
      const b = contour.knots[i];

      // Cubic if handles present, else line
      if (a.hOut || b.hIn) {
        const c1x = a.hOut ? a.pos.x + a.hOut.dx : a.pos.x;
        const c1y = a.hOut ? a.pos.y + a.hOut.dy : a.pos.y;
        const c2x = b.hIn ? b.pos.x + b.hIn.dx : b.pos.x;
        const c2y = b.hIn ? b.pos.y + b.hIn.dy : b.pos.y;
        path.bezierCurveTo(c1x, c1y, c2x, c2y, b.pos.x, b.pos.y);
      } else {
        path.lineTo(b.pos.x, b.pos.y);
      }
    }

    if (contour.closed) {
      // connect last to first
      const last = contour.knots[contour.knots.length - 1];
      if (last.hOut || k0.hIn) {
        const c1x = last.hOut ? last.pos.x + last.hOut.dx : last.pos.x;
        const c1y = last.hOut ? last.pos.y + last.hOut.dy : last.pos.y;
        const c2x = k0.hIn ? k0.pos.x + k0.hIn.dx : k0.pos.x;
        const c2y = k0.hIn ? k0.pos.y + k0.hIn.dy : k0.pos.y;
        path.bezierCurveTo(c1x, c1y, c2x, c2y, k0.pos.x, k0.pos.y);
      }
      path.closePath();
    }
  }
  return path;
}
