import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import type { UserResponse } from '../api/authService';
import { logout } from '../api/authService';
import { headerControlButtonClass } from './brandStyles';

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  user: UserResponse;
};

export function UserAccountMenu({ user }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const displayName = user.username.length > 18 ? `${user.username.slice(0, 16)}…` : user.username;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${headerControlButtonClass} min-w-0 max-w-[11rem] text-left sm:max-w-[13rem]`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('header.userMenuAria')}
      >
        <img
          src="/avatar-default.png"
          alt=""
          className="h-7 w-7 shrink-0 rounded-full border border-white/20 object-cover ring-1 ring-indigo-500/30"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-white">
          {displayName}
        </span>
        <ChevronDown className={`shrink-0 text-slate-500 transition dark:text-slate-400 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          className="absolute right-0 z-[500] mt-2 w-[min(calc(100vw-3rem),17.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-200/60 dark:border-white/15 dark:bg-[#12152a] dark:shadow-2xl dark:ring-black/40"
          role="menu"
        >
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <img
              src="/avatar-default.png"
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-white/15 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                {user.username}
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
            </div>
          </div>

          <div className="py-1">
            <Link
              to="/profile"
              role="menuitem"
              className="block px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setOpen(false)}
            >
              {t('header.viewProfile')}
            </Link>
          </div>

          <div className="border-t border-slate-200 py-1 dark:border-white/10">
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              onMouseDown={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              {t('header.logout')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
