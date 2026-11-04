import { describe, expect, it } from 'vitest';
import { AI_IMAGE_MAX_EDGE, dataUrlBytes, fitScale } from '@/lib/pdf/pageImage';

describe('pageImage helpers', () => {
  it('fits the long side to the AI edge', () => {
    expect(fitScale(612, 792) * 792).toBeCloseTo(AI_IMAGE_MAX_EDGE);
    expect(fitScale(842, 595, 1200) * 842).toBeCloseTo(1200);
    expect(fitScale(0, 100)).toBe(1);
  });

  it('measures decoded data-URL size including padding', () => {
    expect(dataUrlBytes('data:image/jpeg;base64,QUJD')).toBe(3);
    expect(dataUrlBytes('data:image/jpeg;base64,QUI=')).toBe(2);
    expect(dataUrlBytes('data:image/jpeg;base64,QQ==')).toBe(1);
  });
});
