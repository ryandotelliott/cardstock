import { cn } from '@/lib/utils';
import { useEditorStore } from '@/features/editor/state/editor-store';

export default function NodePanel({ className }: { className?: string }) {
  const doc = useEditorStore((s) => s.doc);

  const nodes = doc ? Object.keys(doc.getNodes()) : [];

  return (
    <div className={cn('flex h-full w-48 flex-col overflow-y-auto border-l bg-background p-2', className)}>
      <p className="text-sm font-medium select-none">Nodes - {nodes.length}</p>
      {doc
        ? Object.keys(doc.getNodes()).map((node) => {
            const fullNode = doc.getNode(node);
            return (
              <div key={node} className="rounded p-2 select-none hover:bg-muted">
                {fullNode?.name}
              </div>
            );
          })
        : null}
    </div>
  );
}
