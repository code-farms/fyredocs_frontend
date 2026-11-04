// NOTE: ported from fyredocs_app/src/lib/annotate/__tests__/annotationsJson.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach } from 'vitest';
/**
 * Pins the annotation JSON codec: round-trips for every kind, defensive
 * parsing of corrupt/hostile blobs (drafts, exports, and /FyreAnnot all
 * flow through here — a bad blob must degrade, never crash).
 */

import {
  parseAnnotation,
  parseDocument,
  parsePage,
  serializeAnnotation,
  serializeDocument,
  serializePage,
} from '@/lib/annotate/annotationsJson';
import type { Annotation } from '@/lib/annotate/model';

const SAMPLES: Annotation[] = [
  {
    kind: 'pen',
    id: 'a1',
    points: [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.15 },
    ],
    dx: 0.01,
    dy: 0,
    color: '#D43C3C',
    strokeWidth: 0.006,
    bounds: { x: 0.1, y: 0.1, w: 0.11, h: 0.06 },
  },
  {
    kind: 'highlight',
    id: 'a2',
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
  { kind: 'underline', id: 'a3', x1: 0.1, y1: 0.5, x2: 0.4, y2: 0.5, color: '#000000', strokeWidth: 0.004 },
  { kind: 'arrow', id: 'a4', x1: 0.1, y1: 0.6, x2: 0.4, y2: 0.7, color: '#000000', strokeWidth: 0.006 },
  { kind: 'rect', id: 'a5', x: 0.1, y: 0.1, w: 0.2, h: 0.1, color: '#3C7DD4', strokeWidth: 0.006 },
  { kind: 'ellipse', id: 'a6', x: 0.4, y: 0.4, w: 0.2, h: 0.2, color: '#3C7DD4', strokeWidth: 0.006 },
  { kind: 'text', id: 'a7', x: 0.2, y: 0.2, text: 'Hello', color: '#000000', fontScale: 0.035 },
  { kind: 'note', id: 'a8', x: 0.5, y: 0.5, text: 'A note', color: '#000000', fontScale: 0.035 },
  { kind: 'stamp', id: 'a9', x: 0.3, y: 0.8, text: 'APPROVED', color: '#D43C3C', fontScale: 0.035 },
  { kind: 'date', id: 'a10', x: 0.6, y: 0.8, text: '2026-08-10', color: '#000000', fontScale: 0.035 },
  { kind: 'signature', id: 'a11', x: 0.1, y: 0.85, w: 0.3, aspect: 0.4, sigRelPath: 'signatures/s1.png' },
  { kind: 'blur', id: 'a12', x: 0.2, y: 0.2, w: 0.1, h: 0.05 },
  { kind: 'redact', id: 'a13', x: 0.5, y: 0.2, w: 0.1, h: 0.05 },
];

describe('Phase 7 optional fields (opacity, rotation)', () => {
  // Both were added as OPTIONAL precisely so no schema bump was needed —
  // these three tests are what that claim rests on.
  it('round-trips when present', () => {
    const withInk: Annotation[] = [
      { kind: 'rect', id: 'o1', x: 0.1, y: 0.1, w: 0.2, h: 0.1, color: '#3C7DD4', strokeWidth: 0.006, opacity: 0.42 },
      {
        kind: 'signature',
        id: 'o2',
        x: 0.1,
        y: 0.85,
        w: 0.3,
        aspect: 0.4,
        sigRelPath: 'signatures/s1.png',
        rotation: 37.5,
      },
    ];
    expect(parsePage(serializePage(withInk))).toEqual(withInk);
  });

  it('still parses annotations written before they existed', () => {
    // Verbatim pre-Phase-7 shapes: no opacity, no rotation anywhere.
    expect(parsePage(serializePage(SAMPLES))).toEqual(SAMPLES);
  });

  it('rejects out-of-range values rather than storing nonsense', () => {
    const bad = JSON.stringify({
      v: 1,
      a: [
        { kind: 'rect', id: 'b1', x: 0, y: 0, w: 0.1, h: 0.1, color: '#000000', strokeWidth: 0.006, opacity: 5 },
        { kind: 'rect', id: 'b2', x: 0, y: 0, w: 0.1, h: 0.1, color: '#000000', strokeWidth: 0.006, opacity: -1 },
        { kind: 'rect', id: 'b3', x: 0, y: 0, w: 0.1, h: 0.1, color: '#000000', strokeWidth: 0.006, opacity: 'half' },
        { kind: 'signature', id: 'b4', x: 0, y: 0, w: 0.3, aspect: 0.4, sigRelPath: 's.png', rotation: 'sideways' },
      ],
    });
    expect(parsePage(bad)).toEqual([]);
  });
});

describe('page codec', () => {
  it('round-trips every annotation kind', () => {
    expect(parsePage(serializePage(SAMPLES))).toEqual(SAMPLES);
  });

  it('drops invalid entries and unknown kinds, keeps the rest', () => {
    const json = JSON.stringify({
      v: 1,
      a: [SAMPLES[0], { kind: 'sparkle', id: 'x' }, { kind: 'rect', id: 'bad', x: 'no' }, SAMPLES[4]],
    });
    expect(parsePage(json)).toEqual([SAMPLES[0], SAMPLES[4]]);
  });

  it('returns null for corrupt or shape-less input', () => {
    expect(parsePage('not json')).toBeNull();
    expect(parsePage('42')).toBeNull();
    expect(parsePage('{"v":1}')).toBeNull();
  });

  it('rejects non-finite numbers', () => {
    const bad = JSON.stringify({ v: 1, a: [{ ...SAMPLES[4], w: null }] });
    expect(parsePage(bad)).toEqual([]);
  });
});

describe('single-annotation codec (/FyreAnnot)', () => {
  it('round-trips and rejects garbage', () => {
    for (const a of SAMPLES) {
      expect(parseAnnotation(serializeAnnotation(a))).toEqual(a);
    }
    expect(parseAnnotation('{}')).toBeNull();
    expect(parseAnnotation('nope')).toBeNull();
  });
});

describe('document codec (JSON export)', () => {
  it('round-trips a multi-page map', () => {
    const pages = { 0: [SAMPLES[0], SAMPLES[6]], 2: [SAMPLES[4]] };
    expect(parseDocument(serializeDocument(pages))).toEqual(pages);
  });

  it('rejects wrong formats and skips junk pages', () => {
    expect(parseDocument(JSON.stringify({ format: 'other', v: 1, pages: {} }))).toBeNull();
    const messy = JSON.stringify({
      format: 'fyredocs-annotations',
      v: 1,
      pages: { '-1': [SAMPLES[0]], abc: [SAMPLES[0]], '1': 'nope', '3': [SAMPLES[4]] },
    });
    expect(parseDocument(messy)).toEqual({ 3: [SAMPLES[4]] });
  });
});
