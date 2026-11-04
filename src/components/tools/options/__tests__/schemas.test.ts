import { describe, it, expect } from 'vitest';
import { OCR_LANGUAGES, PANEL_DEFAULTS, PANEL_SCHEMAS, SCAN_CLEANUP, SCAN_PAGE_SIZES } from '../schemas';
import { buildOptions } from '../../workbench/buildOptions';
import { getAllTools } from '@/config/tools';

// NOTE: mirrors ocrLanguages/scanLanguages in
// fyredocs_backend/job-service/handlers/tool_options.go — any other value
// is rejected with a 400 before the job is queued.
const BACKEND_ACCEPTED = ['eng', 'hin', 'eng+hin'];

describe('OCR_LANGUAGES', () => {
  it('offers only codes the backend accepts', () => {
    expect(OCR_LANGUAGES.map((l) => l.value)).toEqual(BACKEND_ACCEPTED);
  });

  it('defaults both OCR panels to English', () => {
    expect(PANEL_DEFAULTS.ocr.language).toBe('eng');
    expect(PANEL_DEFAULTS.scan.language).toBe('eng');
  });
});

describe('password schema', () => {
  const base = PANEL_DEFAULTS.password;
  const issues = (values: Record<string, unknown>) => {
    const r = PANEL_SCHEMAS.password.safeParse({ ...base, ...values });
    return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  };

  it('requires an open or a permissions password', () => {
    expect(issues({})).toEqual(['password: Enter an open password or a permissions password']);
  });

  it('accepts a permissions password alone', () => {
    expect(issues({ ownerPassword: 'owner1234' })).toEqual([]);
  });

  it('enforces 4–128 characters on both passwords', () => {
    expect(issues({ password: 'abc', confirmPassword: 'abc' })).toEqual([
      'password: Password must be at least 4 characters',
    ]);
    expect(issues({ ownerPassword: 'x'.repeat(129) })).toEqual([
      'ownerPassword: Password must be at most 128 characters',
    ]);
  });

  it('requires the confirmation to match', () => {
    expect(issues({ password: 'open1234', confirmPassword: 'open12345' })).toEqual([
      'confirmPassword: Passwords do not match',
    ]);
  });

  it('defaults to print-only permissions and AES-256', () => {
    expect(base).toMatchObject({
      allowPrint: true,
      allowCopy: false,
      allowModify: false,
      allowAnnotate: false,
      allowAssemble: false,
      encryption: 'aes-256',
    });
  });
});

describe('scan options', () => {
  const tool = getAllTools().find((t) => t.id === 'scan-to-pdf')!;

  it('offers only page sizes and clean-up keys the backend accepts', () => {
    // NOTE: mirrors scanPageSizes and scanCleanupPayload in job-service/handlers/tool_options.go.
    expect(SCAN_PAGE_SIZES.map((s) => s.value)).toEqual(['auto', 'a4', 'letter', 'id', 'card']);
    expect(SCAN_CLEANUP.map((c) => c.key)).toEqual(['shadows', 'background', 'fingers', 'holes', 'glare', 'auto']);
    expect(PANEL_SCHEMAS.scan.safeParse(PANEL_DEFAULTS.scan).success).toBe(true);
  });

  it('repeats the clean-up once per image, in upload order', () => {
    const values = { ...PANEL_DEFAULTS.scan, pageSize: 'card', cleanShadows: true, cleanGlare: true };
    expect(buildOptions(tool, values, ['a', 'b', 'c'])).toEqual({
      ocr: false,
      language: undefined,
      pageSize: 'card',
      pages: [0, 1, 2].map(() => ({ cleanup: { shadows: true, glare: true } })),
    });
  });

  it('keeps the old payload when nothing new is chosen', () => {
    expect(buildOptions(tool, PANEL_DEFAULTS.scan, ['a'])).toEqual({ ocr: false, language: undefined });
  });
});
