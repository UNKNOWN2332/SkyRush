import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService, type BaseMessage, type LoginRequest, type RegisterRequest } from '../api/authService';

type Mode = 'login' | 'register';

const formatError = (err: unknown) => {
  const base = err as Partial<BaseMessage>;
  const code = typeof base.code === 'number' ? base.code : -1;
  const message = typeof base.message === 'string' ? base.message : null;
  return message ? `${code}: ${message}` : `${code}`;
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [busy, setBusy] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginRequest>({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterRequest>({ username: '', email: '', password: '' });

  const canLogin = useMemo(() => loginForm.username.trim().length > 0 && loginForm.password.length > 0, [loginForm]);
  const canRegister = useMemo(() => {
    return (
      registerForm.username.trim().length > 0 &&
      isEmail(registerForm.email.trim()) &&
      registerForm.password.length >= 6
    );
  }, [registerForm]);

  const onLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canLogin || busy) return;
    setBusy(true);
    try {
      await authService.login({ username: loginForm.username.trim(), password: loginForm.password });
      toast.success('Login successful');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setBusy(false);
    }
  };

  const onRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canRegister || busy) return;
    setBusy(true);
    try {
      await authService.register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      });
      toast.success('Register successful');
      setMode('login');
      setLoginForm({ username: registerForm.username.trim(), password: registerForm.password });
      setRegisterForm({ username: '', email: '', password: '' });
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#060915] text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-cyan-500/20 blur-3xl" />

      <div className="mx-auto flex min-h-full w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="hidden w-full max-w-xl pr-12 lg:block">
          <div className="mb-8 inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1 text-xs font-medium tracking-[0.25em] text-emerald-200">
            SKYRUSH
          </div>
          <h1 className="text-5xl font-semibold leading-tight text-white">
            Tezkor kirish,
            <br />
            premium uslub.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Uzbek ruhidagi iliq ranglar va yevropeyski minimalizm uyg‘unligida yaratilgan autentifikatsiya sahifasi.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-slate-300">Xavfsizlik</div>
              <div className="mt-1 text-white">JWT asosida</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-slate-300">Xatoliklar</div>
              <div className="mt-1 text-white">BaseMessage toast</div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_20px_70px_-25px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8">
          <div className="mb-7">
            <div className="text-2xl font-semibold text-white">Xush kelibsiz</div>
            <div className="mt-1 text-sm text-slate-300">Hisobingizga kiring yoki yangi profil yarating</div>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-black/20 p-1.5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={onLoginSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">Username</label>
                <input
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((s) => ({ ...s, username: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/30"
                  placeholder="username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/30"
                  placeholder="password"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={!canLogin || busy}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 py-3 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Yuklanmoqda...' : 'Kirish'}
              </button>
            </form>
          ) : (
            <form onSubmit={onRegisterSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">Username</label>
                <input
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((s) => ({ ...s, username: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/30"
                  placeholder="username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">Email</label>
                <input
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((s) => ({ ...s, email: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/30"
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-100">Password</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((s) => ({ ...s, password: e.target.value }))}
                  className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-300/30"
                  placeholder="minimum 6 belgi"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={!canRegister || busy}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 py-3 text-sm font-semibold text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Yuklanmoqda...' : 'Ro‘yxatdan o‘tish'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-300">
            Davom etish orqali siz platforma shartlariga rozilik bildirasiz.
          </div>
        </div>
      </div>

    </div>
  );
};
