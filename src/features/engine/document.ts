import type { NodeId, Node } from "../nodes/node-types";
import type { Matrix } from "../../lib/matrix";

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

  getNode(id: NodeId): Node | undefined {
    return this.nodes[id];
  }

  getMeta() {
    return this.meta;
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
