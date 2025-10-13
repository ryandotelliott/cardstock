import type { NodeId } from "@/features/nodes/node-types";
import type { Doc } from "@/features/engine/document";
import type { Matrix } from "@/lib/matrix";
import { create } from "zustand";

type Interaction =
  | { mode: "idle" }
  | {
      mode: "dragging";
      origin: { x: number; y: number };
      nodes: NodeId[];
    };

type EditorState = {
  doc: Doc | null;
  selectedNodeId: NodeId | null;
  interaction: Interaction;
  // Incremented when the document notifies a change
  docVersion: number;
  // Internal: unsubscribe current doc listener
  docUnsub?: () => void;
  // Ephemeral transforms applied during interactions (not committed to doc)
  overlays: Record<NodeId, Matrix>;
  // Incremented when overlays change to trigger redraws
  overlayVersion: number;
};

type EditorActions = {
  setDoc: (doc: Doc) => void;
  setSelectedNodeId: (nodeId: NodeId | null) => void;
  startInteraction: (interaction: Interaction) => void;
  clearInteraction: () => void;
  // Set or clear an overlay transform for a node
  setOverlays: (nodeId: NodeId, transform?: Matrix) => void;
  // Clear all overlay transforms
  clearOverlays: () => void;
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  doc: null,
  selectedNodeId: null,
  interaction: { mode: "idle" },
  docVersion: 0,
  overlays: {},
  overlayVersion: 0,
  setDoc: (doc) =>
    set((state) => {
      // Clean up any previous subscription
      state.docUnsub?.();
      const unsub = doc.subscribe(() =>
        set((s) => ({ docVersion: s.docVersion + 1 })),
      );
      return { doc, docUnsub: unsub };
    }),
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  startInteraction: (interaction) => set({ interaction }),
  clearInteraction: () => set({ interaction: { mode: "idle" } }),
  setOverlays: (nodeId, transform) =>
    set((state) => {
      const next = { ...state.overlays };
      if (transform) {
        next[nodeId] = transform;
      } else {
        delete next[nodeId];
      }
      return {
        overlays: next,
        overlayVersion: state.overlayVersion + 1,
      };
    }),
  clearOverlays: () =>
    set((state) => ({
      overlays: {},
      overlayVersion: state.overlayVersion + 1,
    })),
}));
