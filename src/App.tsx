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
import { lazy } from "react";
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

const Index = lazy(() => import("./pages/Index"));
// Single generic tool page — every registry tool routes through it.
const ToolPage = lazy(() => import("./pages/ToolPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CookiePage = lazy(() => import("./pages/CookiePage"));
const AllToolsPage = lazy(() => import("./pages/AllToolsPage"));
const DocsIndexPage = lazy(() => import("./pages/docs/DocsIndexPage"));
const DocsPage = lazy(() => import("./pages/docs/DocsPage"));
// Lazy on purpose: DocsLayout imports the developer-docs and mermaid configs
// (~400 kB of source); a static import put all of it in the entry chunk that
// every visitor downloads.
const DocsLayout = lazy(() =>
  import("@/components/layout/DocsLayout").then((m) => ({ default: m.DocsLayout }))
);
const DevDocsIndexPage = lazy(() => import("./pages/docs/DevDocsIndexPage"));
const DevDocsPage = lazy(() => import("./pages/docs/DevDocsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MyFilesPage = lazy(() => import("./pages/MyFilesPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DocumentsPage = lazy(() => import("./pages/app/DocumentsPage"));
const TrashPage = lazy(() => import("./pages/app/TrashPage"));
const MembersPage = lazy(() => import("./pages/app/MembersPage"));
const ExportsPage = lazy(() => import("./pages/app/ExportsPage"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const BusinessPage = lazy(() => import("./pages/admin/BusinessPage"));
const GrowthPage = lazy(() => import("./pages/admin/GrowthPage"));
const EngagementPage = lazy(() => import("./pages/admin/EngagementPage"));
const ReliabilityPage = lazy(() => import("./pages/admin/ReliabilityPage"));
const SystemPage = lazy(() => import("./pages/admin/SystemPage"));
const NatsPage = lazy(() => import("./pages/admin/NatsPage"));
const ServerPerformancePage = lazy(() => import("./pages/admin/ServerPerformancePage"));
const ApiPerformancePage = lazy(() => import("./pages/admin/ApiPerformancePage"));
const ObservabilityPage = lazy(() => import("./pages/admin/ObservabilityPage"));
const ActivityAuditPage = lazy(() => import("./pages/admin/ActivityAuditPage"));

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
