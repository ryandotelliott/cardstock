export type Point = { x: number; y: number };
export type Vec = { dx: number; dy: number };

// Row-major 2D affine matrix
// [a, c, e]
// [b, d, f]
// [0, 0, 1]
export class Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  static from(m: DOMMatrix): Matrix {
    return new Matrix(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  static multiply(a?: Matrix, b?: Matrix): Matrix | undefined {
    if (!a && !b) return undefined;
    if (!a) return b!;
    if (!b) return a!;
    return a.multiply(b);
  }

  toDOMMatrix(): DOMMatrix {
    return new DOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]);
  }

  multiply(m: Matrix): Matrix {
    const a = this.a * m.a + this.c * m.b;
    const b = this.b * m.a + this.d * m.b;
    const c = this.a * m.c + this.c * m.d;
    const d = this.b * m.c + this.d * m.d;
    const e = this.a * m.e + this.c * m.f + this.e;
    const f = this.b * m.e + this.d * m.f + this.f;
    return new Matrix(a, b, c, d, e, f);
  }

  translate(tx: number, ty: number): Matrix {
    return this.multiply(new Matrix(1, 0, 0, 1, tx, ty));
  }

  scale(sx: number, sy: number): Matrix {
    return this.multiply(new Matrix(sx, 0, 0, sy, 0, 0));
  }

  rotate(radians: number): Matrix {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return this.multiply(new Matrix(cos, sin, -sin, cos, 0, 0));
  }

  transformPoint({ x, y }: Point): Point {
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f,
    };
  }

  transformVec({ dx, dy }: Vec): Vec {
    return {
      dx: this.a * dx + this.c * dy,
      dy: this.b * dx + this.d * dy,
    };
  }
}
