import { useRef, useEffect, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { Engine } from "@/features/engine/engine";
import { useEditorStore } from "../state/editor-store";

type Props = {
  className?: string;
};

export default function EditorCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const doc = useEditorStore((s) => s.doc);
  const docVersion = useEditorStore((s) => s.docVersion);

  useEffect(() => {
    if (!canvasRef.current || !doc) return;
    const engine = new Engine(doc, canvasRef.current.getContext("2d")!);
    engineRef.current = engine;
    engineRef.current.draw();
  }, [doc]);

  useEffect(() => {
    engineRef.current?.draw();
  }, [docVersion]);

  return (
    <canvas
      className={cn("h-full w-full", className)}
      id="editor-canvas"
      ref={canvasRef}
      onClick={(e: MouseEvent) => {
        if (!engineRef.current || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const hit = engineRef.current.hitTest(x, y);
        console.log("hit", hit);
      }}
    />
  );
}
