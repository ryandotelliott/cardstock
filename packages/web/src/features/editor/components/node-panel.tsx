import { cn } from '@/lib/utils';
import { useEditorStore } from '@/features/editor/state/editor-store';

export default function NodePanel({ className }: { className?: string }) {
  const doc = useEditorStore((s) => s.doc);

  const nodes = doc ? Object.keys(doc.getNodes()) : [];

  return (
    <div
      className={cn('bg-background text-foreground flex h-full w-48 flex-col overflow-y-auto border-l p-2', className)}
    >
      <p className="select-none text-sm font-medium">Nodes - {nodes.length}</p>
      {doc
        ? Object.keys(doc.getNodes()).map((node) => {
            const fullNode = doc.getNode(node);
            return (
              <div key={node} className="hover:bg-muted select-none rounded p-2">
                {fullNode?.name}
              </div>
            );
          })
        : null}
    </div>
  );
}
