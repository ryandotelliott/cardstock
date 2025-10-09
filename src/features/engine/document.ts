export type NodeId = string;

export type PortRef = { node: NodeId };

export type NodeSpec = {
  id: NodeId;
  type: "Shape.Rect" | "Shape.Ellipse" | "Modifier.Transform";
  params: Record<string, any>;
  inputs?: Record<string, PortRef | undefined>;
};

export type Node = {
  id: NodeId;
  name: string;
  type: NodeSpec["type"];
  params: Record<string, any>;
  inputs: Record<string, { node: NodeId } | undefined>;
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
  nodes: Record<string, Node> = {};
  drawOrder: NodeId[] = [];
  meta: Record<string, any> = {};

  constructor(meta: Record<string, any> = {}) {
    this.meta = meta;
  }

  addNode(node: Node) {
    this.nodes[node.id] = node;
    this.drawOrder.push(node.id);
  }

  removeNode(id: string) {
    delete this.nodes[id];
  }

  getNode(id: string) {
    return this.nodes[id];
  }
}
