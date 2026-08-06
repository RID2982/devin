import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, CheckCircle2, Share, Info } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { LOGO_SRC } from '@/config/brand';

export function PwaInstallCard({ className = '' }: { className?: string }) {
  const { isInstallable, isInstalled, installApp } = usePwaInstall();
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  async function handleInstall() {
    setInstalling(true);
    const success = await installApp();
    if (!success) {
      setShowInstructions(true);
    }
    setInstalling(false);
  }

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-300 ${className}`}>
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="font-semibold">App Installed</p>
          <p className="text-xs opacity-90">Running natively on your mobile phone / desktop.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-4 shadow-lg backdrop-blur-md transition-all hover:border-primary/40 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-1 border border-primary/20 shadow-sm">
            <Logo src={LOGO_SRC} className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground text-sm">Install Mobile App</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">PWA</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Access ClubOps directly on your mobile home screen.</p>
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <Button
          onClick={handleInstall}
          disabled={installing}
          className="brand-gradient flex-1 gap-2 border-0 text-white shadow-md hover:shadow-lg transition-all text-xs font-semibold py-2"
        >
          <Download className="h-4 w-4" />
          {installing ? 'Installing…' : isInstallable ? 'Install App Now' : 'Download to Phone'}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowInstructions((v) => !v)}
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          title="Install Instructions"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground"
          >
            <p className="font-medium text-foreground flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5 text-primary" /> Mobile Installation Guide:
            </p>
            <div className="space-y-1.5 pl-1">
              <p className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">iPhone (Safari):</span> Tap <Share className="h-3 w-3 inline text-primary" /> Share icon &rarr; select <span className="font-medium text-foreground">"Add to Home Screen"</span>.
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">Android (Chrome):</span> Tap browser menu (⋮) &rarr; select <span className="font-medium text-foreground">"Install app"</span> or <span className="font-medium text-foreground">"Add to Home Screen"</span>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
