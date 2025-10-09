import type { Doc, EvalResult, NodeId, PathGeometry } from "./document";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  draw(doc: Doc, results: Record<NodeId, EvalResult>) {
    const dpr = Number(doc.meta?.dpr) || 1;
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

    // Base transform that applies DPR scaling; compose per-node on top
    const base = new DOMMatrix().scaleSelf(dpr, dpr);

    this.ctx.save();
    for (const id of doc.drawOrder) {
      const out = results[id];
      if (!out) continue;

      this.ctx.save();
      this.ctx.fillStyle = "red"; // TODO: Use a style from the node
      this.ctx.strokeStyle = "blue"; // TODO: Use a style from the node

      // Compose node transform with DPR base
      if (out.transform) {
        const combined = base.multiply(out.transform);
        this.ctx.setTransform(
          combined.a,
          combined.b,
          combined.c,
          combined.d,
          combined.e,
          combined.f,
        );
      } else {
        this.ctx.setTransform(base.a, base.b, base.c, base.d, base.e, base.f);
      }
      const path2d = toPath2D(out.geom);
      this.ctx.fill(path2d);
      this.ctx.stroke(path2d);
      this.ctx.restore();
    }
    this.ctx.restore();
  }
}

function toPath2D(geo: PathGeometry): Path2D {
  const p = new Path2D();
  for (const contour of geo.contours) {
    if (!contour.knots.length) continue;
    const k0 = contour.knots[0];
    p.moveTo(k0.pos.x, k0.pos.y);
    for (let i = 1; i < contour.knots.length; i++) {
      const a = contour.knots[i - 1],
        b = contour.knots[i];

      // Cubic if handles present, else line
      if (a.hOut || b.hIn) {
        const c1x = a.hOut ? a.pos.x + a.hOut.dx : a.pos.x;
        const c1y = a.hOut ? a.pos.y + a.hOut.dy : a.pos.y;
        const c2x = b.hIn ? b.pos.x + b.hIn.dx : b.pos.x;
        const c2y = b.hIn ? b.pos.y + b.hIn.dy : b.pos.y;
        p.bezierCurveTo(c1x, c1y, c2x, c2y, b.pos.x, b.pos.y);
      } else {
        p.lineTo(b.pos.x, b.pos.y);
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
        p.bezierCurveTo(c1x, c1y, c2x, c2y, k0.pos.x, k0.pos.y);
      } else {
        p.closePath();
      }
    }
  }
  return p;
}
