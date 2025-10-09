export type Point = { x: number; y: number };

export type Rect = { x: number; y: number; width: number; height: number };

export type ShapeType = "rect" | "ellipse";

export type BaseShape = {
  id: string;
  type: ShapeType;
  x: number; // center for ellipse, top-left for rect
  y: number;
};

export type RectShape = BaseShape & {
  type: "rect";
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type EllipseShape = BaseShape & {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type Shape = RectShape | EllipseShape;

