import { Circle, Highlighter, MousePointer2, MoveUpRight, Pencil, Save, Square, StickyNote, Trash2, Type, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Text } from '@/components/ui/typography';
import { INK_COLORS } from '@/lib/annotate/inkColors';
import { cn } from '@/lib/utils';
import type { AnnotateTool } from './AnnotationLayer';

const TOOLS: { tool: AnnotateTool; label: string; Icon: typeof Pencil }[] = [
  { tool: 'select', label: 'Select and move', Icon: MousePointer2 },
  { tool: 'pen', label: 'Pen', Icon: Pencil },
  { tool: 'highlight', label: 'Highlighter', Icon: Highlighter },
  { tool: 'rect', label: 'Rectangle', Icon: Square },
  { tool: 'ellipse', label: 'Ellipse', Icon: Circle },
  { tool: 'arrow', label: 'Arrow', Icon: MoveUpRight },
  { tool: 'text', label: 'Text', Icon: Type },
  { tool: 'note', label: 'Sticky note', Icon: StickyNote },
];

const COLOR_NAMES: Record<string, string> = {
  '#111111': 'Black',
  '#d43c3c': 'Red',
  '#2f6fd4': 'Blue',
  '#2f9e57': 'Green',
  '#f2c53d': 'Yellow',
};

interface AnnotateToolbarProps {
  tool: AnnotateTool;
  color: string;
  count: number;
  canUndo: boolean;
  hasSelection: boolean;
  saving: boolean;
  onTool: (tool: AnnotateTool) => void;
  onColor: (color: string) => void;
  onUndo: () => void;
  onDelete: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export const AnnotateToolbar = ({
  tool,
  color,
  count,
  canUndo,
  hasSelection,
  saving,
  onTool,
  onColor,
  onUndo,
  onDelete,
  onSave,
  onDiscard,
  onClose,
}: AnnotateToolbarProps) => (
  <div role="toolbar" aria-label="Annotate" className="flex flex-wrap items-center gap-1 border-b bg-card px-3 py-2">
    {TOOLS.map(({ tool: t, label, Icon }) => (
      <Toggle key={t} size="sm" pressed={tool === t} onPressedChange={() => onTool(t)} aria-label={label} title={label}>
        <Icon aria-hidden />
      </Toggle>
    ))}
    <div className="mx-1 flex items-center gap-1" role="radiogroup" aria-label="Ink colour">
      {INK_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={color === c}
          aria-label={COLOR_NAMES[c] ?? c}
          onClick={() => onColor(c)}
          className={cn('h-6 w-6 rounded-full ring-offset-2 ring-offset-card', color === c && 'ring-2 ring-primary')}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
    <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo">
      <Undo2 aria-hidden />
    </Button>
    <Button variant="ghost" size="icon" onClick={onDelete} disabled={!hasSelection} aria-label="Delete selected">
      <Trash2 aria-hidden />
    </Button>
    <Text variant="caption" tone="muted" as="span" className="ml-auto">
      {count === 0 ? 'No markup yet' : `${count} ${count === 1 ? 'mark' : 'marks'} · draft kept in this browser`}
    </Text>
    {count > 0 && (
      <Button variant="ghost" size="sm" onClick={onDiscard}>
        Discard
      </Button>
    )}
    <Button size="sm" onClick={onSave} disabled={count === 0 || saving}>
      <Save aria-hidden />
      {saving ? 'Saving…' : 'Save PDF'}
    </Button>
    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close annotate">
      <X aria-hidden />
    </Button>
  </div>
);
