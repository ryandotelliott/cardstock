import { Evaluator } from "./evaluator";
import type { Doc, NodeId } from "./document";
import { Renderer } from "./renderer";

export class Engine {
  private doc: Doc;
  private evaluator: Evaluator;
  private renderer: Renderer;

  constructor(doc: Doc, ctx: CanvasRenderingContext2D) {
    this.doc = doc;
    this.evaluator = new Evaluator(doc);
    this.renderer = new Renderer(ctx);
    this.recomputeDrawOrder();
  }

  setDocument(doc: Doc) {
    this.doc = doc;
    this.evaluator = new Evaluator(doc);
    this.recomputeDrawOrder();
  }

  setParam(id: NodeId, key: string, value: any) {
    this.doc.nodes[id].params[key] = value;
  }

  connect(target: NodeId, port: string, source: NodeId) {
    const n = this.doc.nodes[target];
    n.inputs = n.inputs ?? {};
    n.inputs[port] = { node: source };
    this.recomputeDrawOrder();
  }

  draw() {
    const results = this.evaluator.evaluate();
    this.renderer.draw(this.doc, results);
  }

  // Keep only sink nodes (no dependents) in drawOrder.
  private recomputeDrawOrder() {
    const dependents = new Map<NodeId, Set<NodeId>>();
    for (const id of Object.keys(this.doc.nodes)) dependents.set(id, new Set());
    for (const [id, node] of Object.entries(this.doc.nodes)) {
      for (const ref of Object.values(node.inputs ?? {})) {
        if (ref) dependents.get(ref.node)?.add(id);
      }
    }
    const sinks = Object.keys(this.doc.nodes).filter(
      (id) => (dependents.get(id)?.size ?? 0) === 0,
    );

    // Preserve existing order for sinks already present; append new sinks.
    const existingOrder = this.doc.drawOrder.filter((id) => sinks.includes(id));
    const existingSet = new Set(existingOrder);
    const newOnes = sinks.filter((id) => !existingSet.has(id));
    this.doc.drawOrder = [...existingOrder, ...newOnes];
  }
}
