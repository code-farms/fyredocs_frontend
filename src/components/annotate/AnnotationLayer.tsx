import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  annotationAt,
  annotationBounds,
  annotationId,
  arrowHead,
  DEFAULT_FONT_SCALE,
  DEFAULT_STROKE,
  dragRect,
  HIGHLIGHT_STROKE,
  moveAnnotation,
  pointsBounds,
  pointsToSvgPath,
  textBounds,
  type Annotation,
  type Pt,
} from '@/lib/annotate/model';
import { NOTE_FILL } from '@/lib/annotate/inkColors';

export type AnnotateTool = 'select' | 'pen' | 'highlight' | 'rect' | 'ellipse' | 'arrow' | 'text' | 'note';

interface AnnotationLayerProps {
  /** Page box in CSS px. */
  width: number;
  height: number;
  annotations: Annotation[];
  /** Null = read-only display (annotate mode off). */
  tool: AnnotateTool | null;
  color: string;
  selectedId: string | null;
  onAdd: (a: Annotation) => void;
  onUpdate: (a: Annotation) => void;
  onSelect: (id: string | null) => void;
}

/** Draws one annotation into page pixels — normalized model × page box. */
const Shape = ({ a, w, h, aspect }: { a: Annotation; w: number; h: number; aspect: number }) => {
  const opacity = 'opacity' in a && a.opacity !== undefined ? a.opacity : 1;
  switch (a.kind) {
    case 'pen':
    case 'highlight':
      return (
        <path
          d={pointsToSvgPath(a.points, w, h, a.dx, a.dy)}
          stroke={a.color}
          strokeWidth={a.strokeWidth * w}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={a.kind === 'highlight' ? 0.4 : opacity}
          style={a.kind === 'highlight' ? { mixBlendMode: 'multiply' } : undefined}
        />
      );
    case 'rect':
      return <rect x={a.x * w} y={a.y * h} width={a.w * w} height={a.h * h} stroke={a.color} strokeWidth={a.strokeWidth * w} fill="none" opacity={opacity} />;
    case 'ellipse':
      return (
        <ellipse
          cx={(a.x + a.w / 2) * w}
          cy={(a.y + a.h / 2) * h}
          rx={(a.w / 2) * w}
          ry={(a.h / 2) * h}
          stroke={a.color}
          strokeWidth={a.strokeWidth * w}
          fill="none"
          opacity={opacity}
        />
      );
    case 'arrow':
    case 'underline':
    case 'strike': {
      const head = a.kind === 'arrow' ? arrowHead(a.x1, a.y1, a.x2, a.y2) : null;
      return (
        <g stroke={a.color} strokeWidth={a.strokeWidth * w} strokeLinecap="round" opacity={opacity}>
          <line x1={a.x1 * w} y1={a.y1 * h} x2={a.x2 * w} y2={a.y2 * h} />
          {head && (
            <>
              <line x1={a.x2 * w} y1={a.y2 * h} x2={head.hx1 * w} y2={head.hy1 * h} />
              <line x1={a.x2 * w} y1={a.y2 * h} x2={head.hx2 * w} y2={head.hy2 * h} />
            </>
          )}
        </g>
      );
    }
    case 'text':
    case 'note':
    case 'stamp':
    case 'date': {
      const b = textBounds(a, aspect);
      const font = a.fontScale * w;
      return (
        <g opacity={opacity}>
          {a.kind === 'note' && <rect x={b.x * w - 4} y={b.y * h - 2} width={b.w * w + 8} height={b.h * h + 4} fill={NOTE_FILL} rx={3} />}
          <text x={a.x * w} y={a.y * h + font} fontSize={font} fill={a.color} fontFamily="Helvetica, Arial, sans-serif">
            {a.text}
          </text>
        </g>
      );
    }
    default: {
      // Kinds this editor can't create (signature, blur, redact from imports) show as their box.
      const b = annotationBounds(a, aspect);
      return <rect x={b.x * w} y={b.y * h} width={b.w * w} height={b.h * h} fill="none" stroke="currentColor" strokeDasharray="4 3" />;
    }
  }
};

type Gesture =
  | { kind: 'draw'; points: Pt[] }
  | { kind: 'drag'; from: Pt; to: Pt }
  | { kind: 'move'; origin: Annotation; from: Pt; moved: boolean };

/**
 * The page's annotations as SVG, plus the editing gestures when a tool is
 * active: freehand (pen, highlight), drag-out (rect, ellipse, arrow),
 * click-to-type (text, note) and select/move. All geometry is normalized to
 * the page box, so the same model renders at any zoom and saves exactly.
 */
