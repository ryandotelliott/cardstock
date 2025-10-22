import { useEffect, type MouseEvent, type RefObject } from 'react';
import { useEditorStore } from '@/features/editor/state/editor-store';
import { Matrix } from '@/lib/matrix';
import { Engine } from '@/features/engine/engine';
import { calculateResizeOverlay } from '@/features/editor/lib/resize-logic';

const DRAG_THRESHOLD = 5;

export function useEditorInteractions(
  engineRef: RefObject<Engine | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const { overlays, setOverlays, clearOverlays } = useEditorStore();
  const { interaction, startInteraction, startDragging } = useEditorStore();
  const { doc } = useEditorStore();
  const { setSelection } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (interaction.mode === 'interacting' || interaction.mode === 'resizing')) {
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

    // If something is already selected, prioritize handle hit-testing first.
    const currentSelection =
      interaction.mode === 'selection' || interaction.mode === 'interacting' || interaction.mode === 'resizing'
        ? interaction.nodes
        : [];
    if (currentSelection.length) {
      const handleHit = engineRef.current.hitTestHandles(x, y, overlays, currentSelection);
      if (handleHit) {
        // Start a resizing interaction. Scaling behavior will be added later.
        startInteraction({
          mode: 'resizing',
          origin: { x, y },
          nodes: currentSelection,
          handle: handleHit.handleId,
          isDragging: false,
        });
        return;
      }
    }

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
    if ((interaction.mode !== 'interacting' && interaction.mode !== 'resizing') || !canvasRef.current || !doc) return;
    const dpr = doc.getMeta()?.dpr || 1;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - interaction.origin.x;
    const dy = y - interaction.origin.y;

    if (!interaction.isDragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      startDragging();
    }

    if (interaction.isDragging) {
      if (interaction.mode === 'interacting') {
        const t = new Matrix().translate(dx, dy);
        for (const id of interaction.nodes) {
          setOverlays(id, t);
        }
      }
      if (interaction.mode === 'resizing') {
        for (const id of interaction.nodes) {
          if (!engineRef.current) continue;
          const overlay = calculateResizeOverlay(id, interaction, { x, y }, engineRef.current, dpr);
          if (overlay) {
            setOverlays(id, overlay);
          }
        }
      }
    }
  };

  const handleMouseUp = () => {
    if ((interaction.mode !== 'interacting' && interaction.mode !== 'resizing') || !engineRef.current) return;

    // Commit the current overlay transform(s) to the document
    if (interaction.isDragging) {
      for (const id of interaction.nodes) {
        const overlay = overlays[id];
        if (!overlay) continue;
        engineRef.current.applyWorldOverlay(id, overlay);
      }
    }

    // Clear overlays and set selection to the dragged nodes
    clearOverlays();
    setSelection(interaction.nodes);
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
