import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PartyPopper, ListChecks, Calendar, Menu, X, Plus } from 'lucide-react';
import {
  CalendarRange,
  Users,
  FileStack,
  BarChart3,
  ClipboardCheck,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_TABS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Events', icon: PartyPopper },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
];

const MORE_ITEMS = [
  { to: '/planner', label: 'Monthly Planner', icon: CalendarRange },
  { to: '/people', label: 'People', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/templates', label: 'Templates', icon: FileStack },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname.startsWith(item.to));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-card/95 backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_TABS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => setMoreOpen(true)}
          className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium"
        >
          {isMoreActive && (
            <motion.div
              layoutId="mobile-tab-indicator"
              className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Menu className={cn('h-5 w-5', isMoreActive ? 'text-primary' : 'text-muted-foreground')} />
          <span className={isMoreActive ? 'text-primary' : 'text-muted-foreground'}>More</span>
        </button>
      </nav>

      {/* Mobile Quick Add FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate('/events?create=1')}
        className="brand-gradient fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg lg:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Quick add event"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-card p-4 shadow-2xl lg:hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">More</span>
                <button onClick={() => setMoreOpen(false)} className="text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {MORE_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-medium',
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="leading-tight">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
