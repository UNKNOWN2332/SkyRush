import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, logout } from '../api/authService';

type BrandLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export const inputClass =
  'w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/30';

export const labelClass = 'mb-2 block text-sm font-medium text-slate-100';

export const primaryButtonClass =
  'rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60';

export const ghostButtonClass =
  'rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10';

export const glassCardClass =
  'rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_20px_70px_-25px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8';

export function BrandLayout({ children, title, subtitle }: BrandLayoutProps) {
  const user = getStoredUser();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-full overflow-hidden bg-[#060915] text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-cyan-500/20 blur-3xl" />

      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-emerald-200">
              SKYRUSH
            </span>
            <span className="text-lg font-semibold text-white">Top-up</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <span className="hidden max-w-[200px] truncate text-sm text-slate-300 sm:inline">{user.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                  className={ghostButtonClass}
                >
                  Chiqish
                </button>
              </>
            ) : (
              <Link to="/login" className={primaryButtonClass + ' inline-block text-center'}>
                Kirish
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>}
            {subtitle && <p className="mt-2 max-w-2xl text-slate-300">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
