import type { Doc, EvalResult } from "./document";
import type { NodeId } from "../nodes/node-types";
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
      const spec = this.doc.getNode(id);
      if (spec?.inputs) {
        for (const port of Object.values(spec.inputs)) {
          if (port) visit(port.node);
        }
      }
      order.push(id);
    };
    // visit only what will be drawn
    this.doc.getDrawOrder().forEach(visit);
    return order;
  }

  evaluate(): Record<NodeId, EvalResult> {
    const results: Record<NodeId, EvalResult> = {};

    for (const id of this.topoOrder()) {
      const spec = this.doc.getNode(id);
      if (!spec) continue;

      switch (spec.type) {
        case "Shape.Rect": {
          results[id] = Kernels["Shape.Rect"]({}, spec.params);
          break;
        }
        case "Shape.Ellipse": {
          results[id] = Kernels["Shape.Ellipse"]({}, spec.params);
          break;
        }
        case "Modifier.Transform": {
          const inRef = spec.inputs.in;
          const inResult = inRef ? results[inRef.node] : undefined;
          results[id] = Kernels["Modifier.Transform"](
            { in: inResult },
            spec.params,
          );
          break;
        }
      }
    }

    return results;
  }
}
