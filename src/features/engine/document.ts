import type { NodeId, Node } from "../nodes/node-types";

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
  transform?: DOMMatrix;
};

export class Doc {
  private nodes: Record<NodeId, Node> = {};
  private drawOrder: NodeId[] = [];
  private meta: Meta;

  constructor(meta: Meta) {
    this.meta = meta;
  }

  addNode(node: Node) {
    this.nodes[node.id] = node;
    this.drawOrder.push(node.id);
  }

  removeNode(id: NodeId) {
    delete this.nodes[id];
  }

  getNode(id: NodeId) {
    return this.nodes[id];
  }

  getMeta() {
    return this.meta;
  }

  getNodes() {
    return this.nodes;
  }

  getDrawOrder() {
    return this.drawOrder;
  }
}
