import { useEffect, useMemo, useRef } from "react";
import { Engine } from "./features/engine/engine";
import { Doc } from "./features/engine/document";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const doc = useMemo(() => new Doc({ dpr: window.devicePixelRatio || 1 }), []);
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
    inputs: {},
  });

  doc.addNode({
    id: "shape:rect-2",
    name: "Rect",
    type: "Shape.Rect",
    params: {
      x: 100,
      y: 100,
      w: 100,
      h: 100,
      rx: 0,
      ry: 0,
    },
    inputs: {},
  });

  doc.addNode({
    id: "modifier:transform-1",
    name: "Transform",
    type: "Modifier.Transform",
    params: {
      tx: 11,
      ty: 100,
    },
    inputs: { in: { node: "shape:rect-1" } },
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(doc, canvasRef.current.getContext("2d")!);
    engineRef.current = engine;
    engineRef.current.draw();
  }, [doc]);

  return (
    <div className="h-dvh w-dvw">
      <canvas className="h-full w-full" id="canvas" ref={canvasRef} />
    </div>
  );
}
