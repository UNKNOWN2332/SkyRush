import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const SUPPORT_URL = 'https://t.me/JavaNotFoundException';
const SHARE_CHANNEL_URL = 'https://t.me/kenzo_sellerr';
const INSTAGRAM_URL = 'https://www.instagram.com/kenzogamer.uz/';

const footerBtnClass =
  'inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 dark:border-transparent dark:bg-[#2f3555] dark:text-white dark:shadow-none dark:ring-1 dark:ring-white/5 dark:hover:bg-[#3a4168] dark:hover:brightness-105';

const iconTileClass =
  'flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 dark:border-transparent dark:bg-[#2f3555] dark:text-white dark:shadow-none dark:ring-1 dark:ring-white/10 dark:hover:bg-[#3a4168]';

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function IconHeadset({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14v3a2 2 0 002 2h1M4 14a8 8 0 0116 0v3M4 14H3a1 1 0 00-1 1v2a1 1 0 001 1h1m16-4h1a1 1 0 011 1v2a1 1 0 01-1 1h-1m0-4v-3a8 8 0 00-16 0v3m12 5h1a2 2 0 002-2v-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 007.07 0l1-1a5 5 0 00-7.07-7.07l-1.5 1.5M14 11a5 5 0 00-7.07 0l-1 1a5 5 0 007.07 7.07l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();

  const copySiteUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('footer.toastCopied'));
    } catch {
      toast.error(t('footer.toastCopyFail'));
    }
  };

  return (
    <footer className="relative z-0 mt-auto border-t border-slate-200/90 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-[#070a12] dark:text-slate-200">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{t('footer.stayUpdated')}</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-500">{t('footer.stayHint')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={SHARE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={iconTileClass}
                aria-label={t('footer.telegramChannelAria')}
                title="@kenzo_sellerr"
              >
                <IconTelegram className="text-sky-300" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={iconTileClass}
                aria-label={t('footer.instagramAria')}
                title={t('footer.instagramTitle')}
              >
                <IconInstagram className="text-fuchsia-300" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className={footerBtnClass}>
              <IconHeadset className="text-emerald-300/90" />
              {t('footer.needHelp')}
            </a>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-slate-200 dark:bg-white/10" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t('footer.share')}</span>
            <button
              type="button"
              onClick={() => void copySiteUrl()}
              className={iconTileClass}
              aria-label={t('footer.copyLinkAria')}
              title={t('footer.copyLinkTitle')}
            >
              <IconLink className="text-violet-300" />
            </button>
            <a
              href={SHARE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={iconTileClass}
              aria-label={t('footer.telegramShareAria')}
              title="@kenzo_sellerr"
            >
              <IconTelegram className="text-sky-300" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={iconTileClass}
              aria-label={t('footer.instagramShareAria')}
              title={t('footer.instagramTitle')}
            >
              <IconInstagram className="text-fuchsia-300" />
            </a>
          </div>

          <div className="text-left text-xs text-slate-500 sm:text-right">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
              <span className="cursor-default hover:text-slate-700 dark:hover:text-slate-400">{t('footer.cookie')}</span>
              <span className="hidden text-slate-400 sm:inline dark:text-slate-600" aria-hidden>
                |
              </span>
              <span className="cursor-default hover:text-slate-700 dark:hover:text-slate-400">{t('footer.privacy')}</span>
              <span className="hidden text-slate-400 sm:inline dark:text-slate-600" aria-hidden>
                |
              </span>
              <span className="cursor-default hover:text-slate-700 dark:hover:text-slate-400">{t('footer.terms')}</span>
            </div>
            <p className="mt-2 text-slate-500 dark:text-slate-600">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
