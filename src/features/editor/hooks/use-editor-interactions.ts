import { useEffect, type MouseEvent, type RefObject } from 'react';
import { useEditorStore } from '../state/editor-store';
import { Matrix } from '@/lib/matrix';
import { Engine } from '@/features/engine/engine';

const DRAG_THRESHOLD = 5;

export function useEditorInteractions(
  engineRef: RefObject<Engine | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const { overlays, setOverlays, clearOverlays } = useEditorStore();
  const { interaction, startInteraction, startDragging } = useEditorStore();
  const { setSelection } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && interaction.mode === 'interacting') {
        clearOverlays();
        setSelection(interaction.nodes);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interaction, clearOverlays, setSelection]);

  const handleMouseDown = (e: MouseEvent) => {
    if (!engineRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = engineRef.current.hitTest(x, y);
    if (hit) {
      setSelection([hit]);
      startInteraction({
        mode: 'interacting',
        origin: { x, y },
        nodes: [hit],
        isDragging: false,
      });
    } else {
      setSelection([]);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (interaction.mode !== 'interacting' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - interaction.origin.x;
    const dy = y - interaction.origin.y;

    if (!interaction.isDragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      startDragging();
    }

    if (interaction.isDragging) {
      const t = new Matrix().translate(dx, dy);
      for (const id of interaction.nodes) {
        setOverlays(id, t);
      }
    }
  };

  const handleMouseUp = () => {
    if (interaction.mode !== 'interacting' || !engineRef.current) return;

    // Commit the current overlay transform(s) to the document
    if (interaction.isDragging) {
      for (const id of interaction.nodes) {
        const overlay = overlays[id];
        if (overlay) {
          engineRef.current.applyTransform(id, overlay);
        }
      }
    }

    // Clear overlays and set selection to the dragged nodes
    clearOverlays();
    setSelection(interaction.nodes);
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
