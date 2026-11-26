import { ComponentType } from 'react';
import { OptionsPanelId } from '@/types';
import { OptionsPanelProps } from './types';
import { SplitOptionsPanel } from './SplitOptionsPanel';
import { CompressOptionsPanel } from './CompressOptionsPanel';
import { OcrOptionsPanel } from './OcrOptionsPanel';
import { RotateOptionsPanel } from './RotateOptionsPanel';
import { WatermarkOptionsPanel } from './WatermarkOptionsPanel';
import { PageSelectionPanel } from './PageSelectionPanel';
import { ReorderOptionsPanel } from './ReorderOptionsPanel';
import { PasswordOptionsPanel } from './PasswordOptionsPanel';
import { UnlockOptionsPanel } from './UnlockOptionsPanel';
import { PageNumbersOptionsPanel } from './PageNumbersOptionsPanel';
import { ScanOptionsPanel } from './ScanOptionsPanel';
import { ConvertInfoPanel } from './ConvertInfoPanel';
import { PptModeOptionsPanel } from './PptModeOptionsPanel';

export type { OptionsPanelProps, OptionsFormValues } from './types';
export { PANEL_SCHEMAS, PANEL_DEFAULTS, OCR_LANGUAGES } from './schemas';

/** Registry mapping OptionsPanelId → panel component for the workbench. */
export const OPTIONS_PANELS: Record<OptionsPanelId, ComponentType<OptionsPanelProps>> = {
  split: SplitOptionsPanel,
  compress: CompressOptionsPanel,
  ocr: OcrOptionsPanel,
  rotate: RotateOptionsPanel,
  watermark: WatermarkOptionsPanel,
  'page-selection': PageSelectionPanel,
  reorder: ReorderOptionsPanel,
  password: PasswordOptionsPanel,
  unlock: UnlockOptionsPanel,
  'page-numbers': PageNumbersOptionsPanel,
  scan: ScanOptionsPanel,
  'convert-info': ConvertInfoPanel,
  'pdf-to-ppt': PptModeOptionsPanel,
};
