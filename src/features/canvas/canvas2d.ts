// Canvas utilities: DPR sizing, clear, basic draw helpers

export class Canvas2D {
  readonly el: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(el: HTMLCanvasElement) {
    const ctx = el.getContext("2d");
    if (!ctx) throw new Error("2D context not available");
    this.el = el;
    this.ctx = ctx;
    this.resizeToDisplaySize();
  }

  get dpr() {
    return window.devicePixelRatio || 1;
  }

  // Ensure canvas' internal buffer matches CSS size * DPR
  resizeToDisplaySize() {
    const { el, dpr } = this;
    const cssWidth = el.clientWidth | 0;
    const cssHeight = el.clientHeight | 0;
    const width = Math.max(1, Math.floor(cssWidth * dpr));
    const height = Math.max(1, Math.floor(cssHeight * dpr));
    if (el.width !== width || el.height !== height) {
      el.width = width;
      el.height = height;
    }
    // Reset transform then scale for DPR-aware drawing in CSS pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  clear() {
    const { ctx } = this;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

