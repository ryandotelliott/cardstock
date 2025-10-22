import type { Doc, EvalResult } from '@/features/engine/document';
import type { NodeId } from '@/features/nodes/node-types';
import { Matrix } from '@/lib/matrix';
import { buildFullTransform } from '@/features/editor/renderer/transform';
import {
  drawSelection,
  computeSelectionCornersCanvas,
  getCornerHandleRects,
  getEdgeHandleRects,
  HANDLE_SIZE,
  HANDLE_HIT_SLOP,
  type HandleId,
} from '@/features/editor/renderer/selection';
import { toPath2D } from '@/features/editor/renderer/path';

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

      this.ctx.fillStyle = '#D9D9D9'; // TODO: Use a style from the node

      const overlayTransform = overlays?.[id];
      const localToCanvasTransform = buildFullTransform({
        dprTransform,
        overlayTransform,
        nodeTransform: evalResult.transform,
      });

      const dom = localToCanvasTransform.toDOMMatrix();
      const localPath = toPath2D(evalResult.geom);

      // Fill using the node transform (normal scaling/rotation applies to fill geometry)
      this.ctx.setTransform(dom);
      this.ctx.fill(localPath);

      // Stroke in canvas space so line width does not scale with non-uniform transforms
      const canvasPath = new Path2D();
      canvasPath.addPath(localPath, dom);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.stroke(canvasPath);

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

      const transform = buildFullTransform({ dprTransform, nodeTransform: out.transform });
      const dom = transform.toDOMMatrix();
      const localPath = toPath2D(out.geom);

      // Build canvas-space path for hit testing to match non-scaling stroke behavior
      const canvasPath = new Path2D();
      canvasPath.addPath(localPath, dom);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (this.ctx.isPointInPath(canvasPath, hx, hy) || this.ctx.isPointInStroke(canvasPath, hx, hy)) {
        this.ctx.restore();
        return id;
      }
    }
    this.ctx.restore();
    return null;
  }

  // Hit-test selection handles for the given selected ids. Returns topmost hit.
  hitTestHandles(
    doc: Doc,
    results: Record<NodeId, EvalResult>,
    overlays: Record<NodeId, Matrix> | undefined,
    selectedIds: NodeId[],
    hitX: number,
    hitY: number,
  ): { nodeId: NodeId; handleId: HandleId } | null {
    const dpr = doc.getMeta()?.dpr || 1;
    const dprTransform = new Matrix().scale(dpr, dpr);

    // Scale hit-test coordinates from CSS pixels to DPR-scaled pixels (canvas space).
    const hx = hitX * dpr;
    const hy = hitY * dpr;

    if (!selectedIds.length) return null;

    const selectedSet = new Set(selectedIds);
    const order = doc.getDrawOrder();
    // Check from topmost to bottom among selected nodes only.
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      if (!selectedSet.has(id)) continue;
      const out = results[id];
      if (!out) continue;

      const overlayTransform = overlays?.[id];
      const corners = computeSelectionCornersCanvas(out.geom, dprTransform, overlayTransform, out.transform);
      if (!corners) continue;

      // Inflate rects by hit slop for easier targeting.
      const inflated = HANDLE_SIZE + 2 * HANDLE_HIT_SLOP;
      const rects = [...getCornerHandleRects(corners, inflated), ...getEdgeHandleRects(corners, inflated)];
      for (const r of rects) {
        if (hx >= r.x && hx <= r.x + r.w && hy >= r.y && hy <= r.y + r.h) {
          return { nodeId: id, handleId: r.id };
        }
      }
    }
    return null;
  }
}
