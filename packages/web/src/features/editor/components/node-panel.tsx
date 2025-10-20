import { cn } from '@/lib/utils';
import { useEditorStore } from '@/features/editor/state/editor-store';
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, PlusIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';

export default function NodePanel({ className }: { className?: string }) {
  const doc = useEditorStore((s) => s.doc);

  const nodes = doc ? Object.keys(doc.getNodes()) : [];
  const rootNode = doc ? doc.getNode(nodes[0]) : null;
  const modifiers = nodes.slice(1);

  if (!rootNode) return null;

  return (
    <div
      className={cn(
        'bg-sidebar text-sidebar-foreground [&>div]:not-last:border-b flex h-full w-64 flex-col overflow-y-auto border-l [&>div]:px-2 [&>div]:py-4',
        className,
      )}
    >
      <div className="flex items-center">
        <p className="select-none font-medium">{rootNode.type}</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="select-none text-sm font-medium">
            Modifiers <span className="text-muted-foreground">({modifiers.length})</span>
          </p>
          <Button size="icon-sm" variant="ghost" className="hover:bg-sidebar-accent/70 dark:hover:bg-sidebar-accent">
            <PlusIcon />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {modifiers.map((node) => {
            const fullNode = doc ? doc.getNode(node) : null;
            return (
              <div
                key={node}
                className="bg-sidebar-accent text-sidebar-accent-foreground flex select-none items-center justify-between gap-2 rounded-lg p-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:bg-transparent dark:hover:bg-transparent"
                  >
                    <ChevronRightIcon />
                  </Button>
                  {fullNode?.name}
                </div>
                <div className="flex items-center gap-2">
                  <ButtonGroup orientation="horizontal">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-accent dark:hover:bg-accent dark:bg-transparent"
                    >
                      <ChevronUpIcon />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-accent dark:hover:bg-accent dark:bg-transparent"
                    >
                      <ChevronDownIcon />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-accent dark:hover:bg-accent dark:bg-transparent"
                    >
                      <XIcon />
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
