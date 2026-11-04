/**
 * Root component: providers, then the route table.
 *
 * This file is where the app's rendering and performance posture lives.
 *
 * EVERY route is React.lazy. The tool pages pull in heavy, mutually exclusive
 * dependencies (canvas signing, mermaid, shiki, pdf page counting), so a single
 * bundle would make a visitor who only wants to merge two PDFs download all of
 * it. Suspense fallbacks are skeletons rather than spinners so layout does not
 * shift when a chunk lands. Adding a non-lazy route silently undoes this for
 * everyone.
 *
 * Routes use lazyWithReload (src/lib/lazyWithReload.ts), not bare React.lazy:
 * a deploy deletes the previous build's chunks, and plain lazy leaves a tab
 * opened before the deploy stuck on "Failed to fetch dynamically imported module".
 *
 * NO VIRTUALIZATION ANYWHERE, by choice. Long lists are bounded by pagination
 * instead — see components/admin/DataTable.tsx. That keeps every list keyboard-
 * and screen-reader-navigable and Ctrl-F-able, which windowing breaks. Reach for
 * pagination before a windowing library.
 *
 * MotionConfig reducedMotion="user" is one line that makes EVERY framer-motion
 * animation in the app honour prefers-reduced-motion. It is easy to miss and
 * expensive to rediscover: without it each animated component would need to check
 * the media query itself, and the ones that forgot would be an accessibility
 * regression nobody notices. Do not remove it when refactoring providers.
 *
 * Provider order matters below: the error boundary sits inside the router so a
 * crash can still offer navigation, and inside auth so the boundary's own UI can
 * read session state.
 */
import { lazyWithReload } from "@/lib/lazyWithReload";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/auth/authContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute, PublicOnlyRoute, RequireAuthRoute, RoleRoute } from "@/auth/authGuard";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { CookieConsent } from "@/components/common/CookieConsent";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { UserLayout } from "@/components/layout/UserLayout";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { getAllTools } from "@/config/tools";
import { signupEnabled } from "@/lib/features";

