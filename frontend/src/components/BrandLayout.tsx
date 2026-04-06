import type { ReactNode } from 'react';
import { BrandHeader } from './BrandHeader';
import { SiteFooter } from './SiteFooter';

export { ghostButtonClass, mobaSignInClass } from './brandStyles';

type BrandLayoutProps = {
  children: ReactNode;
  /** Masalan, bosh sahifada MobaPay uslubida banner — sarlavhadan oldin */
  topSlot?: ReactNode;
  title?: string;
  subtitle?: string;
};

export const inputClass =
  'w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/30';

export const labelClass = 'mb-2 block text-sm font-medium text-slate-100';

export const primaryButtonClass =
  'rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60';

export const glassCardClass =
  'rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_20px_70px_-25px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8';

export function BrandLayout({ children, topSlot, title, subtitle }: BrandLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#060915] text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-cyan-500/20 blur-3xl" />

      <BrandHeader />

      <main className="relative z-0 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {topSlot ? <div className="mb-10">{topSlot}</div> : null}
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>}
            {subtitle && <p className="mt-2 max-w-2xl text-slate-300">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