export const AnnotationLayer = ({ width, height, annotations, tool, color, selectedId, onAdd, onUpdate, onSelect }: AnnotationLayerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [typing, setTyping] = useState<{ at: Pt; kind: 'text' | 'note'; value: string } | null>(null);
  const aspect = height / width;

  const toPt = (e: ReactPointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / (r.width || width))),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / (r.height || height))),
    };
  };

  const commitText = () => {
    if (typing?.value.trim()) {
      onAdd({
        id: annotationId(),
        kind: typing.kind,
        x: typing.at.x,
        y: typing.at.y,
        text: typing.value.trim(),
        color: typing.kind === 'note' ? '#111111' : color,
        fontScale: DEFAULT_FONT_SCALE,
      });
    }
    setTyping(null);
  };

  const onDown = (e: ReactPointerEvent) => {
    if (!tool) return;
    const p = toPt(e);
    if (tool === 'text' || tool === 'note') {
      // An open box commits on its own blur; this click only closes it.
      if (!typing) setTyping({ at: p, kind: tool, value: '' });
      return;
    }
    svgRef.current?.setPointerCapture?.(e.pointerId);
    if (tool === 'select') {
      const hit = annotationAt(annotations, p.x, p.y, aspect);
      onSelect(hit?.id ?? null);
      if (hit) setGesture({ kind: 'move', origin: hit, from: p, moved: false });
      return;
    }
    if (tool === 'pen' || tool === 'highlight') setGesture({ kind: 'draw', points: [p] });
    else setGesture({ kind: 'drag', from: p, to: p });
  };

  const onMove = (e: ReactPointerEvent) => {
    if (!gesture) return;
    const p = toPt(e);
    if (gesture.kind === 'draw') setGesture({ kind: 'draw', points: [...gesture.points, p] });
    else if (gesture.kind === 'drag') setGesture({ ...gesture, to: p });
    else {
      onUpdate(moveAnnotation(gesture.origin, p.x - gesture.from.x, p.y - gesture.from.y, aspect));
      if (!gesture.moved) setGesture({ ...gesture, moved: true });
    }
  };

  const onUp = () => {
    const g = gesture;
    setGesture(null);
    if (!g || !tool) return;
    if (g.kind === 'draw' && g.points.length > 1 && (tool === 'pen' || tool === 'highlight')) {
      const strokeWidth = tool === 'highlight' ? HIGHLIGHT_STROKE : DEFAULT_STROKE;
      onAdd({ id: annotationId(), kind: tool, points: g.points, dx: 0, dy: 0, color, strokeWidth, bounds: pointsBounds(g.points, strokeWidth) });
    } else if (g.kind === 'drag') {
      if (tool === 'arrow') {
        if (Math.hypot(g.to.x - g.from.x, g.to.y - g.from.y) < 0.01) return;
        onAdd({ id: annotationId(), kind: 'arrow', x1: g.from.x, y1: g.from.y, x2: g.to.x, y2: g.to.y, color, strokeWidth: DEFAULT_STROKE });
      } else if (tool === 'rect' || tool === 'ellipse') {
        const r = dragRect(g.from.x, g.from.y, g.to.x, g.to.y);
        if (r.w < 0.01 || r.h < 0.01) return;
        onAdd({ id: annotationId(), kind: tool, ...r, color, strokeWidth: DEFAULT_STROKE });
      }
    }
  };

  // In-progress previews reuse the real renderer, so what you draw is what you get.
  const preview: Annotation | null =
    gesture?.kind === 'draw' && (tool === 'pen' || tool === 'highlight')
      ? {
          id: 'preview',
          kind: tool,
          points: gesture.points,
          dx: 0,
          dy: 0,
          color,
          strokeWidth: tool === 'highlight' ? HIGHLIGHT_STROKE : DEFAULT_STROKE,
          bounds: { x: 0, y: 0, w: 0, h: 0 },
        }
      : gesture?.kind === 'drag' && tool === 'arrow'
      ? { id: 'preview', kind: 'arrow', x1: gesture.from.x, y1: gesture.from.y, x2: gesture.to.x, y2: gesture.to.y, color, strokeWidth: DEFAULT_STROKE }
      : gesture?.kind === 'drag' && (tool === 'rect' || tool === 'ellipse')
      ? { id: 'preview', kind: tool, ...dragRect(gesture.from.x, gesture.from.y, gesture.to.x, gesture.to.y), color, strokeWidth: DEFAULT_STROKE }
      : null;

  const selected = selectedId ? annotations.find((a) => a.id === selectedId) : undefined;
  const sel = selected ? annotationBounds(selected, aspect) : null;

  return (
    <div className="absolute inset-0" style={{ pointerEvents: tool ? 'auto' : 'none' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0 touch-none"
        style={{ cursor: tool === 'select' ? 'default' : tool ? 'crosshair' : undefined }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        role={tool ? 'application' : undefined}
        aria-label={tool ? 'Annotation canvas' : undefined}
        data-testid="annotation-layer"
      >
        {annotations.map((a) => (
          <Shape key={a.id} a={a} w={width} h={height} aspect={aspect} />
        ))}
        {preview && <Shape a={preview} w={width} h={height} aspect={aspect} />}
        {sel && tool === 'select' && (
          <rect
            x={sel.x * width - 3}
            y={sel.y * height - 3}
            width={sel.w * width + 6}
            height={sel.h * height + 6}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeDasharray="5 3"
          />
        )}
      </svg>
      {typing && (
        <textarea
          autoFocus
          aria-label={typing.kind === 'note' ? 'Note text' : 'Annotation text'}
          className="absolute min-w-[8rem] resize rounded border border-primary bg-card p-1 text-body-sm text-foreground shadow"
          style={{ left: typing.at.x * width, top: typing.at.y * height }}
          value={typing.value}
          onChange={(e) => setTyping({ ...typing, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitText();
            }
            if (e.key === 'Escape') setTyping(null);
          }}
        />
      )}
    </div>
  );
};
