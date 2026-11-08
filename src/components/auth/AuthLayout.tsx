import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { getAllTools } from '@/config/tools';

const trustBullets = [
  'Files auto-delete — your plan controls retention',
  'Encrypted in transit (HTTPS)',
  'Bigger limits and job history with an account',
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Split-screen auth shell: brand panel on the left (lg and up), centered
 * form card slot on the right.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  const toolCount = getAllTools().length;

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Brand panel */}
      {/* brand-950 stays dark in both themes, so text uses the light end of the brand ramp */}
      <aside className="relative hidden flex-col justify-center overflow-hidden bg-brand-950 p-10 text-brand-50 lg:flex">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-1/4 -top-1/4 h-[480px] w-[480px] rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 h-[400px] w-[400px] rounded-full bg-brand-700/20 blur-3xl" />
        </div>

        {/* <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="Fyredocs" className="h-12 w-auto" />
          </Link>
        </div> */}

        <div className="relative max-w-md">
          <h2 className="text-h1 font-bold">
            All your PDF work, <span className="text-brand-300">one place</span>
          </h2>
          <p className="mt-3 text-body-lg text-brand-50/70">
            {toolCount} tools for organizing, converting, editing, and securing your documents.
          </p>
          <ul className="mt-8 space-y-3">
            {trustBullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/30">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                <span className="text-body-sm text-brand-50/90">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-caption text-brand-50/50">
          Fyredocs — fast, private PDF tools.
        </p>
      </aside>

      {/* Form slot */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
