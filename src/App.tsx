import { useEffect, useMemo, useRef } from "react";
import { Engine } from "./features/engine/engine";
import { Doc } from "./features/engine/document";
import { useEditorStore } from "./features/editor/state/editor-store";
import NodePanel from "./features/editor/components/node-panel";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const { setDoc } = useEditorStore();
  const docVersion = useEditorStore((s) => s.docVersion);

  const doc = useMemo(() => {
    const doc = new Doc({ dpr: window.devicePixelRatio || 1 });

    doc.addNode({
      id: "shape:rect-1",
      name: "Rect",
      type: "Shape.Rect",
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
      id: "modifier:transform-1",
      name: "Transform",
      type: "Modifier.Transform",
      params: {
        tx: 100,
        ty: 30,
        r: 45,
      },
      inputs: { in: { node: "shape:rect-1" } },
    });

    return doc;
  }, []);

  useEffect(() => {
    setDoc(doc);
  }, [doc, setDoc]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(doc, canvasRef.current.getContext("2d")!);
    engineRef.current = engine;
    engineRef.current.draw();
  }, [doc]);

  // Redraw on any document change
  useEffect(() => {
    engineRef.current?.draw();
  }, [docVersion]);

  return (
    <div className="h-dvh w-dvw">
      <canvas className="h-full w-full" id="canvas" ref={canvasRef} />
      <NodePanel className="absolute top-0 right-0" />
    </div>
  );
}
