import { Evaluator } from '@/features/engine/evaluator';
import type { Doc, EvalResult } from '@/features/engine/document';
import type { NodeId, NodeInputsByType } from '@/features/nodes/node-types';
import { Renderer } from '@/features/editor/renderer';
import { Matrix } from '@/lib/matrix';

export class Engine {
  private doc: Doc;
  private evaluator: Evaluator;
  private renderer: Renderer;
  private lastResults: Record<NodeId, EvalResult> | null = null;

  constructor(doc: Doc, ctx: CanvasRenderingContext2D) {
    this.doc = doc;
    this.evaluator = new Evaluator(doc);
    this.renderer = new Renderer(ctx);
    this.recomputeDrawOrder();
  }

  setDocument(doc: Doc) {
    this.doc = doc;
    this.evaluator = new Evaluator(doc);
    this.lastResults = null;
    this.recomputeDrawOrder();
  }

  connect(target: NodeId, port: keyof NodeInputsByType['Modifier.Transform'], source: NodeId) {
    const n = this.doc.getNode(target);
    if (!n) return;
    if (n.type === 'Modifier.Transform' && port === 'in') {
      n.inputs.in = { node: source };
      this.lastResults = null;
      this.recomputeDrawOrder();
    }
    if (n.type === 'Modifier.Offset' && port === 'in') {
      n.inputs.in = { node: source };
      this.lastResults = null;
      this.recomputeDrawOrder();
    }
  }

  draw(opts?: { overlays?: Record<NodeId, Matrix>; selectedIds?: NodeId[] }) {
    const results = this.evaluator.evaluate();
    this.lastResults = results;
    this.renderer.draw(this.doc, results, opts?.overlays, opts?.selectedIds ?? []);
  }

  hitTest(x: number, y: number): NodeId | null {
    const results = this.lastResults ?? this.evaluator.evaluate();
    return this.renderer.hitTest(this.doc, results, x, y);
  }

  applyTransform(id: NodeId, transform: Matrix) {
    this.doc.applyTransform(id, transform);
  }

  // Keep only sink nodes (no dependents) in drawOrder.
  private recomputeDrawOrder() {
    const dependents = new Map<NodeId, Set<NodeId>>();
    const nodes = this.doc.getNodes();
    for (const id of Object.keys(nodes)) dependents.set(id, new Set());
    for (const [id, node] of Object.entries(nodes)) {
      for (const ref of Object.values(node.inputs ?? {})) {
        if (ref) dependents.get(ref.node)?.add(id);
      }
    }
    const sinks = Object.keys(nodes).filter((id) => (dependents.get(id)?.size ?? 0) === 0);

    // Preserve existing order for sinks already present; append new sinks.
    const existingOrder = this.doc.getDrawOrder().filter((id) => sinks.includes(id));
    const existingSet = new Set(existingOrder);
    const newOnes = sinks.filter((id) => !existingSet.has(id));
    this.doc.setDrawOrder([...existingOrder, ...newOnes]);
  }
}
