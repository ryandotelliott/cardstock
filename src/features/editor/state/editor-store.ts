import type { NodeId } from "@/features/nodes/node-types";
import type { Doc } from "@/features/engine/document";
import type { Matrix } from "@/lib/matrix";
import { create } from "zustand";

type EditorState = {
  doc: Doc | null;
  selectedNodeId: NodeId | null;
  // Incremented when the document notifies a change
  docVersion: number;
  // Internal: unsubscribe current doc listener
  docUnsub?: () => void;
  // Ephemeral transforms applied during interactions (not committed to doc)
  overlayTransforms: Record<NodeId, Matrix>;
  // Incremented when overlays change to trigger redraws
  overlayVersion: number;
};

type EditorActions = {
  setDoc: (doc: Doc) => void;
  setSelectedNodeId: (nodeId: NodeId | null) => void;
  // Set or clear an overlay transform for a node
  setOverlayTransform: (nodeId: NodeId, transform?: Matrix) => void;
  // Clear all overlay transforms
  clearOverlays: () => void;
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  doc: null,
  selectedNodeId: null,
  docVersion: 0,
  overlayTransforms: {},
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
  setOverlayTransform: (nodeId, transform) =>
    set((state) => {
      const next = { ...state.overlayTransforms };
      if (transform) {
        next[nodeId] = transform;
      } else {
        delete next[nodeId];
      }
      return {
        overlayTransforms: next,
        overlayVersion: state.overlayVersion + 1,
      };
    }),
  clearOverlays: () =>
    set((state) => ({
      overlayTransforms: {},
      overlayVersion: state.overlayVersion + 1,
    })),
}));
