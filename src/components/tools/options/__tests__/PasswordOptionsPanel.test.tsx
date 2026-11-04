import { describe, it, expect } from 'vitest';
import { useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordOptionsPanel } from '../PasswordOptionsPanel';
import { PANEL_DEFAULTS } from '../schemas';
import { buildOptions } from '../../workbench/buildOptions';
import { getAllTools } from '@/config/tools';
import type { OptionsFormValues } from '../types';
import type { OptionsPanelProps } from '../types';

const tool = getAllTools().find((t) => t.id === 'password-protect')!;
let latest: OptionsFormValues = {};

const Harness = () => {
  const form = useForm<OptionsFormValues>({ defaultValues: { ...PANEL_DEFAULTS.password } });
  latest = form.watch();
  return <PasswordOptionsPanel {...({ tool, form, files: [], pageCount: null } as unknown as OptionsPanelProps)} />;
};

describe('PasswordOptionsPanel', () => {
  it('renders the five permission switches with print on by default', () => {
    render(<Harness />);
    const print = screen.getByRole('switch', { name: 'Allow printing' });
    expect(print).toHaveAttribute('aria-checked', 'true');
    for (const name of [
      'Allow copying text and images',
      'Allow editing',
      'Allow comments and form filling',
      'Allow inserting, rotating and deleting pages',
    ]) {
      expect(screen.getByRole('switch', { name })).toHaveAttribute('aria-checked', 'false');
    }
    expect(screen.getByLabelText('Permissions password (optional)')).toBeInTheDocument();
    expect(screen.getByText(/Permissions are advisory/)).toBeInTheDocument();
  });

  it('feeds toggles and the permissions password into the job options', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('switch', { name: 'Allow copying text and images' }));
    await user.click(screen.getByRole('switch', { name: 'Allow printing' }));
    await user.type(screen.getByLabelText('Permissions password (optional)'), 'owner1234');

    expect(buildOptions(tool, latest, ['f1'])).toMatchObject({
      ownerPassword: 'owner1234',
      permissions: { allowPrint: false, allowCopy: true, allowModify: false },
      encryption: 'aes-256',
    });
  });
});
