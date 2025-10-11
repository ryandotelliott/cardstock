import type { NodeId } from "@/features/nodes/node-types";
import type { Doc } from "@/features/engine/document";
import { create } from "zustand";

type EditorState = {
  doc: Doc | null;
  selectedNodeId: NodeId | null;
  // Incremented when the document notifies a change
  docVersion: number;
  // Internal: unsubscribe current doc listener
  docUnsub?: () => void;
};

type EditorActions = {
  setDoc: (doc: Doc) => void;
  setSelectedNodeId: (nodeId: NodeId | null) => void;
};

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  doc: null,
  selectedNodeId: null,
  docVersion: 0,
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
}));
