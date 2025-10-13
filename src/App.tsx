import { useEffect, useMemo } from 'react';
import { Doc } from './features/engine/document';
import { useEditorStore } from './features/editor/state/editor-store';
import NodePanel from './features/editor/components/node-panel';
import EditorCanvas from './features/editor/components/editor-canvas';

export default function App() {
  const { setDoc } = useEditorStore();

  const doc = useMemo(() => {
    const doc = new Doc({ dpr: window.devicePixelRatio || 1 });

    doc.addNode({
      id: 'shape:rect-1',
      name: 'Rect',
      type: 'Shape.Rect',
      params: {
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        rx: 0,
        ry: 0,
      },
    });

    doc.addNode({
      id: 'modifier:transform-1',
      name: 'Transform',
      type: 'Modifier.Transform',
      params: {
        tx: 100,
        ty: 30,
        r: 45,
      },
      inputs: { in: { node: 'shape:rect-1' } },
    });

    return doc;
  }, []);

  useEffect(() => {
    setDoc(doc);
  }, [doc, setDoc]);

  useEffect(() => {
    const resizeHandler = new ResizeObserver(() => {
      doc.updateMeta({ dpr: window.devicePixelRatio || 1 });
    });
    resizeHandler.observe(document.body);

    return () => {
      resizeHandler.disconnect();
    };
  }, [doc]);

  return (
    <div className="h-dvh w-dvw">
      <EditorCanvas />
      <NodePanel className="absolute top-0 right-0" />
    </div>
  );
}
