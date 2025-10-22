import type { NodeId, Node } from '@/features/nodes/node-types';
import type { NodeOf } from '@/features/nodes/node-types';
import { Matrix } from '@/lib/matrix';
import type { PathGeometry } from '@/lib/geometry';

type Meta = {
  dpr: number;
};

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

  // Apply a local-space delta (post-multiplied) to the nearest transform node above `id`.
  // This preserves the intended effect N' = N * L, with L in local space.
  applyLocalDelta(id: NodeId, localDelta: Matrix) {
    let targetId: NodeId | undefined = id;
    while (targetId) {
      const node: Node | undefined = this.nodes[targetId];

      if (node?.type === 'Modifier.Transform') {
        const { sx = 1, sy = 1, r = 0, tx = 0, ty = 0 } = node.params;
        // Match kernel order (T -> R -> S) and convert degrees to radians
        const current = new Matrix()
          .translate(tx, ty)
          .rotate((r * Math.PI) / 180)
          .scale(sx, sy);
        const next = current.multiply(localDelta); // post-multiply by local delta

        // Decompose next back to TRS params, preserving negative scale signs.
        this.setTransformParamsFromMatrix(node, next);
        this.notify();
        return;
      }

      // If not a transform node, traverse up the input chain
      if (node?.inputs && 'in' in node.inputs && node.inputs.in) {
        targetId = node.inputs.in.node;
      } else {
        targetId = undefined;
      }
    }

    // No transform node found: insert one directly above the original node and rewire dependents
    const original = this.nodes[id];
    if (!original) return;

    // TODO: Probably worth creating a function that builds new nodes.
    const newId = `transform_${Date.now()}`;
    const transformNode: NodeOf<'Modifier.Transform'> = {
      id: newId,
      name: `${original.name} Transform`,
      type: 'Modifier.Transform',
      params: { sx: 1, sy: 1, r: 0, tx: 0, ty: 0 },
      inputs: { in: { node: id } },
    };

    this.nodes[newId] = transformNode;

    // Rewire dependents that pointed to the original id to point to the new transform node
    for (const n of Object.values(this.nodes)) {
      if (!n || !('inputs' in n) || !n.inputs) continue;
      if ('in' in n.inputs && n.inputs.in && n.inputs.in.node === id) {
        if (n.type === 'Modifier.Transform') {
          n.inputs.in = { node: newId };
        } else if (n.type === 'Modifier.Offset') {
          n.inputs.in = { node: newId };
        }
      }
    }

    // Update draw order: if the original was a sink being drawn, replace it with the new transform node
    this.drawOrder = this.drawOrder.map((nid) => (nid === id ? newId : nid));

    // Commit the local delta onto the new node (current is identity)
    const n = this.nodes[newId];
    if (n && n.type === 'Modifier.Transform') {
      const next = localDelta;
      this.setTransformParamsFromMatrix(n, next);
    }

    this.notify();
  }

  // Helper: decompose a matrix built as T * R * S into params, preserving negative scale signs.
  private setTransformParamsFromMatrix(node: NodeOf<'Modifier.Transform'>, m: Matrix) {
    // Translation
    node.params.tx = m.tx;
    node.params.ty = m.ty;

    // Linear part L = R * S = [[a, c],[b, d]] in our storage
    const a = m.a,
      b = m.b,
      c = m.c,
      d = m.d;

    // Extract rotation θ where L = R(θ) * S(sx, sy) and R = [[cos, -sin],[sin, cos]]
    // a = cos(θ)*sx, b = -sin(θ)*sx
    const theta = Math.atan2(-b, a);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Recover sx, sy with sign preserved; pick the more stable divisor
    let sx: number;
    if (Math.abs(cos) >= Math.abs(sin)) {
      sx = a / cos;
    } else {
      sx = -b / sin;
    }

    let sy: number;
    if (Math.abs(cos) >= Math.abs(sin)) {
      sy = d / cos;
    } else {
      sy = c / sin; // c = sin(θ)*sy
    }

    // Handle close-to-zero cases to avoid infinities
    if (!Number.isFinite(sx)) {
      sx = Math.sign(sx) || 1;
    }
    if (!Number.isFinite(sy)) {
      sy = Math.sign(sy) || 1;
    }

    node.params.sx = sx;
    node.params.sy = sy;
    node.params.r = (theta * 180) / Math.PI;
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
