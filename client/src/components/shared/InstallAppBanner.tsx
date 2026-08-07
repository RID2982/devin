import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, X, PlusSquare } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'pwa-install-banner-dismissed-at';
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // re-offer after a week

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_COOLDOWN_MS;
}

export function InstallAppBanner() {
  const { canInstall, isIos, isInstalled, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(recentlyDismissed);
  const [showIosSteps, setShowIosSteps] = useState(false);

  const visible = !isInstalled && !dismissed && (canInstall || isIos);
  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  async function handleInstall() {
    if (canInstall) {
      await promptInstall();
    } else if (isIos) {
      setShowIosSteps(true);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12, height: 0 }}
        className="mb-4 overflow-hidden rounded-xl border border-border"
      >
        <div className="brand-gradient flex items-center gap-3 p-3.5 text-white">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <Download className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install Rotaract Club of Salem Midtown</p>
            <p className="text-xs text-white/80">Add it to your home screen for quick, app-like access.</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleInstall} className="shrink-0 border-white/40 bg-white/10 text-white hover:bg-white/20">
            Install
          </Button>
          <button onClick={dismiss} className="shrink-0 text-white/70 hover:text-white" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence>
          {showIosSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 bg-card p-3.5 text-sm"
            >
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">1</span>
                Tap the Share icon <Share className="inline h-3.5 w-3.5" /> in Safari's toolbar
              </p>
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">2</span>
                Scroll down and tap <span className="inline-flex items-center gap-1 font-medium"><PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">3</span>
                Tap <span className="font-medium">Add</span> — Rotaract Club of Salem Midtown now opens full-screen from your home screen
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
