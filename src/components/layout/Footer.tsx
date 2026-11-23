import { Link } from 'react-router-dom';
import { Mail, Shield } from 'lucide-react';
import { openCookiePreferences } from '@/lib/consent';
import { getPopularTools } from '@/config/tools';
import { getToolsByNavGroup, toolNavName } from '@/config/navigation';
import type { ToolDefinition } from '@/types';

const MAX_TOOLS_PER_COLUMN = 6;

/** Alternate convert-to / convert-from tools so the column shows both directions. */
const interleave = (a: ToolDefinition[], b: ToolDefinition[]): ToolDefinition[] => {
  const mixed: ToolDefinition[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) mixed.push(a[i]);
    if (b[i]) mixed.push(b[i]);
  }
  return mixed;
};

const toolColumns: { title: string; tools: ToolDefinition[] }[] = [
  {
    title: 'Popular tools',
    tools: getPopularTools().slice(0, MAX_TOOLS_PER_COLUMN),
  },
  {
    title: 'Convert',
    tools: interleave(getToolsByNavGroup('convert-to-pdf'), getToolsByNavGroup('convert-from-pdf')).slice(
      0,
      MAX_TOOLS_PER_COLUMN,
    ),
  },
];

const companyLinks = [
  { label: 'PDF Converter', href: '/pdf-converter' },
  { label: 'All Tools', href: '/all-tools' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
  { label: 'Docs', href: '/docs' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
];

// Only real destinations: placeholder "#" social links are dead links to crawlers.
// Add Twitter/GitHub here (and as Organization sameAs) once the profiles exist.
const socialLinks = [{ icon: Mail, label: 'Email', href: 'mailto:support@fyredocs.com' }];

const footerLinkClass = 'text-sm text-muted-foreground hover:text-foreground transition-colors';

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Link to="/" className="mb-4 inline-flex items-center" aria-label="Fyredocs home">
              <img src="/logo.png" alt="Fyredocs" className="h-12 w-auto" />
            </Link>
            <p className="mb-5 max-w-sm text-sm text-muted-foreground">
              Free online PDF tools to merge, split, compress, and convert your documents. Fast, secure, and easy to
              use.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  <social.icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Tool columns (derived from the registry) */}
          {toolColumns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 font-semibold">{column.title}</h3>
              <ul className="space-y-3">
                {column.tools.map((tool) => (
                  <li key={tool.id}>
                    <Link to={tool.route} className={footerLinkClass}>
                      {toolNavName(tool)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 font-semibold">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className={footerLinkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={openCookiePreferences} className={footerLinkClass}>
                  Cookie settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Fyredocs. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            Files auto-delete on a plan-based schedule — you stay in control.
          </p>
        </div>
      </div>
    </footer>
  );
};
