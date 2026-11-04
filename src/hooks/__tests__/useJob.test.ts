import { describe, it, expect } from 'vitest';
import { normalizeOptions } from '../useJob';

describe('normalizeOptions', () => {
  describe('split', () => {
    it('returns mode "all" when mode is "all"', () => {
      const result = normalizeOptions('split', { mode: 'all', range: '' });
      expect(result).toEqual({ mode: 'all', range: 'all' });
    });

    it('returns mode and range when mode is "range"', () => {
      const result = normalizeOptions('split', { mode: 'range', range: '1-3,5' });
      expect(result).toEqual({ mode: 'range', range: '1-3,5' });
    });

    it('throws when range mode has empty range', () => {
      expect(() => normalizeOptions('split', { mode: 'range', range: '' })).toThrow(
        'Page range is required'
      );
    });
  });

  describe('remove-pages', () => {
    it('returns pages specification', () => {
      const result = normalizeOptions('remove-pages', { pages: '2,4,6-8' });
      expect(result).toEqual({ pages: '2,4,6-8' });
    });

    it('trims whitespace from pages', () => {
      const result = normalizeOptions('remove-pages', { pages: '  1,3  ' });
      expect(result).toEqual({ pages: '1,3' });
    });

    it('throws when pages is empty', () => {
      expect(() => normalizeOptions('remove-pages', { pages: '' })).toThrow(
        'Page selection is required'
      );
    });
  });

  describe('extract-pages', () => {
    it('returns pages specification', () => {
      const result = normalizeOptions('extract-pages', { pages: '1-3,5' });
      expect(result).toEqual({ pages: '1-3,5' });
    });

    it('throws when pages is empty', () => {
      expect(() => normalizeOptions('extract-pages', { pages: '  ' })).toThrow(
        'Page selection is required'
      );
    });
  });

  describe('scan-to-pdf', () => {
    it('returns undefined when ocr is false', () => {
      const result = normalizeOptions('scan-to-pdf', { ocr: false });
      expect(result).toBeUndefined();
    });

    it('returns ocr true when ocr is enabled without language', () => {
      const result = normalizeOptions('scan-to-pdf', { ocr: true });
      expect(result).toEqual({ ocr: true });
    });

    it('sends page size and per-page clean-up without OCR', () => {
      const pages = [{ cleanup: { shadows: true } }, { cleanup: { shadows: true } }];
      const result = normalizeOptions('scan-to-pdf', { ocr: false, pageSize: 'card', pages });
      expect(result).toEqual({ pageSize: 'card', pages });
    });

    it('drops the auto page size, which is the backend default', () => {
      expect(normalizeOptions('scan-to-pdf', { ocr: false, pageSize: 'auto' })).toBeUndefined();
    });

    it('returns ocr and language when both provided', () => {
      const result = normalizeOptions('scan-to-pdf', { ocr: true, language: 'hin' });
      expect(result).toEqual({ ocr: true, language: 'hin' });
    });
  });

  describe('compress', () => {
    it('returns quality option', () => {
      const result = normalizeOptions('compress', { quality: 'high' });
      expect(result).toEqual({ quality: 'high' });
    });

    it('defaults to ebook quality', () => {
      const result = normalizeOptions('compress', {});
      expect(result).toEqual({ quality: 'ebook' });
    });
  });

  describe('ocr', () => {
    it('returns language and dpi', () => {
      const result = normalizeOptions('ocr', { language: 'eng+hin', dpi: '600' });
      expect(result).toEqual({ language: 'eng+hin', dpi: '600' });
    });

    it('defaults to eng with no dpi when not specified', () => {
      const result = normalizeOptions('ocr', {});
      expect(result).toEqual({ language: 'eng' });
    });
  });

  describe('reorder', () => {
    it('returns order string', () => {
      const result = normalizeOptions('reorder', { order: '3,1,2' });
      expect(result).toEqual({ order: '3,1,2' });
    });

    it('throws when order is empty', () => {
      expect(() => normalizeOptions('reorder', { order: '' })).toThrow(
        'Page order is required'
      );
    });
  });

  describe('password-protect', () => {
    it('returns password', () => {
      const result = normalizeOptions('password-protect', { password: 'secret123' });
      expect(result).toEqual({ password: 'secret123' });
    });

    it('throws when password is empty', () => {
      expect(() => normalizeOptions('password-protect', {})).toThrow(
        'Password is required'
      );
    });

    const permissions = {
      allowPrint: true,
      allowCopy: false,
      allowModify: false,
      allowAnnotate: true,
      allowAssemble: false,
    };

    it('keeps the legacy shape when no distinct permissions password is set', () => {
      const result = normalizeOptions('password-protect', {
        password: 'open1234',
        confirmPassword: 'open1234',
        ownerPassword: '',
        permissions,
        encryption: 'aes-128',
      });
      expect(result).toEqual({ password: 'open1234', permissions, encryption: 'aes-128' });
    });

    it('treats an owner password equal to the open password as the legacy shape', () => {
      const result = normalizeOptions('password-protect', { password: 'same1234', ownerPassword: 'same1234' });
      expect(result).toEqual({ password: 'same1234' });
    });

    it('sends the split shape for a distinct permissions password, never the legacy key', () => {
      const result = normalizeOptions('password-protect', {
        password: 'open1234',
        ownerPassword: 'owner1234',
        permissions,
      }) as Record<string, unknown>;
      expect(result).toEqual({ userPassword: 'open1234', ownerPassword: 'owner1234', permissions });
      expect(result).not.toHaveProperty('password');
    });

    it('allows a permissions-only PDF with no open password', () => {
      const result = normalizeOptions('password-protect', { password: '', ownerPassword: 'owner1234' });
      expect(result).toEqual({ ownerPassword: 'owner1234' });
    });
  });

  describe('rotate', () => {
    it('returns rotation and applyToPages', () => {
      const result = normalizeOptions('rotate', { rotation: 90, applyToPages: '1,3' });
      expect(result).toEqual({ rotation: 90, applyToPages: '1,3' });
    });

    it('defaults applyToPages to all', () => {
      const result = normalizeOptions('rotate', { rotation: 180 });
      expect(result).toEqual({ rotation: 180, applyToPages: 'all' });
    });

    it('throws when rotation is missing', () => {
      expect(() => normalizeOptions('rotate', {})).toThrow('Rotation angle is required');
    });
  });

  describe('tools with no options', () => {
    const noOptionTools = [
      'merge',
      'repair-pdf',
      'pdf-to-word',
      'pdf-to-excel',
      'pdf-to-image',
      'pdf-to-ppt',
      'pdf-to-html',
      'pdf-to-text',
      'pdf-to-pdfa',
      'word-to-pdf',
      'excel-to-pdf',
      'image-to-pdf',
      'powerpoint-to-pdf',
      'html-to-pdf',
    ] as const;

    it.each(noOptionTools)('%s returns undefined', (toolId) => {
      const result = normalizeOptions(toolId, {});
      expect(result).toBeUndefined();
    });
  });

  describe('null/undefined options', () => {
    it('returns undefined for null options', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = normalizeOptions('merge', null as any);
      expect(result).toBeUndefined();
    });
  });
});
