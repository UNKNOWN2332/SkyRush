import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#060915] text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-cyan-500/20 blur-3xl" />

      <BrandHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-12">
        <div className="hidden w-full max-w-xl pr-12 lg:block">
          <div className="mb-8 inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1 text-xs font-medium tracking-[0.25em] text-emerald-200">
            {t('login.badge')}
          </div>
          <h1 className="text-5xl font-semibold leading-tight text-white">
            {t('login.heroTitleLine1')}
            <br />
            {t('login.heroTitleLine2')}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">{t('login.heroText')}</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-slate-300">{t('login.cardSecurity')}</div>
              <div className="mt-1 text-white">{t('login.cardSecurityVal')}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-slate-300">{t('login.cardPrivacy')}</div>
              <div className="mt-1 text-white">{t('login.cardPrivacyVal')}</div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_20px_70px_-25px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="text-2xl font-semibold text-white">{t('login.welcome')}</div>
            <div className="mt-2 text-sm text-slate-300">{t('login.welcomeHint')}</div>
          </div>

          {!googleClientId ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              {t('login.googleMissingClient')}
            </div>
          ) : busy ? (
            <div className="py-10 text-center text-slate-400">{t('login.loading')}</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full justify-center [&>div]:!w-full [&_iframe]:!mx-auto">
                <GoogleLogin
                  onSuccess={(c) => void onGoogleSuccess(c)}
                  onError={() => toast.error(t('login.googleError'))}
                  useOneTap={false}
                  theme="filled_black"
                  size="large"
                  text="signin_with"
                  shape="pill"
                  width={320}
                />
              </div>
              <p className="text-center text-xs text-slate-500">{t('login.gmailOnlyHint')}</p>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-400">{t('login.termsHint')}</div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};
