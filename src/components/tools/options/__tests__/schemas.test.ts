import { describe, it, expect } from 'vitest';
import { OCR_LANGUAGES, PANEL_DEFAULTS } from '../schemas';

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
