import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnotationLayer, type AnnotateTool } from '../AnnotationLayer';
import type { Annotation } from '@/lib/annotate/model';

beforeAll(() => {
  // jsdom has no PointerEvent; MouseEvent carries the clientX/Y we need.
  if (!('PointerEvent' in window)) (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = MouseEvent as never;
});

const setup = (tool: AnnotateTool | null, annotations: Annotation[] = []) => {
  const props = { onAdd: vi.fn(), onUpdate: vi.fn(), onSelect: vi.fn() };
  render(
    <AnnotationLayer width={600} height={800} annotations={annotations} tool={tool} color="#d43c3c" selectedId={null} {...props} />
  );
  return { ...props, svg: screen.getByTestId('annotation-layer') };
};
const drag = (el: Element, from: [number, number], to: [number, number]) => {
  fireEvent.pointerDown(el, { clientX: from[0], clientY: from[1], pointerId: 1 });
  fireEvent.pointerMove(el, { clientX: (from[0] + to[0]) / 2, clientY: (from[1] + to[1]) / 2, pointerId: 1 });
  fireEvent.pointerMove(el, { clientX: to[0], clientY: to[1], pointerId: 1 });
  fireEvent.pointerUp(el, { clientX: to[0], clientY: to[1], pointerId: 1 });
};

describe('AnnotationLayer', () => {
  it('draws a rectangle in normalized page coordinates', () => {
    const { svg, onAdd } = setup('rect');
    drag(svg, [60, 80], [300, 400]);
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rect', x: 0.1, y: 0.1, w: 0.4, h: 0.4, color: '#d43c3c' }));
  });

  it('records a pen stroke and ignores a tap', () => {
    const { svg, onAdd } = setup('pen');
    fireEvent.pointerDown(svg, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(onAdd).not.toHaveBeenCalled();
    drag(svg, [60, 80], [120, 160]);
    expect(onAdd.mock.calls[0][0]).toMatchObject({ kind: 'pen', dx: 0, dy: 0 });
    expect(onAdd.mock.calls[0][0].points).toHaveLength(3);
  });

  it('adds text where you click', async () => {
    const { svg, onAdd } = setup('text');
    fireEvent.pointerDown(svg, { clientX: 300, clientY: 400, pointerId: 1 });
    await userEvent.type(screen.getByRole('textbox', { name: 'Annotation text' }), 'Sign here{Enter}');
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ kind: 'text', x: 0.5, y: 0.5, text: 'Sign here' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('selects and moves an existing mark', () => {
    const box: Annotation = { id: 'b', kind: 'rect', x: 0.1, y: 0.1, w: 0.2, h: 0.2, color: '#111111', strokeWidth: 0.006 };
    const { svg, onSelect, onUpdate } = setup('select', [box]);
    drag(svg, [120, 160], [180, 160]);
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'b', x: expect.closeTo(0.2, 5), y: 0.1 }));
  });

  it('is display-only without a tool', () => {
    const { svg, onAdd } = setup(null, [{ id: 'b', kind: 'ellipse', x: 0.1, y: 0.1, w: 0.2, h: 0.2, color: '#111111', strokeWidth: 0.006 }]);
    drag(svg, [60, 80], [300, 400]);
    expect(onAdd).not.toHaveBeenCalled();
    expect(svg.querySelector('ellipse')).not.toBeNull();
  });
});
