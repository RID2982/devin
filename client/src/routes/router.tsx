import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/auth/ProtectedRoute';

function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <Component />
    </Suspense>
  );
}

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PlannerPage = lazy(() => import('@/pages/planner/PlannerPage').then((m) => ({ default: m.PlannerPage })));
const EventsListPage = lazy(() => import('@/pages/events/EventsListPage').then((m) => ({ default: m.EventsListPage })));
const EventDetailPage = lazy(() => import('@/pages/events/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const PeoplePage = lazy(() => import('@/pages/people/PeoplePage').then((m) => ({ default: m.PeoplePage })));
const CalendarPage = lazy(() => import('@/pages/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const SearchPage = lazy(() => import('@/pages/search/SearchPage').then((m) => ({ default: m.SearchPage })));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage').then((m) => ({ default: m.AttendancePage })));

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(LoginPage) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: withSuspense(DashboardPage) },
          { path: '/planner', element: withSuspense(PlannerPage) },
          { path: '/planner/:year', element: withSuspense(PlannerPage) },
          { path: '/events', element: withSuspense(EventsListPage) },
          { path: '/events/:id', element: withSuspense(EventDetailPage) },
          { path: '/events/:id/:tab', element: withSuspense(EventDetailPage) },
          { path: '/tasks', element: withSuspense(DashboardPage) },
          { path: '/people', element: withSuspense(PeoplePage) },
          { path: '/templates', element: withSuspense(DashboardPage) },
          { path: '/calendar', element: withSuspense(CalendarPage) },
          { path: '/search', element: withSuspense(SearchPage) },
          { path: '/reports', element: withSuspense(DashboardPage) },
          { path: '/settings', element: withSuspense(SettingsPage) },
          { path: '/attendance', element: withSuspense(AttendancePage) },
        ],
      },
    ],
  },
]);
