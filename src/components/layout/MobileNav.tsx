import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, Search, Shield, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/typography';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { useAuth } from '@/auth/useAuth';
import { NAV_GROUPS, getToolsByNavGroup, toolNavName } from '@/config/navigation';
import { getAllTools } from '@/config/tools';
import { filterTools } from '@/lib/toolSearch';
import { cn } from '@/lib/utils';
import type { ToolDefinition } from '@/types';
import { signupEnabled } from '@/lib/features';

const PAGE_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const pageLinkClass =
  'block rounded-md px-2 py-2 text-sm font-medium text-foreground transition-colors duration-fast hover:bg-muted';

function ToolRow({ tool, onNavigate }: { tool: ToolDefinition; onNavigate: () => void }) {
  return (
    <Link
      to={tool.route}
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground"
    >
      <ToolIcon icon={tool.icon} category={tool.category} size="sm" className="shrink-0" />
      <span className="truncate">{toolNavName(tool)}</span>
    </Link>
  );
}

/** Hamburger-triggered Sheet navigation for < lg viewports. Closes on any navigation. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const allTools = useMemo(() => getAllTools(), []);
  const trimmedQuery = query.trim();
  const results = trimmedQuery ? filterTools(trimmedQuery, allTools) : [];

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const handleLogout = async () => {
    await logout();
    close();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-80 flex-col gap-0 p-0">
        <SheetHeader className="space-y-3 border-b p-4 text-left">
          <SheetTitle className="pr-8 text-base">Menu</SheetTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools…"
              className="pl-9"
              aria-label="Search tools"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {trimmedQuery ? (
            results.length > 0 ? (
              <ul className="space-y-0.5">
                {results.map((tool) => (
                  <li key={tool.id}>
                    <ToolRow tool={tool} onNavigate={close} />
                  </li>
                ))}
              </ul>
            ) : (
              <Text variant="body-sm" tone="muted" className="px-2 py-4">
                No tools match “{trimmedQuery}”.
              </Text>
            )
          ) : (
            <>
              <Accordion type="multiple">
                {NAV_GROUPS.map((group) => (
                  <AccordionItem key={group.id} value={group.id} className="border-none">
                    <AccordionTrigger
                      className={cn('px-2 py-2.5 text-overline uppercase hover:no-underline', group.styles.text)}
                    >
                      {group.title}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      {getToolsByNavGroup(group.id).map((tool) => (
                        <ToolRow key={tool.id} tool={tool} onNavigate={close} />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <nav className="mt-4 space-y-0.5 border-t pt-4" aria-label="Pages">
                {isAuthenticated && (
                  <>
                    <Link to="/dashboard" onClick={close} className={pageLinkClass}>
                      Dashboard
                    </Link>
                    <Link to="/my-files" onClick={close} className={pageLinkClass}>
                      My Files
                    </Link>
                  </>
                )}
                {PAGE_LINKS.map((link) => (
                  <Link key={link.href} to={link.href} onClick={close} className={pageLinkClass}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>

        {!isLoading && (
          <div className="border-t p-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} alt={user?.fullName ?? user?.email ?? 'Profile'} />
                    <AvatarFallback>
                      <User className="h-4 w-4" aria-hidden />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Text variant="body-sm" className="font-semibold">
                      {user?.fullName ?? 'Signed in'}
                    </Text>
                    <Text variant="caption" tone="muted" className="truncate">
                      {user?.email ?? '—'}
                    </Text>
                  </div>
                </div>
                {user?.role === 'super-admin' && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/dashboard" onClick={close}>
                      <Shield aria-hidden />
                      Admin Dashboard
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => void handleLogout()}>
                  <LogOut aria-hidden />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                <Button variant="outline" asChild>
                  <Link to="/signin" onClick={close}>
                    Login
                  </Link>
                </Button>
                {signupEnabled && (
                  <Button asChild>
                    <Link to="/signup" onClick={close}>
                      Sign up
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
