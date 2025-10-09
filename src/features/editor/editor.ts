import { Canvas2D } from "@/features/canvas/canvas2d";
import type { Point, Rect, Shape } from "@/features/canvas/types";

const HANDLE_SIZE = 8; // CSS px (DPR aware via Canvas2D)

export class Editor {
  readonly layer: Canvas2D;
  shapes: Shape[] = [];
  selectedId: string | null = null;

  private dragging: { id: string; start: Point; orig: Point } | null = null;

  constructor(el: HTMLCanvasElement) {
    this.layer = new Canvas2D(el);
    // Pointer events
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointerleave", this.onPointerUp);
    // Initial paint
    this.render();
  }

  destroy() {
    const el = this.layer.el;
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointerleave", this.onPointerUp);
  }

  add(shape: Shape) {
    this.shapes.push(shape);
    this.render();
  }

  private getPointerPos(evt: PointerEvent): Point {
    const rect = this.layer.el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  private hitTest(pos: Point): Shape | null {
    // topmost first
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      if (shape.type === "rect") {
        if (
          pos.x >= shape.x &&
          pos.x <= shape.x + shape.width &&
          pos.y >= shape.y &&
          pos.y <= shape.y + shape.height
        ) {
          return shape;
        }
      } else if (shape.type === "ellipse") {
        const dx = (pos.x - shape.x) / shape.radiusX;
        const dy = (pos.y - shape.y) / shape.radiusY;
        if (dx * dx + dy * dy <= 1) return shape;
      }
    }
    return null;
  }

  private boundsOf(shape: Shape): Rect {
    if (shape.type === "rect") {
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    }

    return {
      x: shape.x - shape.radiusX,
      y: shape.y - shape.radiusY,
      width: shape.radiusX * 2,
      height: shape.radiusY * 2,
    };
  }

  private drawShape(shape: Shape) {
    const { ctx } = this.layer;
    ctx.save();

    if (shape.type === "rect") {
      if (shape.fill) {
        ctx.fillStyle = shape.fill;
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      }
      if (shape.stroke && (shape.strokeWidth ?? 0) > 0) {
        ctx.lineWidth = shape.strokeWidth ?? 1;
        ctx.strokeStyle = shape.stroke;
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(
        shape.x,
        shape.y,
        shape.radiusX,
        shape.radiusY,
        0,
        0,
        Math.PI * 2,
      );
      if (shape.fill) {
        ctx.fillStyle = shape.fill;
        ctx.fill();
      }
      if (shape.stroke && (shape.strokeWidth ?? 0) > 0) {
        ctx.lineWidth = shape.strokeWidth ?? 1;
        ctx.strokeStyle = shape.stroke;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawSelectionBounds(rect: Rect) {
    const { ctx } = this.layer;
    ctx.save();
    ctx.strokeStyle = "#0062ff";
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.setLineDash([]);
    // handles (corners)
    const hs = HANDLE_SIZE;
    const corners: Point[] = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ];
    ctx.fillStyle = "#0062ff";
    ctx.strokeStyle = "#ffffff";
    for (const c of corners) {
      ctx.beginPath();
      ctx.rect(c.x - hs / 2, c.y - hs / 2, hs, hs);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  render = () => {
    this.layer.resizeToDisplaySize();
    this.layer.clear();
    // scene
    for (const s of this.shapes) this.drawShape(s);
    // selection UI
    if (this.selectedId) {
      const s = this.shapes.find((x) => x.id === this.selectedId);
      if (s) this.drawSelectionBounds(this.boundsOf(s));
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    const pos = this.getPointerPos(e);
    const hit = this.hitTest(pos);

    if (hit) {
      this.selectedId = hit.id;
      this.dragging = { id: hit.id, start: pos, orig: { x: hit.x, y: hit.y } };
      if (e.target instanceof HTMLElement) {
        e.target.setPointerCapture(e.pointerId);
      }
    } else {
      this.selectedId = null;
      this.dragging = null;
    }
    this.render();
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;

    const p = this.getPointerPos(e);
    const d = {
      x: p.x - this.dragging.start.x,
      y: p.y - this.dragging.start.y,
    };
    const s = this.shapes.find((x) => x.id === this.dragging!.id);
    if (!s) return;
    s.x = this.dragging.orig.x + d.x;
    s.y = this.dragging.orig.y + d.y;

    this.render();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.dragging && e.target instanceof HTMLElement) {
      e.target.releasePointerCapture(e.pointerId);
    }
    this.dragging = null;
  };
}
