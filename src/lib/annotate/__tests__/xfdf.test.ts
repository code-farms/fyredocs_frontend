// NOTE: ported from fyredocs_app/src/lib/annotate/__tests__/xfdf.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach } from 'vitest';
/**
 * Pins the XFDF exporter's shape, the import(export(x)) round-trip per
 * kind (geometry approximate — coordinates survive; ids are re-minted by
 * design), and the hand-rolled parser's tolerance for entities, comments,
 * unknown elements, and junk.
 */

import { exportXfdf, importXfdf, parseXml } from '@/lib/annotate/xfdf';
import type { Annotation } from '@/lib/annotate/model';
import type { PageGeom } from '@/lib/annotate/pageSpace';

const GEOMS: PageGeom[] = [
  { mediaBox: { x: 0, y: 0, width: 400, height: 600 }, rotation: 0 },
  { mediaBox: { x: 0, y: 0, width: 400, height: 600 }, rotation: 90 },
];

const PEN: Annotation = {
  kind: 'pen',
  id: 'p1',
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.2, y: 0.15 },
  ],
  dx: 0,
  dy: 0,
  color: '#D43C3C',
  strokeWidth: 0.006,
  bounds: { x: 0.097, y: 0.097, w: 0.106, h: 0.056 },
};

const SAMPLES: Annotation[] = [
  PEN,
  {
    kind: 'highlight',
    id: 'h1',
    points: [
      { x: 0.3, y: 0.3 },
      { x: 0.5, y: 0.3 },
    ],
    dx: 0,
    dy: 0,
    color: '#F2C53D',
    strokeWidth: 0.035,
    bounds: { x: 0.28, y: 0.28, w: 0.24, h: 0.04 },
  },
  { kind: 'underline', id: 'u1', x1: 0.1, y1: 0.5, x2: 0.4, y2: 0.5, color: '#000000', strokeWidth: 0.004 },
  { kind: 'arrow', id: 'a1', x1: 0.1, y1: 0.6, x2: 0.4, y2: 0.7, color: '#3C7DD4', strokeWidth: 0.006 },
  { kind: 'rect', id: 'r1', x: 0.1, y: 0.2, w: 0.3, h: 0.1, color: '#3C7DD4', strokeWidth: 0.006 },
  { kind: 'text', id: 't1', x: 0.2, y: 0.2, text: 'Hello <&> "world"', color: '#000000', fontScale: 0.035 },
  { kind: 'note', id: 'n1', x: 0.5, y: 0.5, text: 'A note', color: '#000000', fontScale: 0.035 },
  { kind: 'stamp', id: 's1', x: 0.3, y: 0.8, text: 'APPROVED', color: '#D43C3C', fontScale: 0.035 },
];

describe('exportXfdf', () => {
  it('emits the XFDF envelope with one element per annotation', () => {
    const xml = exportXfdf({ 0: SAMPLES }, GEOMS);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('xmlns="http://ns.adobe.com/xfdf/"');
    for (const el of ['<ink ', '<highlight ', '<underline ', '<line ', '<square ', '<freetext ', '<text ', '<stamp ']) {
      expect(xml).toContain(el);
    }
    expect(xml).toContain('Hello &lt;&amp;&gt; &quot;world&quot;');
  });

  it('skips blur/redact and turns signatures into bare stamps', () => {
    const xml = exportXfdf(
      {
        0: [
          { kind: 'blur', id: 'b1', x: 0.1, y: 0.1, w: 0.2, h: 0.1 },
          { kind: 'redact', id: 'rd1', x: 0.3, y: 0.1, w: 0.2, h: 0.1 },
          { kind: 'signature', id: 'sg1', x: 0.1, y: 0.8, w: 0.3, aspect: 0.4, sigRelPath: 'signatures/x.png' },
        ],
      },
      GEOMS
    );
    expect(xml).not.toContain('blur');
    expect(xml).not.toContain('redact');
    expect(xml).toContain('<stamp ');
    expect(xml).toContain('Signature');
  });
});

describe('import(export(x)) round-trip', () => {
  it('preserves kinds and geometry (fresh ids by design)', () => {
    const xml = exportXfdf({ 0: SAMPLES, 1: [PEN] }, GEOMS);
    const back = importXfdf(xml, GEOMS);
    expect(back).not.toBeNull();
    expect(back![0].map((a) => a.kind)).toEqual([
      'pen',
      'highlight',
      'underline',
      'arrow',
      'rect',
      'text',
      'note',
      'stamp',
    ]);
    expect(back![1]).toHaveLength(1);

    const pen = back![0][0];
    if (pen.kind !== 'pen') throw new Error('expected pen');
    expect(pen.points[0].x).toBeCloseTo(0.1, 3);
    expect(pen.points[1].y).toBeCloseTo(0.15, 3);
    expect(pen.color).toBe('#D43C3C');
    expect(pen.id).not.toBe('p1');

    const arrow = back![0][3];
    if (arrow.kind !== 'arrow') throw new Error('expected arrow');
    expect(arrow.x2).toBeCloseTo(0.4, 3);
    expect(arrow.y2).toBeCloseTo(0.7, 3);

    const text = back![0][5];
    if (text.kind !== 'text') throw new Error('expected text');
    expect(text.text).toBe('Hello <&> "world"');
    expect(text.fontScale).toBeCloseTo(0.035, 3);

    const rotatedPen = back![1][0];
    if (rotatedPen.kind !== 'pen') throw new Error('expected pen');
    expect(rotatedPen.points[0].x).toBeCloseTo(0.1, 3);
    expect(rotatedPen.points[0].y).toBeCloseTo(0.1, 3);
  });
});

describe('parser tolerance', () => {
  it('handles comments, unknown elements, entities, and single quotes', () => {
    const xml = `<?xml version="1.0"?>
      <!-- a comment -->
      <xfdf xmlns="http://ns.adobe.com/xfdf/">
        <weird><nested/></weird>
        <annots>
          <sparkle page="0" rect="0,0,9,9"/>
          <square page='0' rect='40,420,160,480' color="#3C7DD4" width="2.4"/>
          <text page="0" rect="10,570,30,590" color="#000000"><contents>caf&#233; &amp; more</contents></text>
        </annots>
      </xfdf>`;
    const back = importXfdf(xml, GEOMS);
    expect(back).not.toBeNull();
    expect(back![0].map((a) => a.kind)).toEqual(['rect', 'note']);
    const note = back![0][1];
    if (note.kind !== 'note') throw new Error('expected note');
    expect(note.text).toBe('café & more');
  });

  it('rejects junk and XFDF-less XML', () => {
    expect(importXfdf('not xml at all', GEOMS)).toBeNull();
    expect(importXfdf('<html><body/></html>', GEOMS)).toBeNull();
    expect(parseXml('')).toBeNull();
  });

  it('skips annotations on unknown pages', () => {
    const xml = exportXfdf({ 0: [PEN] }, GEOMS).replace('page="0"', 'page="7"');
    expect(importXfdf(xml, GEOMS)).toEqual({});
  });
});
