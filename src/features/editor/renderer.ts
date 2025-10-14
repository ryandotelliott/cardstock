import type { Doc, EvalResult, NodeId } from '../engine/document';
import { Matrix } from '../../lib/matrix';
import { buildFullTransform, drawSelection, toPath2D } from './renderer-utils';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  draw(doc: Doc, results: Record<NodeId, EvalResult>, overlays?: Record<NodeId, Matrix>, selectedIds: NodeId[] = []) {
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
    const dprTransform = new Matrix().scale(dpr, dpr);

    this.ctx.save();
    for (const id of doc.getDrawOrder()) {
      const evalResult = results[id];
      if (!evalResult) continue;

      this.ctx.fillStyle = 'red'; // TODO: Use a style from the node
      this.ctx.strokeStyle = 'blue'; // TODO: Use a style from the node

      const overlayTransform = overlays?.[id];
      const localToCanvasTransform = buildFullTransform({
        dprTransform,
        overlayTransform,
        nodeTransform: evalResult.transform,
      });

      this.ctx.setTransform(localToCanvasTransform.toDOMMatrix());

      const path2d = toPath2D(evalResult.geom);
      this.ctx.fill(path2d);
      this.ctx.stroke(path2d);

      // Selection bounding box only (axis-aligned in screen space)
      if (selectedIds.includes(id)) {
        drawSelection(this.ctx, evalResult.geom, dprTransform, overlayTransform, evalResult.transform);
      }
    }
    this.ctx.restore();
  }

  // Hit-test in pixel space. Overlays are not used when hit-testing.
  hitTest(doc: Doc, results: Record<NodeId, EvalResult>, hitX: number, hitY: number): NodeId | null {
    const dpr = doc.getMeta()?.dpr || 1;
    const dprTransform = new Matrix().scale(dpr, dpr);

    // Scale hit-test coordinates from CSS pixels to DPR-scaled pixels (canvas space).
    const hx = hitX * dpr;
    const hy = hitY * dpr;

    const order = doc.getDrawOrder();
    this.ctx.save();
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      const out = results[id];
      if (!out) continue;

      const transform = buildFullTransform({
        dprTransform,
        nodeTransform: out.transform,
      });
      this.ctx.setTransform(transform.toDOMMatrix());

      const path2d = toPath2D(out.geom);
      if (this.ctx.isPointInPath(path2d, hx, hy) || this.ctx.isPointInStroke(path2d, hx, hy)) {
        this.ctx.restore();
        return id;
      }
    }
    this.ctx.restore();
    return null;
  }
}
