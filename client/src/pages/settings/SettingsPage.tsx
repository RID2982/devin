import { useState } from 'react';
import { Download, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/uiStore';
import { useSettingsQuery, useUpdateSettings } from '@/features/settings/useSettings';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { cn } from '@/lib/utils';

const ACCENT_OPTIONS = ['#b42244', '#c9a227', '#1b2a5e', '#10b981', '#0ea5e9', '#8b5cf6'];

export function SettingsPage() {
  const { theme, setTheme, accentColor, setAccentColor } = useUiStore();
  const { data: settings } = useSettingsQuery();
  const updateSettings = useUpdateSettings();
  const { canInstall, isIos, isInstalled, promptInstall } = usePwaInstall();
  const [showIosSteps, setShowIosSteps] = useState(false);

  const notificationPrefs = (settings?.notificationPreferences as { email: boolean; inApp: boolean }) ?? { email: true, inApp: true };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize the look and notifications.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Theme and accent color.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Dark mode</Label>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => {
                const next = checked ? 'dark' : 'light';
                setTheme(next);
                document.documentElement.classList.toggle('dark', checked);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex gap-2">
              {ACCENT_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className={cn('h-7 w-7 rounded-full border-2', accentColor === c ? 'border-foreground' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Install App</CardTitle>
          <CardDescription>Add ClubOps to your phone or desktop for quick, app-like access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isInstalled ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Already installed on this device.
            </div>
          ) : canInstall ? (
            <Button onClick={() => promptInstall()} className="gap-1.5">
              <Download className="h-4 w-4" /> Install App
            </Button>
          ) : isIos ? (
            <>
              <Button onClick={() => setShowIosSteps((v) => !v)} className="gap-1.5">
                <Download className="h-4 w-4" /> How to Install on iPhone
              </Button>
              {showIosSteps && (
                <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold">1</span>
                    Tap the Share icon <Share className="inline h-3.5 w-3.5" /> in Safari's toolbar
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold">2</span>
                    Scroll down and tap <span className="inline-flex items-center gap-1 font-medium"><PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold">3</span>
                    Tap <span className="font-medium">Add</span> — done
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Open this site in Chrome or Edge on your phone or desktop to install it as an app.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Email notifications</Label>
            <Switch
              checked={notificationPrefs.email}
              onCheckedChange={(email) => updateSettings.mutate({ notificationPreferences: { ...notificationPrefs, email } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>In-app notifications</Label>
            <Switch
              checked={notificationPrefs.inApp}
              onCheckedChange={(inApp) => updateSettings.mutate({ notificationPreferences: { ...notificationPrefs, inApp } })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Email delivery currently uses a console/log stub transport (see docs/AWS.md) — preferences are saved and
            respected by the trigger logic even before real SMTP is wired up.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
