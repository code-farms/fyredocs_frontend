import { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';

const PERMISSIONS = [
  { key: 'allowPrint', label: 'Allow printing' },
  { key: 'allowCopy', label: 'Allow copying text and images' },
  { key: 'allowModify', label: 'Allow editing' },
  { key: 'allowAnnotate', label: 'Allow comments and form filling' },
  { key: 'allowAssemble', label: 'Allow inserting, rotating and deleting pages' },
] as const;

const ENCRYPTION = [
  { value: 'aes-256', label: 'AES-256 (recommended)' },
  { value: 'aes-128', label: 'AES-128' },
  { value: 'rc4-128', label: 'RC4-128 (legacy viewers only)' },
] as const;

export const PasswordOptionsPanel = ({ form }: OptionsPanelProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const password = (form.watch('password') as string) ?? '';
  const confirmPassword = (form.watch('confirmPassword') as string) ?? '';
  const ownerPassword = (form.watch('ownerPassword') as string) ?? '';
  const encryption = (form.watch('encryption') as string) ?? 'aes-256';
  const errors = form.formState.errors;
  const inputType = showPassword ? 'text' : 'password';

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 text-h4 font-semibold">
        <Lock className="h-5 w-5" aria-hidden />
        Password Protection
      </h3>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="protect-password">Open password</Label>
          <div className="relative">
            <Input
              id="protect-password"
              type={inputType}
              value={password}
              onChange={(e) => form.setValue('password', e.target.value, { shouldValidate: true })}
              placeholder="Enter password..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {errors.password && (
            <p className="text-caption text-destructive">{String(errors.password.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="protect-confirm-password">Confirm Password</Label>
          <Input
            id="protect-confirm-password"
            type={inputType}
            value={confirmPassword}
            onChange={(e) => form.setValue('confirmPassword', e.target.value, { shouldValidate: true })}
            placeholder="Confirm password..."
          />
          {errors.confirmPassword && (
            <p className="text-caption text-destructive">{String(errors.confirmPassword.message)}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h4 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Permissions
        </h4>
        <div className="space-y-3">
          {PERMISSIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={`protect-${key}`}>{label}</Label>
              <Switch
                id={`protect-${key}`}
                checked={Boolean(form.watch(key))}
                onCheckedChange={(checked) => form.setValue(key, checked, { shouldValidate: true })}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="protect-owner-password">Permissions password (optional)</Label>
            <Input
              id="protect-owner-password"
              type={inputType}
              value={ownerPassword}
              onChange={(e) => form.setValue('ownerPassword', e.target.value, { shouldValidate: true })}
              placeholder="Same as open password"
            />
            {errors.ownerPassword && (
              <p className="text-caption text-destructive">{String(errors.ownerPassword.message)}</p>
            )}
            <Text variant="caption" tone="muted">
              Needed to change these permissions later. Leave the open password empty to let anyone open the file
              with these restrictions.
            </Text>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protect-encryption">Encryption</Label>
            <Select
              value={encryption}
              onValueChange={(value) => form.setValue('encryption', value, { shouldValidate: true })}
            >
              <SelectTrigger id="protect-encryption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENCRYPTION.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Text variant="caption" tone="muted">
          Permissions are advisory: compliant viewers honour them, but some tools ignore them. Only the open password
          actually stops someone from opening the file.
        </Text>
      </div>
    </div>
  );
};
