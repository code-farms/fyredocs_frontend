/**
 * Zod validation for each tool's options panel — the UI-side gate before a job is
 * submitted.
 *
 * This is one half of a contract with normalizeOptions() in src/hooks/useJob.ts:
 * this file decides what the USER may enter, that function decides what the
 * BACKEND receives. Neither checks the other, and the backend accepts free-form
 * JSON per tool, so a field added on one side and not the other fails silently —
 * either validated and then dropped, or sent and then ignored. Adding or renaming
 * an option means touching both.
 *
 * superRefine is used where a field's validity depends on another field (a page
 * range against a page count, for example), which a per-field schema cannot
 * express.
 *
 * Validation failures here surface inline next to the field, never as a toast —
 * toasts are reserved for async outcomes (see DESIGN.md and src/lib/toast.ts).
 */
import { z } from 'zod';
import { OptionsPanelId } from '@/types';

/**
 * Zod schema + default values per options panel. The workbench builds its
 * react-hook-form instance from these, then merges `tool.defaultOptions` on top.
 *
 * IMPORTANT: the resulting form values must match the shapes expected by
 * `normalizeOptions()` in src/hooks/useJob.ts — that function is the contract
 * with the backend and must not change.
 */

export const PANEL_SCHEMAS: Record<OptionsPanelId, z.ZodTypeAny> = {
  split: z
    .object({
      mode: z.enum(['all', 'range', 'extract', 'equal']),
      range: z.string().optional(),
      span: z.coerce.number().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.mode === 'range' && !value.range?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['range'],
          message: 'Please enter a page range',
        });
      }
      if (value.mode === 'extract' && (!value.span || value.span < 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['span'],
          message: 'Please enter a valid page count per chunk',
        });
      }
      if (value.mode === 'equal' && (!value.span || value.span < 2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['span'],
          message: 'Please enter at least 2 parts',
        });
      }
    }),

  compress: z.object({
    quality: z.enum(['low', 'medium', 'high', 'extreme']),
  }),

  ocr: z.object({
    language: z.string().min(1, 'Please select a language'),
    dpi: z.string().optional(),
  }),

  rotate: z.object({
    rotation: z.coerce.number().refine((v) => [90, 180, 270].includes(v), {
      message: 'Rotation must be 90, 180 or 270 degrees',
    }),
    applyToPages: z.enum(['all', 'odd', 'even']),
  }),

  watermark: z
    .object({
      type: z.enum(['text', 'image']),
      text: z.string().optional(),
      imageData: z.string().optional(),
      position: z.enum(['center', 'diagonal', 'tiled']),
      opacity: z.coerce.number().min(10).max(100),
      fontSize: z.coerce.number().min(12).max(120).optional(),
      scale: z.coerce.number().min(10).max(100).optional(),
      color: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.type === 'text' && !value.text?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['text'],
          message: 'Watermark text is required',
        });
      }
      if (value.type === 'image' && !value.imageData) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['imageData'],
          message: 'Please upload a watermark image',
        });
      }
    }),

  'page-selection': z.object({
    pages: z.string().trim().min(1, 'Please enter page numbers'),
  }),

  reorder: z.object({
    order: z.string().trim().min(1, 'Please enter the new page order'),
  }),

  // Either password may be empty, but not both: an empty open password with a
  // permissions password yields a PDF that opens freely yet stays restricted.
  // 4–128 mirrors validateProtectOptions in job-service/handlers/tool_options.go.
  password: z
    .object({
      password: z.string(),
      confirmPassword: z.string(),
      ownerPassword: z.string(),
      allowPrint: z.boolean(),
      allowCopy: z.boolean(),
      allowModify: z.boolean(),
      allowAnnotate: z.boolean(),
      allowAssemble: z.boolean(),
      encryption: z.enum(['aes-256', 'aes-128', 'rc4-128']),
    })
    .superRefine((value, ctx) => {
      const lengthIssue = (pw: string) =>
        pw.length < 4 ? 'Password must be at least 4 characters'
          : pw.length > 128 ? 'Password must be at most 128 characters'
          : null;
      if (!value.password && !value.ownerPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Enter an open password or a permissions password',
        });
        return;
      }
      if (value.password) {
        const issue = lengthIssue(value.password);
        if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: issue });
      }
      if (value.password !== value.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmPassword'],
          message: 'Passwords do not match',
        });
      }
      if (value.ownerPassword) {
        const issue = lengthIssue(value.ownerPassword);
        if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ownerPassword'], message: issue });
      }
    }),

  unlock: z.object({
    password: z.string().min(1, 'Please enter the document password'),
  }),

  'page-numbers': z.object({
    position: z.string().min(1),
    startNumber: z.coerce.number().min(1, 'Start number must be at least 1'),
    fontSize: z.coerce.number().min(8, 'Font size must be 8–48').max(48, 'Font size must be 8–48'),
    format: z.string().min(1),
  }),

  scan: z.object({
    ocr: z.boolean(),
    language: z.string().min(1),
  }),

  'convert-info': z.object({}),
};

export const PANEL_DEFAULTS: Record<OptionsPanelId, Record<string, unknown>> = {
  split: { mode: 'all', range: '', span: 2 },
  compress: { quality: 'medium' },
  ocr: { language: 'eng', dpi: '' },
  rotate: { rotation: 90, applyToPages: 'all' },
  watermark: {
    type: 'text',
    text: 'CONFIDENTIAL',
    imageData: '',
    position: 'diagonal',
    opacity: 50,
    fontSize: 48,
    scale: 30,
    color: '#6366f1',
  },
  'page-selection': { pages: '' },
  reorder: { order: '' },
  password: {
    password: '',
    confirmPassword: '',
    ownerPassword: '',
    allowPrint: true,
    allowCopy: false,
    allowModify: false,
    allowAnnotate: false,
    allowAssemble: false,
    encryption: 'aes-256',
  },
  unlock: { password: '' },
  'page-numbers': { position: 'bc', startNumber: 1, fontSize: 12, format: '{n}' },
  scan: { ocr: false, language: 'eng' },
  'convert-info': {},
};

/**
 * Shared OCR language list (OcrTool/ScanToPdfTool used the same values).
 * Values are tesseract codes sent unchanged — job-service's allowlists accept
 * only eng, hin and the eng+hin mixed mode, so a 2-letter code would 400.
 */
export const OCR_LANGUAGES = [
  { value: 'eng', label: 'English' },
  { value: 'hin', label: 'Hindi' },
  { value: 'eng+hin', label: 'English + Hindi' },
] as const;
