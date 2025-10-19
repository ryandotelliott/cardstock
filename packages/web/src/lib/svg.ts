import type { Handle, Knot, PathContour, PathGeometry } from '@/lib/geometry';

// Convert PathGeometry -> SVG path data string using absolute commands (M, L, C, Z)
export function pathGeometryToSvgPath(geom: PathGeometry): string {
  const parts: string[] = [];

  for (const contour of geom.contours) {
    if (contour.knots.length === 0) continue;

    const first = contour.knots[0];
    parts.push(`M ${num(first.pos.x)} ${num(first.pos.y)}`);

    for (let i = 1; i < contour.knots.length; i++) {
      appendSegment(parts, contour.knots[i - 1], contour.knots[i]);
    }

    if (contour.closed) {
      // Connect last to first
      const last = contour.knots[contour.knots.length - 1];
      appendSegment(parts, last, first);
      parts.push('Z');
    }
  }

  return parts.join(' ');
}

// Parse a subset of SVG path data (absolute M, L, C, Z) -> PathGeometry
export function svgPathToPathGeometry(d: string): PathGeometry {
  const tokens = tokenizePathData(d);
  const contours: PathContour[] = [];

  let i = 0;
  let cmd: string | null = null;
  let startPoint: { x: number; y: number } | null = null;
  let currentPoint: { x: number; y: number } | null = null;

  const startNewContour = (start: { x: number; y: number }) => {
    const contour: PathContour = { closed: false, knots: [{ pos: { x: start.x, y: start.y } }] };
    contours.push(contour);
  };

  const lastContour = (): PathContour | null => {
    if (contours.length === 0) return null;
    return contours[contours.length - 1];
  };

  while (i < tokens.length) {
    const t = tokens[i];
    if (isCommand(t)) {
      cmd = t;
      i++;
    }

    if (cmd === 'M') {
      const x = readNumber(tokens, i++);
      const y = readNumber(tokens, i++);
      startPoint = { x, y };
      currentPoint = { x, y };
      startNewContour(currentPoint);

      // Subsequent coordinate pairs without a new command are treated as implicit L
      while (i + 1 < tokens.length && isNumber(tokens[i]) && isNumber(tokens[i + 1])) {
        const lx = readNumber(tokens, i++);
        const ly = readNumber(tokens, i++);
        appendLineToCurrent(lastContour()!, { x: lx, y: ly });
        currentPoint = { x: lx, y: ly };
      }
      continue;
    }

    if (cmd === 'L') {
      const x = readNumber(tokens, i++);
      const y = readNumber(tokens, i++);
      appendLineToCurrent(lastContour()!, { x, y });
      currentPoint = { x, y };
      continue;
    }

    if (cmd === 'C') {
      const x1 = readNumber(tokens, i++);
      const y1 = readNumber(tokens, i++);
      const x2 = readNumber(tokens, i++);
      const y2 = readNumber(tokens, i++);
      const x = readNumber(tokens, i++);
      const y = readNumber(tokens, i++);
      appendCubicToCurrent(lastContour()!, currentPoint!, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y });
      currentPoint = { x, y };
      continue;
    }

    if (cmd === 'Z') {
      const lc = lastContour();
      if (lc) lc.closed = true;
      // Move current point back to start of contour if known
      if (startPoint) currentPoint = { ...startPoint };
      i++; // Z consumes no numeric parameters
      continue;
    }

    // Unsupported command: consume one token to avoid infinite loop
    i++;
  }

  return { contours };
}

function appendSegment(parts: string[], a: Knot, b: Knot) {
  if (a.hOut || b.hIn) {
    const c1x = a.hOut ? a.pos.x + a.hOut.dx : a.pos.x;
    const c1y = a.hOut ? a.pos.y + a.hOut.dy : a.pos.y;
    const c2x = b.hIn ? b.pos.x + b.hIn.dx : b.pos.x;
    const c2y = b.hIn ? b.pos.y + b.hIn.dy : b.pos.y;
    parts.push(`C ${num(c1x)} ${num(c1y)} ${num(c2x)} ${num(c2y)} ${num(b.pos.x)} ${num(b.pos.y)}`);
  } else {
    parts.push(`L ${num(b.pos.x)} ${num(b.pos.y)}`);
  }
}

function appendLineToCurrent(contour: PathContour, p: { x: number; y: number }) {
  const knot: Knot = { pos: { x: p.x, y: p.y } };
  contour.knots.push(knot);
}

function appendCubicToCurrent(
  contour: PathContour,
  prevPoint: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  p: { x: number; y: number },
) {
  // Attach hOut to previous knot
  const last = contour.knots[contour.knots.length - 1];
  last.hOut = handleFromAbs(prevPoint, c1);

  const newKnot: Knot = {
    pos: { x: p.x, y: p.y },
    hIn: handleFromAbs(p, c2),
  };
  contour.knots.push(newKnot);
}

function handleFromAbs(anchor: { x: number; y: number }, ctrl: { x: number; y: number }): Handle {
  return { dx: ctrl.x - anchor.x, dy: ctrl.y - anchor.y };
}

function tokenizePathData(d: string): string[] {
  // Split commands and numbers, keep commands in the stream
  // Numbers: allow optional sign, decimals, exponents
  const re = /([MLCQZ])|(-?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    if (m[1]) out.push(m[1]);
    else if (m[2]) out.push(m[2]);
  }
  return out;
}

function isCommand(t: string): boolean {
  return t === 'M' || t === 'L' || t === 'C' || t === 'Z';
}

function isNumber(t: string): boolean {
  return /^-?\d*\.?\d+(?:[eE][+-]?\d+)?$/.test(t);
}

function readNumber(tokens: string[], idx: number): number {
  const t = tokens[idx];
  if (!isNumber(t)) throw new Error(`Expected number at token ${idx}, got ${t}`);
  return Number(t);
}

function num(n: number): string {
  // Trim trailing zeros for compactness
  const s = n.toString();
  return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}
