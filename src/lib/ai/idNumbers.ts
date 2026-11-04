// NOTE: ported from fyredocs_app/src/lib/ai/idNumbers.ts — keep in sync.
/**
 * Offline format checks for extracted ID numbers (Phase 23 §5 ID scanner).
 * PURE. A vision model can misread a digit; these catch the misreads the
 * number's own structure can detect, so the Details card can say "check
 * this" instead of presenting a wrong number with confidence.
 *
 * `invalid` means the number cannot be right as read. `valid` means only
 * that its FORMAT is plausible — never that the document is genuine.
 * Subtypes without a public, stable format return null (no claim).
 */

// Verhoeff tables (dihedral group D5) — Aadhaar's check digit scheme.
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export const verhoeffValid = (digits: string): boolean => {
  if (!/^\d+$/.test(digits)) return false;
  let c = 0;
  const rev = digits.split('').reverse();
  for (let i = 0; i < rev.length; i++) c = D[c][P[i % 8][parseInt(rev[i], 10)]];
  return c === 0;
};

export type IdCheck = 'valid' | 'invalid' | null;

/** Aadhaar: 12 digits, first not 0 or 1, Verhoeff check digit.
 *  PAN: 5 letters, 4 digits, 1 letter; the 4th letter is the holder type.
 *  Indian passport: 1 letter + 7 digits. Voter ID (EPIC): 3 letters + 7 digits. */
export const checkIdNumber = (subtype: string | undefined, raw: string): IdCheck => {
  const compact = raw.replace(/[\s-]/g, '').toUpperCase();
  switch (subtype) {
    case 'aadhaar':
      return /^[2-9]\d{11}$/.test(compact) && verhoeffValid(compact) ? 'valid' : 'invalid';
    case 'pan':
      return /^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/.test(compact) ? 'valid' : 'invalid';
    case 'voter_id':
      return /^[A-Z]{3}\d{7}$/.test(compact) ? 'valid' : 'invalid';
    case 'passport':
      // Only the Indian format is checked; other countries' numbers vary.
      return /^[A-Z]\d{7}$/.test(compact) ? 'valid' : null;
    default:
      return null;
  }
};
