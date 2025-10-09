import type { Doc, EvalResult, NodeId } from "./document";
import { Kernels } from "./kernels";

export class Evaluator {
  private doc: Doc;
  constructor(doc: Doc) {
    this.doc = doc;
  }

  // Very small topo: DFS with visited set
  private topoOrder(): NodeId[] {
    const order: NodeId[] = [];
    const seen = new Set<NodeId>();
    const visit = (id: NodeId) => {
      if (seen.has(id)) return;
      seen.add(id);
      const spec = this.doc.nodes[id];
      if (spec?.inputs) {
        for (const port of Object.values(spec.inputs)) {
          if (port) visit(port.node);
        }
      }
      order.push(id);
    };
    // visit only what will be drawn
    this.doc.drawOrder.forEach(visit);
    return order;
  }

  evaluate(): Record<NodeId, EvalResult> {
    const results: Record<NodeId, EvalResult> = {};
    for (const id of this.topoOrder()) {
      const spec = this.doc.nodes[id];
      const kernel = Kernels[spec.type];
      const inputs: Record<string, EvalResult | undefined> = {};
      for (const [port, ref] of Object.entries(spec.inputs ?? {})) {
        inputs[port] = ref ? results[ref.node] : undefined;
      }
      results[id] = kernel(inputs, spec.params);
    }
    return results; // caller renders using doc.drawOrder
  }
}
