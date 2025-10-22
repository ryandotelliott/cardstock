import { type Engine } from '@/features/engine/engine';
import { type Interaction } from '@/features/editor/state/editor-store';
import { type NodeId } from '@/features/nodes/node-types';
import { Matrix } from '@/lib/matrix';
import type { Point } from '@/lib/geometry';
import { composeLocalToCanvas, localScaleDelta, worldOverlayForLocalDelta } from '@/features/editor/renderer/transform';
import { pathGeometryToSvgPath } from '@/lib/svg';
import { boundsPath } from 'geom-wasm';
import { type HandleId } from '@/features/editor/renderer/selection';

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function bboxCornersLocal(bounds: Bounds): Point[] {
  const { minX, minY, maxX, maxY } = bounds;
  // c0..c3 clockwise in local space
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

function bboxEdgeMidsLocal(corners: Point[]): Point[] {
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  return [
    mid(corners[0], corners[1]),
    mid(corners[1], corners[2]),
    mid(corners[2], corners[3]),
    mid(corners[3], corners[0]),
  ];
}

// TODO: Clean this up to not use string parsing / casting
function getLocalResizePivot(handle: HandleId, bounds: Bounds): Point {
  const corners = bboxCornersLocal(bounds);
  const edges = bboxEdgeMidsLocal(corners);
  if (handle.startsWith('c')) {
    const i = Number(handle[1]) as 0 | 1 | 2 | 3;
    return corners[(i + 2) % 4];
  } else {
    const i = Number(handle[1]) as 0 | 1 | 2 | 3;
    return edges[(i + 2) % 4];
  }
}

export function calculateResizeOverlay(
  nodeId: NodeId,
  interaction: Extract<Interaction, { mode: 'resizing' }>,
  cursorPosCanvas: Point,
  engine: Engine,
  dpr: number,
): Matrix | undefined {
  const evalResult = engine.getEvalResult(nodeId);
  if (!evalResult) return;

  const localToCanvas = composeLocalToCanvas({
    worldToCanvas: new Matrix().scale(dpr, dpr),
    localToWorld: evalResult.localToWorld,
  });
  const canvasToLocal = localToCanvas.inverse();

  const startCanvas = { x: interaction.origin.x * dpr, y: interaction.origin.y * dpr };
  const currentCanvas = { x: cursorPosCanvas.x * dpr, y: cursorPosCanvas.y * dpr };

  const startLocal = canvasToLocal.transformPoint(startCanvas);
  const currentLocal = canvasToLocal.transformPoint(currentCanvas);

  const svgPath = pathGeometryToSvgPath(evalResult.geom);
  const rawBounds = boundsPath(svgPath);
  if (!rawBounds) return;
  const [bx0, by0, bx1, by1] = rawBounds;
  const bounds = { minX: bx0, minY: by0, maxX: bx1, maxY: by1 };

  const pivot = getLocalResizePivot(interaction.handle, bounds);

  // Pointer deltas from pivot in local space
  const startDelta = { x: startLocal.x - pivot.x, y: startLocal.y - pivot.y };
  const currDelta = { x: currentLocal.x - pivot.x, y: currentLocal.y - pivot.y };

  const ratio = (a: number, b: number, fallback = 1) => (Math.abs(b) < 1e-9 ? fallback : a / b);
  const clampScale = (s: number, minAbs = 1e-6) => {
    if (!Number.isFinite(s)) return 1;
    const abs = Math.abs(s);
    return abs < minAbs ? (s < 0 ? -minAbs : minAbs) : s;
  };

  let sx = 1;
  let sy = 1;

  const h = interaction.handle;
  if (h === 'c0' || h === 'c1' || h === 'c2' || h === 'c3') {
    // Corner: scale on both axes
    sx = ratio(currDelta.x, startDelta.x);
    sy = ratio(currDelta.y, startDelta.y);
  } else {
    // Edge: scale only on one axis. e0/e2 => vertical (y), e1/e3 => horizontal (x)
    const isVertical = h === 'e0' || h === 'e2';
    if (isVertical) {
      sy = ratio(currDelta.y, startDelta.y);
    } else {
      sx = ratio(currDelta.x, startDelta.x);
    }
  }

  sx = clampScale(sx);
  sy = clampScale(sy);

  const localDelta = localScaleDelta(sx, sy, pivot);
  return worldOverlayForLocalDelta(evalResult.localToWorld, localDelta);
}
