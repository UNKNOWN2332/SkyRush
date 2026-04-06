import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStoredUser, logout } from '../api/authService';
import { ghostButtonClass, mobaSignInClass } from './brandStyles';
import { RegionSelector } from './RegionSelector';

const BRAND_LOGO_URL = 'https://i.ibb.co/qYpD1GbD/image.png';

export function BrandHeader() {
  const { t } = useTranslation();
  const user = getStoredUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onLoginRoute = pathname === '/login';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[300] isolate w-full border-b border-white/10 bg-[#060915]/95 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-[#060915]/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5 sm:py-4 md:py-5">
          <Link
            to="/"
            aria-label={t('header.brandAria')}
            className="group flex min-w-0 items-center gap-2.5 sm:gap-4 outline-none ring-offset-2 ring-offset-[#060915] focus-visible:ring-2 focus-visible:ring-emerald-400/50"
          >
            <img
              src={BRAND_LOGO_URL}
              alt=""
              className="h-12 w-auto shrink-0 object-contain object-left sm:h-14 md:h-16"
              decoding="async"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <span className="font-extrabold tracking-tight text-white text-[1.375rem] leading-none sm:text-3xl md:text-[2rem]">
              Sky
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">Rush</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
            {user ? (
              <>
                <img
                  src="/avatar-default.png"
                  alt={t('header.profileAlt')}
                  className="h-10 w-10 shrink-0 rounded-full border-2 border-white/20 object-cover shadow-md ring-2 ring-indigo-500/30"
                  title={user.username}
                />
                <RegionSelector />
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                  className={ghostButtonClass}
                >
                  {t('header.logout')}
                </button>
              </>
            ) : (
              <>
                {onLoginRoute ? (
                  <Link to="/" className={ghostButtonClass + ' inline-block text-center'}>
                    {t('header.home')}
                  </Link>
                ) : (
                  <Link to="/login" className={mobaSignInClass + ' inline-block text-center'}>
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
      <div className="h-[76px] shrink-0 sm:h-[88px] md:h-[104px]" aria-hidden />
    </>
  );
}
