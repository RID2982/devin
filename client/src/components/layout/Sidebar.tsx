import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarRange,
  PartyPopper,
  ListChecks,
  Users,
  FileStack,
  Calendar,
  BarChart3,
  Settings,
  Pin,
  PinOff,
} from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { Logo } from '@/components/shared/Logo';
import { LOGO_SRC } from '@/config/brand';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner', label: 'Monthly Planner', icon: CalendarRange },
  { to: '/events', label: 'Events', icon: PartyPopper },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/people', label: 'People', icon: Users },
  { to: '/templates', label: 'Templates', icon: FileStack },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 252;

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const [hovering, setHovering] = useState(false);

  // sidebarCollapsed = pinned-closed preference. Hovering always temporarily reveals labels.
  const expanded = !sidebarCollapsed || hovering;

  return (
    <motion.aside
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
      className="sticky top-0 z-20 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-card lg:flex"
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <Logo src={LOGO_SRC} className="h-8 w-8 shrink-0" iconOnly />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="truncate text-sm font-semibold"
            >
              ClubOps
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
            title={!expanded ? item.label : undefined}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex h-11 items-center justify-center gap-2 border-t border-border text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {sidebarCollapsed ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {sidebarCollapsed ? 'Pin open' : 'Unpin'}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.aside>
  );
}