const Index = lazyWithReload(() => import("./pages/Index"));
// Single generic tool page — every registry tool routes through it.
const ToolPage = lazyWithReload(() => import("./pages/ToolPage"));
const AboutPage = lazyWithReload(() => import("./pages/AboutPage"));
const BlogPage = lazyWithReload(() => import("./pages/BlogPage"));
const PricingPage = lazyWithReload(() => import("./pages/PricingPage"));
const ContactPage = lazyWithReload(() => import("./pages/ContactPage"));
const PrivacyPage = lazyWithReload(() => import("./pages/PrivacyPage"));
const TermsPage = lazyWithReload(() => import("./pages/TermsPage"));
const CookiePage = lazyWithReload(() => import("./pages/CookiePage"));
const AllToolsPage = lazyWithReload(() => import("./pages/AllToolsPage"));
const DocsIndexPage = lazyWithReload(() => import("./pages/docs/DocsIndexPage"));
const DocsPage = lazyWithReload(() => import("./pages/docs/DocsPage"));
// Lazy on purpose: DocsLayout imports the developer-docs and mermaid configs
// (~400 kB of source); a static import put all of it in the entry chunk that
// every visitor downloads.
const DocsLayout = lazyWithReload(() =>
  import("@/components/layout/DocsLayout").then((m) => ({ default: m.DocsLayout }))
);
const DevDocsIndexPage = lazyWithReload(() => import("./pages/docs/DevDocsIndexPage"));
const DevDocsPage = lazyWithReload(() => import("./pages/docs/DevDocsPage"));
const NotFound = lazyWithReload(() => import("./pages/NotFound"));
const ReaderPage = lazyWithReload(() => import("./pages/ReaderPage"));
const FlashcardsPage = lazyWithReload(() => import("./pages/FlashcardsPage"));
const MyFilesPage = lazyWithReload(() => import("./pages/MyFilesPage"));
const Dashboard = lazyWithReload(() => import("./pages/Dashboard"));
const DocumentsPage = lazyWithReload(() => import("./pages/app/DocumentsPage"));
const TrashPage = lazyWithReload(() => import("./pages/app/TrashPage"));
const MembersPage = lazyWithReload(() => import("./pages/app/MembersPage"));
const ExportsPage = lazyWithReload(() => import("./pages/app/ExportsPage"));
const SignIn = lazyWithReload(() => import("./pages/auth/SignIn"));
const ActivityPage = lazyWithReload(() => import("./pages/ActivityPage"));
const SignUp = lazyWithReload(() => import("./pages/auth/SignUp"));
const BusinessPage = lazyWithReload(() => import("./pages/admin/BusinessPage"));
const GrowthPage = lazyWithReload(() => import("./pages/admin/GrowthPage"));
const EngagementPage = lazyWithReload(() => import("./pages/admin/EngagementPage"));
const ReliabilityPage = lazyWithReload(() => import("./pages/admin/ReliabilityPage"));
const SystemPage = lazyWithReload(() => import("./pages/admin/SystemPage"));
const NatsPage = lazyWithReload(() => import("./pages/admin/NatsPage"));
const ServerPerformancePage = lazyWithReload(() => import("./pages/admin/ServerPerformancePage"));
const ApiPerformancePage = lazyWithReload(() => import("./pages/admin/ApiPerformancePage"));
const ObservabilityPage = lazyWithReload(() => import("./pages/admin/ObservabilityPage"));
const ActivityAuditPage = lazyWithReload(() => import("./pages/admin/ActivityAuditPage"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <MotionConfig reducedMotion="user">
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <ScrollToTop />
              <CookieConsent />
              <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/all-tools" element={<AllToolsPage />} />
                    <Route path="/tools" element={<AllToolsPage />} />
                    {/* Tool routes are public — backend supports guest usage. */}
                    {getAllTools().map((tool) => (
                      <Route
                        key={tool.id}
                        path={tool.route}
                        element={<ToolPage toolId={tool.id} />}
                      />
                    ))}
                    <Route path="/reader" element={<ReaderPage />} />
                    <Route path="/ai/flashcards" element={<FlashcardsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/cookies" element={<CookiePage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/my-files" element={<MyFilesPage />} />
                    </Route>
                    <Route element={<RequireAuthRoute />}>
                      <Route path="/activity" element={<ActivityPage />} />
                    </Route>
                    <Route element={<PublicOnlyRoute redirectTo="/dashboard" />}>
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/signup" element={signupEnabled ? <SignUp /> : <Navigate to="/signin" replace />} />
                    </Route>
                    <Route element={<DocsLayout />}>
                      <Route path="/docs" element={<DocsIndexPage />} />
                      <Route path="/docs/:slug" element={<DocsPage />} />
                      <Route element={<RoleRoute allowedRoles={['super-admin']} />}>
                        <Route path="/dev-docs" element={<DevDocsIndexPage />} />
                        <Route path="/dev-docs/:slug" element={<DevDocsPage />} />
                      </Route>
                    </Route>
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  {/* Unified role-aware dashboard — server filters data by role. Rendered
                      inside AdminLayout for admins and UserLayout for regular users. */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<RoleLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                    </Route>
                  </Route>
                  {/* Authenticated user workspace — its own shell, outside the marketing layout. */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<UserLayout />}>
                      {/* /app is no longer a separate dashboard — it redirects to the unified one. */}
                      <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/app/documents" element={<DocumentsPage />} />
                      <Route path="/app/trash" element={<TrashPage />} />
                      <Route path="/app/members" element={<MembersPage />} />
                      <Route path="/app/exports" element={<ExportsPage />} />
                    </Route>
                  </Route>
                  {/* Admin lives in its own shell (sidebar + top bar), outside the marketing layout. */}
                  <Route element={<RoleRoute allowedRoles={['super-admin']} />}>
                    <Route element={<AdminLayout />}>
                      {/* The standalone admin dashboard is replaced by the unified /dashboard. */}
                      <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/admin/business" element={<BusinessPage />} />
                      <Route path="/admin/growth" element={<GrowthPage />} />
                      <Route path="/admin/engagement" element={<EngagementPage />} />
                      <Route path="/admin/reliability" element={<ReliabilityPage />} />
                      <Route path="/admin/system" element={<SystemPage />} />
                      <Route path="/admin/nats" element={<NatsPage />} />
                      <Route path="/admin/server-performance" element={<ServerPerformancePage />} />
                      <Route path="/admin/api-performance" element={<ApiPerformancePage />} />
                      <Route path="/admin/observability" element={<ObservabilityPage />} />
                      <Route path="/admin/activity" element={<ActivityAuditPage />} />
                    </Route>
                  </Route>
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </MotionConfig>
  </HelmetProvider>
);

export default App;
