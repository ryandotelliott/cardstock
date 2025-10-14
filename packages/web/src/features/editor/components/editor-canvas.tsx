import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Engine } from '@/features/engine/engine';
import { useEditorStore } from '@/features/editor/state/editor-store';
import { useEditorInteractions } from '@/features/editor/hooks/use-editor-interactions';

type Props = {
  className?: string;
};

export default function EditorCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const { doc, docVersion } = useEditorStore();
  const { overlays, overlayVersion } = useEditorStore();
  const { interaction } = useEditorStore();
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useEditorInteractions(engineRef, canvasRef);

  useEffect(() => {
    if (!canvasRef.current || !doc) return;
    const engine = new Engine(doc, canvasRef.current.getContext('2d')!);
    engineRef.current = engine;
    engineRef.current.draw();
  }, [doc]);

  useEffect(() => {
    const selectedIds = interaction.mode === 'interacting' || interaction.mode === 'selection' ? interaction.nodes : [];
    engineRef.current?.draw({ overlays, selectedIds });
  }, [docVersion, overlays, overlayVersion, interaction]);

  return (
    <canvas
      className={cn('bg-background h-full w-full', className)}
      id="editor-canvas"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}
