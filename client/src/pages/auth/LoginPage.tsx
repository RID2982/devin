import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, PartyPopper, CalendarCheck2, Users, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/shared/Checkbox';
import { Logo } from '@/components/shared/Logo';
import { PwaInstallCard } from '@/components/shared/PwaInstallCard';
import { useAuth } from '@/auth/AuthProvider';
import { LOGO_SRC } from '@/config/brand';
import { cn } from '@/lib/utils';

interface FormValues {
  email: string;
  password: string;
}

const FLOATING_ICONS = [
  { Icon: PartyPopper, className: 'left-[12%] top-[18%] animate-float-slow', delay: 0 },
  { Icon: CalendarCheck2, className: 'right-[16%] top-[26%] animate-float-slower', delay: 0.15 },
  { Icon: Users, className: 'left-[20%] bottom-[22%] animate-float-slower', delay: 0.3 },
  { Icon: ListChecks, className: 'right-[12%] bottom-[16%] animate-float-slow', delay: 0.45 },
];

export function LoginPage() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>();

  if (status === 'authenticated') return <Navigate to="/" replace />;

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await signIn(values.email, values.password, rememberMe);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left: animated brand panel (desktop+) */}
      <div
        className="relative hidden w-1/2 shrink-0 items-center justify-center overflow-hidden lg:flex"
        style={{ backgroundImage: 'var(--brand-gradient)' }}
      >
        <div className="pointer-events-none absolute inset-0">
          {FLOATING_ICONS.map(({ Icon, className, delay }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.18, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 + delay }}
              className={cn('absolute', className)}
            >
              <Icon className="h-20 w-20 text-white" strokeWidth={1.25} />
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_55%)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-sm px-10 text-center text-white"
        >
          <Logo src={LOGO_SRC} className="mx-auto mb-8 h-16 w-16" iconOnly />
          <h1 className="text-2xl font-bold tracking-tight">Dream to Deserve</h1>
          <p className="mt-3 text-sm text-white/80">
            Plan every event, track every task, and keep your club moving — month after month, nothing lost.
          </p>
        </motion.div>
      </div>

      {/* Right: login form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-[0.04] lg:hidden"
          style={{ backgroundImage: 'var(--brand-gradient)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo src={LOGO_SRC} className="mb-4 h-12" />
            <h2 className="text-xl font-bold tracking-tight">Admin Sign In</h2>
            <p className="mt-1 text-sm text-muted-foreground">This dashboard is for a single admin account only.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  className="pl-9"
                  {...register('email', { required: true })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pl-9 pr-9"
                  {...register('password', { required: true })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen((v) => !v)}
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                Forgot password?
              </button>
            </div>

            {forgotOpen && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
              >
                This is a single-admin dashboard — reset your password directly in the server's <code>.env</code> file
                (<code>ADMIN_PASSWORD</code>).
              </motion.p>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={formState.isSubmitting}
              className="brand-gradient w-full gap-2 border-0 text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
            >
              {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* PWA Mobile App Download Card */}
          <div className="mt-6">
            <PwaInstallCard />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
