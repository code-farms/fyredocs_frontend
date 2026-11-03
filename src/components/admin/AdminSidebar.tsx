import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, Home } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/auth/useAuth';
import { useCloseMobileSidebarOnNavigate } from '@/hooks/useCloseMobileSidebarOnNavigate';
import { ADMIN_NAV_GROUPS, ADMIN_SECTIONS } from '@/components/admin/adminNav';

export function AdminSidebar() {
  useCloseMobileSidebarOnNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const days = searchParams.get('days');
  const { user, role } = useAuth();

  const displayName = user?.fullName || user?.email || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <img src="/favicon.png" alt="" className="h-8 w-8 object-contain" aria-hidden />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Fyredocs</span>
                  <span className="truncate text-caption text-sidebar-foreground/70">Admin console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_SECTIONS.filter((section) => section.group === group.id).map((section) => {
                  const to =
                    section.supportsTimeRange && days ? `${section.path}?days=${days}` : section.path;
                  return (
                    <SidebarMenuItem key={section.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === section.path}
                        tooltip={section.title}
                      >
                        <NavLink to={to}>
                          <section.icon aria-hidden />
                          <span>{section.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to site">
              <Link to="/">
                <Home aria-hidden />
                <span>Back to site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dev docs">
              <Link to="/dev-docs">
                <BookOpen aria-hidden />
                <span>Dev docs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground"
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {role && <p className="truncate text-caption text-sidebar-foreground/70">{role}</p>}
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
