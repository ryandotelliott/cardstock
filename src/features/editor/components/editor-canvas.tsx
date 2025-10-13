import { useRef, useEffect, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { Engine } from '@/features/engine/engine';
import { useEditorStore } from '../state/editor-store';
import { Matrix } from '@/lib/matrix';

type Props = {
  className?: string;
};

export default function EditorCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const { doc, docVersion } = useEditorStore();
  const { overlays, overlayVersion, setOverlays, clearOverlays } = useEditorStore();
  const { interaction, startInteraction, clearInteraction } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current || !doc) return;
    const engine = new Engine(doc, canvasRef.current.getContext('2d')!);
    engineRef.current = engine;
    engineRef.current.draw();
  }, [doc]);

  useEffect(() => {
    engineRef.current?.draw(overlays);
  }, [docVersion, overlays, overlayVersion]);

  const handleMouseDown = (e: MouseEvent) => {
    if (!engineRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = engineRef.current.hitTest(x, y);
    if (hit) {
      startInteraction({
        mode: 'dragging',
        origin: { x, y },
        nodes: [hit],
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (interaction.mode !== 'dragging' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - interaction.origin.x;
    const dy = y - interaction.origin.y;

    const t = new Matrix().translate(dx, dy);
    for (const id of interaction.nodes) {
      setOverlays(id, t);
    }
  };

  const handleMouseUp = () => {
    if (interaction.mode !== 'dragging' || !engineRef.current) return;

    // Commit the current overlay transform(s) to the document
    for (const id of interaction.nodes) {
      const overlay = overlays[id];
      if (overlay) {
        engineRef.current.applyTransform(id, overlay);
      }
    }

    // Clear overlays and interaction state
    clearOverlays();
    clearInteraction();
  };

  return (
    <canvas
      className={cn('h-full w-full', className)}
      id="editor-canvas"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}
