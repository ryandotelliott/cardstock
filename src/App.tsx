import { useEffect, useRef } from "react";
import { Editor } from "@/features/editor/editor";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const editor = new Editor(canvas);
    editorRef.current = editor;

    // Seed a few shapes to play with
    editor.add({
      id: "r1",
      type: "rect",
      x: 60,
      y: 60,
      width: 120,
      height: 80,
      fill: "#EBD213",
    });
    editor.add({
      id: "e1",
      type: "ellipse",
      x: 260,
      y: 160,
      radiusX: 40,
      radiusY: 40,
      fill: "#4D38AB",
    });

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  return (
    <div className="h-dvh w-dvw">
      <canvas className="h-full w-full" id="canvas" ref={canvasRef} />
    </div>
  );
}
