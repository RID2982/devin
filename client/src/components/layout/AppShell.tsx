import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileTabBar } from './MobileTabBar';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { InstallAppBanner } from '@/components/shared/InstallAppBanner';
import { NavigationTransitionOverlay } from './NavigationTransitionOverlay';

export function AppShell() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-3 pt-0 pb-24 sm:p-4 sm:pt-0 lg:pb-4">
          <InstallAppBanner />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <MobileTabBar />
      <CommandPalette />
      <NavigationTransitionOverlay />
    </div>
  );
}
