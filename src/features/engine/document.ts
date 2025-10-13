import type { NodeId, Node } from '../nodes/node-types';
import { Matrix } from '../../lib/matrix';

type Meta = {
  dpr: number;
};

export type PathContour = {
  closed: boolean;
  // Cubic beziers represented as anchor + handle deltas
  knots: {
    pos: { x: number; y: number };
    hIn?: { dx: number; dy: number };
    hOut?: { dx: number; dy: number };
  }[];
};

export type PathGeometry = { contours: PathContour[] };

export type EvalResult = {
  geom: PathGeometry;
  transform?: Matrix;
};

export class Doc {
  private nodes: Record<NodeId, Node> = {};
  private drawOrder: NodeId[] = [];
  private meta: Meta;
  private listeners: Set<() => void> = new Set();

  constructor(meta: Meta) {
    this.meta = meta;
  }

  addNode(node: Node) {
    this.nodes[node.id] = node;
    this.drawOrder.push(node.id);
    this.notify();
  }

  removeNode(id: NodeId) {
    delete this.nodes[id];
    // Ensure draw order remains consistent when removing nodes
    this.drawOrder = this.drawOrder.filter((n) => n !== id);
    this.notify();
  }

  applyTransform(id: NodeId, transform: Matrix) {
    // TODO: For now, we only support transform nodes.
    // Ideally this would create a new Transform node if needed.
    const node = this.nodes[id];
    if (node?.type === 'Modifier.Transform') {
      const { sx = 1, sy = 1, r = 0, tx = 0, ty = 0 } = node.params;
      // Match kernel order (T -> R -> S) and convert degrees to radians
      const current = new Matrix()
        .translate(tx, ty)
        .rotate((r * Math.PI) / 180)
        .scale(sx, sy);
      const next = transform.multiply(current);

      // Decompose back to params. Note: this is a simplification that
      // loses skew, but is fine for now as we only support SRT transforms.
      node.params.tx = next.e;
      node.params.ty = next.f;
      node.params.sx = Math.sqrt(next.a * next.a + next.b * next.b);
      node.params.sy = Math.sqrt(next.c * next.c + next.d * next.d);
      // Extract rotation in degrees. For matrix [[a c e],[b d f]], angle = atan2(b, a)
      node.params.r = (Math.atan2(next.b, next.a) * 180) / Math.PI;

      this.notify();
    }
  }

  getNode(id: NodeId): Node | undefined {
    return this.nodes[id];
  }

  getMeta() {
    return this.meta;
  }

  updateMeta(meta: Partial<Meta>) {
    this.meta = { ...this.meta, ...meta };
    this.notify();
  }

  getNodes() {
    return this.nodes;
  }

  getDrawOrder() {
    // Return a copy to prevent external mutation
    return [...this.drawOrder];
  }

  // Replace draw order atomically and notify subscribers
  setDrawOrder(order: NodeId[]) {
    this.drawOrder = order;
    this.notify();
  }

  // Basic subscription API for external listeners (e.g., UI store)
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all subscribers of a change
  notify() {
    for (const l of this.listeners) l();
  }
}
