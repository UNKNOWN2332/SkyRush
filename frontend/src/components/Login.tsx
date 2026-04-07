import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService, type BaseMessage } from '../api/authService';
import { BrandHeader } from './BrandHeader';
import { SiteFooter } from './SiteFooter';

const formatError = (err: unknown) => {
  const base = err as Partial<BaseMessage>;
  const code = typeof base.code === 'number' ? base.code : -1;
  const message = typeof base.message === 'string' ? base.message : null;
  return message ? `${code}: ${message}` : `${code}`;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from;
  const [busy, setBusy] = useState(false);

  const onGoogleSuccess = async (res: CredentialResponse) => {
    const credential = res.credential;
    if (!credential) {
      toast.error(t('login.googleNoCredential'));
      return;
    }
    setBusy(true);
    try {
      await authService.googleSignIn(credential);
      toast.success(t('login.toastGoogleOk'));
      const safe =
        redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
      navigate(safe, { replace: true });
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-100 text-slate-900 dark:bg-[#060915] dark:text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-400/20" />
      <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl dark:bg-cyan-400/20" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 bg-gradient-to-r from-emerald-400/15 via-indigo-400/15 to-cyan-400/15 blur-3xl dark:from-emerald-500/20 dark:via-indigo-500/20 dark:to-cyan-500/20" />

      <BrandHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-12">
        <div className="hidden w-full max-w-xl pr-12 lg:block">
          <div className="mb-8 inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-50 px-4 py-1 text-xs font-medium tracking-[0.25em] text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-200">
            {t('login.badge')}
          </div>
          <h1 className="text-5xl font-semibold leading-tight text-slate-900 dark:text-white">
            {t('login.heroTitleLine1')}
            <br />
            {t('login.heroTitleLine2')}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">{t('login.heroText')}</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <div className="text-slate-500 dark:text-slate-300">{t('login.cardSecurity')}</div>
              <div className="mt-1 font-medium text-slate-900 dark:text-white">{t('login.cardSecurityVal')}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <div className="text-slate-500 dark:text-slate-300">{t('login.cardPrivacy')}</div>
              <div className="mt-1 font-medium text-slate-900 dark:text-white">{t('login.cardPrivacyVal')}</div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl shadow-slate-300/40 backdrop-blur-2xl dark:border-white/12 dark:bg-white/[0.07] dark:shadow-[0_24px_80px_-28px_rgba(0,0,0,0.65),0_0_0_1px_rgba(52,211,153,0.08)_inset] sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 h-1 w-14 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 opacity-90" />
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{t('login.welcome')}</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t('login.welcomeHint')}</div>
          </div>

          {!googleClientId ? (
            <div className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {t('login.googleMissingClient')}
            </div>
          ) : busy ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">{t('login.loading')}</div>
          ) : (
            <div className="flex flex-col items-stretch gap-4">
              <div className="rounded-2xl border border-emerald-300/60 bg-gradient-to-b from-emerald-50/80 to-white p-5 shadow-inner dark:border-emerald-400/25 dark:from-white/[0.07] dark:to-white/[0.02] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-200/90">
                  {t('login.googleSectionLabel')}
                </p>
                <div className="flex w-full justify-center overflow-hidden rounded-xl [&_iframe]:!mx-auto">
                  <GoogleLogin
                    onSuccess={(c) => void onGoogleSuccess(c)}
                    onError={() => toast.error(t('login.googleError'))}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    logo_alignment="left"
                    width={360}
                  />
                </div>
              </div>
              <p className="text-center text-xs leading-relaxed text-slate-500">{t('login.gmailOnlyHint')}</p>
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs leading-relaxed text-slate-500 dark:border-white/10">
            {t('login.termsHint')}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};
