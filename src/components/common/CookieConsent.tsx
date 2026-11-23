import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CONSENT_OPEN_EVENT,
  acceptAll,
  getCategories,
  hasConsentDecision,
  isConsentRequiredRegion,
  rejectAll,
  setConsent,
} from '@/lib/consent';

/** The banner auto-shows only where consent is legally required (EU/EEA/UK) and no
 * choice has been made yet. Elsewhere ads default on (opt-out) and the banner stays
 * hidden — users can still open preferences via the footer "Cookie settings" link. */
const shouldAutoShow = () => isConsentRequiredRegion() && !hasConsentDecision();

/**
 * GDPR cookie-consent banner. Shows until the user makes a choice; the choice is
 * persisted via @/lib/consent and gates non-essential cookies (future ads /
 * analytics). First-party only, so it runs under the strict CSP. Mounted globally
 * in App.tsx so it covers every route (marketing + authenticated shells).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // First load: show only where consent is required (EU/EEA/UK) and undecided.
  useEffect(() => {
    setVisible(shouldAutoShow());
  }, []);

  // A "Cookie settings" link anywhere (e.g. the footer) can reopen the preferences.
  useEffect(() => {
    const reopen = () => {
      const current = getCategories();
      setAnalytics(current.analytics);
      setMarketing(current.marketing);
      setVisible(true);
      setCustomizeOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  const dismiss = () => {
    setCustomizeOpen(false);
    setVisible(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    dismiss();
  };

  const handleRejectAll = () => {
    rejectAll();
    dismiss();
  };

  const handleSavePreferences = () => {
    setConsent({ analytics, marketing });
    dismiss();
  };

  const openCustomize = () => {
    const current = getCategories();
    setAnalytics(current.analytics);
    setMarketing(current.marketing);
    setCustomizeOpen(true);
  };

  // Closing the dialog re-evaluates whether the banner is still required: keep it
  // only for an undecided visitor in a consent-required region. So a non-EU user who
  // opened settings from the footer and cancelled isn't left with the banner.
  const handleDialogOpenChange = (open: boolean) => {
    setCustomizeOpen(open);
    if (!open) {
      setVisible(shouldAutoShow());
    }
  };

  if (!visible) return null;

  return (
    <>
      <AnimatePresence>
        {!customizeOpen && (
          <m.div
            role="dialog"
            aria-label="Cookie consent"
            aria-live="polite"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[90] border-t border-border bg-card/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80"
          >
            <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  We use strictly-necessary cookies to run Fyredocs. With your consent we may also use
                  analytics and advertising cookies to help keep the service free.{' '}
                  <Link to="/cookies" className="font-medium text-foreground underline underline-offset-4">
                    Cookie Policy
                  </Link>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                <Button variant="ghost" size="sm" onClick={openCustomize}>
                  Customize
                </Button>
                <Button variant="outline" size="sm" onClick={handleRejectAll}>
                  Reject all
                </Button>
                <Button variant="default" size="sm" onClick={handleAcceptAll}>
                  Accept all
                </Button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <Dialog open={customizeOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies Fyredocs may use. You can change this anytime via "Cookie settings" in
              the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <PreferenceRow
              title="Strictly necessary"
              description="Required for sign-in, security, and core features. Always on."
            >
              <Switch checked disabled aria-label="Strictly necessary cookies (always on)" />
            </PreferenceRow>
            <PreferenceRow
              title="Analytics"
              description="Privacy-friendly usage stats that help us improve Fyredocs."
            >
              <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" />
            </PreferenceRow>
            <PreferenceRow
              title="Advertising"
              description="Lets us show ads that keep Fyredocs free. May set third-party cookies."
            >
              <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Advertising cookies" />
            </PreferenceRow>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleRejectAll}>
              Reject all
            </Button>
            <Button variant="default" onClick={handleSavePreferences}>
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PreferenceRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
