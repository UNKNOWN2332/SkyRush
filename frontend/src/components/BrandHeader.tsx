import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStoredUser } from '../api/authService';
import { ghostButtonClass, mobaSignInClass } from './brandStyles';
import { RegionSelector } from './RegionSelector';
import { ThemeToggle } from './ThemeToggle';
import { UserAccountMenu } from './UserAccountMenu';

const BRAND_LOGO_URL = 'https://i.ibb.co/qYpD1GbD/image.png';

export function BrandHeader() {
  const { t } = useTranslation();
  const user = getStoredUser();
  const { pathname } = useLocation();
  const onLoginRoute = pathname === '/login';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[300] isolate w-full border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#060915]/95 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-2.5 md:py-3">
          <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:gap-4 md:gap-6">
            <Link
              to="/"
              aria-label={t('header.brandAria')}
              className="group flex shrink-0 items-center gap-2 sm:gap-3 outline-none ring-offset-2 ring-offset-white focus-visible:ring-2 focus-visible:ring-emerald-400/50 dark:ring-offset-[#060915]"
            >
              <img
                src={BRAND_LOGO_URL}
                alt=""
                className="h-9 w-auto shrink-0 object-contain object-left sm:h-10 md:h-11"
                decoding="async"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <span className="font-extrabold tracking-tight text-slate-900 text-lg leading-none sm:text-2xl md:text-[1.65rem] dark:text-white">
                Sky
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-200 dark:to-cyan-300">
                  Rush
                </span>
              </span>
            </Link>

            <nav
              className="flex min-w-0 w-full items-center gap-0.5 overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0 md:gap-1"
              aria-label={t('header.mainNavAria')}
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition sm:px-2.5 sm:text-xs md:px-3 md:text-sm ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`
                }
              >
                {t('header.navMain')}
              </NavLink>
              <NavLink
                to="/reviews"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition sm:px-2.5 sm:text-xs md:px-3 md:text-sm ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`
                }
              >
                {t('header.navReviews')}
              </NavLink>
              <NavLink
                to="/tournaments"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition sm:px-2.5 sm:text-xs md:px-3 md:text-sm ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`
                }
              >
                {t('header.navTournaments')}
              </NavLink>
            </nav>
          </div>

          <nav className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <RegionSelector />
                <UserAccountMenu user={user} />
              </>
            ) : (
              <>
                {onLoginRoute ? (
                  <Link
                    to="/"
                    className={ghostButtonClass + ' inline-flex h-9 items-center justify-center px-3 py-0 text-center text-sm'}
                  >
                    {t('header.home')}
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className={mobaSignInClass + ' inline-flex h-9 items-center justify-center px-4 py-0 text-center text-sm'}
                  >
                    {t('header.login')}
                  </Link>
                )}
                <RegionSelector />
              </>
            )}
          </nav>
        </div>
      </header>
      {/* Fixed header is out of document flow — reserve height so content does not sit underneath */}
      <div className="h-[118px] shrink-0 sm:h-[64px] md:h-[68px]" aria-hidden />
    </>
  );
}
