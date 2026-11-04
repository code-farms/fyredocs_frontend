// NOTE: ported from fyredocs_app/src/lib/ai/__tests__/parse.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
/// <reference types="jest" />
import {
  flashcardsToMarkdown,
  isFlashcardsMarkdown,
  parseCitations,
  parseFlashcards,
  parseList,
} from './../parse';

describe('parseCitations', () => {
  it('splits text and 0-based citation chips', () => {
    const r = parseCitations('Revenue grew [p.3] and costs fell [p 5].');
    expect(r.segments).toEqual([
      { type: 'text', text: 'Revenue grew ' },
      { type: 'cite', pageIndex: 2, label: 'p.3' },
      { type: 'text', text: ' and costs fell ' },
      { type: 'cite', pageIndex: 4, label: 'p.5' },
      { type: 'text', text: '.' },
    ]);
    expect(r.pageIndices).toEqual([2, 4]);
  });

  it('expands ranges and lists, dedupes pages', () => {
    expect(parseCitations('x [pp. 2-4] y [p.3, p.7] z [page 7]').pageIndices).toEqual([1, 2, 3, 6]);
  });

  it('leaves hallucinated pages beyond pageCount as plain text', () => {
    const r = parseCitations('see [p.99]', 10);
    expect(r.pageIndices).toEqual([]);
    expect(r.segments).toEqual([{ type: 'text', text: 'see [p.99]' }]);
  });

  it('ignores non-citation brackets and absurd ranges', () => {
    expect(parseCitations('[note] [p.0] [p.1-900]').pageIndices).toEqual([]);
  });
});

describe('parseList', () => {
  it('reads dash, star, bullet, numbered and checkbox items', () => {
    expect(parseList('Intro\n- a\n* b\n• c\n1. d\n2) e\n[ ] f')).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('folds indented continuation lines', () => {
    expect(parseList('- first\n  continued\n- second')).toEqual(['first continued', 'second']);
  });

  it('falls back to non-empty lines when the model ignored the format', () => {
    expect(parseList('# Heading\nOne thing\n\nAnother')).toEqual(['One thing', 'Another']);
  });
});

describe('parseFlashcards', () => {
  it('accepts JSON (fenced or bare) with common key names', () => {
    expect(parseFlashcards('```json\n[{"q":"A?","a":"B"},{"question":"C?","answer":"D"},{"x":1}]\n```')).toEqual([
      { front: 'A?', back: 'B' },
      { front: 'C?', back: 'D' },
    ]);
  });

  it('parses Q:/A: blocks with bold labels and multi-line answers', () => {
    const text = '**Q:** What is X?\n**A:** It is Y.\nAlso Z.\n\nQ2: Lonely question\n\nQuestion: Last?\nAnswer: Yes';
    expect(parseFlashcards(text)).toEqual([
      { front: 'What is X?', back: 'It is Y.\nAlso Z.' },
      { front: 'Last?', back: 'Yes' },
    ]);
  });

  it('round-trips through the saved markdown codec', () => {
    const cards = [
      { front: 'One?', back: 'Uno' },
      { front: 'Two?', back: 'Dos\nmore' },
    ];
    const md = flashcardsToMarkdown('Spanish', cards);
    expect(isFlashcardsMarkdown(md)).toBe(true);
    expect(isFlashcardsMarkdown('# notes')).toBe(false);
    expect(parseFlashcards(md)).toEqual(cards);
  });
});
