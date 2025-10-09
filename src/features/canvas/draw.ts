export function clear(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

type EllipseOptions = {
  x: number;
  y: number;
  radiusX?: number;
  radiusY?: number;

  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
};

type RectangleOptions = {
  x: number;
  y: number;
  width?: number;
  height?: number;

  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
};

const DEFAULT_DRAW_STYLE: Required<
  Pick<EllipseOptions, "fillColor" | "strokeColor" | "strokeWidth">
> = {
  fillColor: "rgba(0, 0, 0, 0)",
  strokeColor: "rgba(0, 0, 0, 0)",
  strokeWidth: 0,
};

const DEFAULT_ELLIPSE_OPTIONS: Required<
  Pick<EllipseOptions, "radiusX" | "radiusY">
> = {
  radiusX: 5,
  radiusY: 5,
};

const DEFAULT_RECTANGLE_OPTIONS: Required<
  Pick<RectangleOptions, "width" | "height">
> = {
  width: 10,
  height: 10,
};

export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    radiusX = DEFAULT_ELLIPSE_OPTIONS.radiusX,
    radiusY = DEFAULT_ELLIPSE_OPTIONS.radiusY,
    fillColor = DEFAULT_DRAW_STYLE.fillColor,
    strokeColor = DEFAULT_DRAW_STYLE.strokeColor,
    strokeWidth = DEFAULT_DRAW_STYLE.strokeWidth,
  }: EllipseOptions,
) {
  ctx.beginPath();
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  {
    fillColor = DEFAULT_DRAW_STYLE.fillColor,
    strokeColor = DEFAULT_DRAW_STYLE.strokeColor,
    strokeWidth = DEFAULT_DRAW_STYLE.strokeWidth,
    x,
    y,
    width = DEFAULT_RECTANGLE_OPTIONS.width,
    height = DEFAULT_RECTANGLE_OPTIONS.height,
  }: RectangleOptions,
) {
  ctx.beginPath();
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.rect(x, y, width, height);
  ctx.fill();
}
