import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mockLookupPlayer } from '../mock/playerCheck';
import type { CategoryCheckoutState } from '../types/categoryCheckout';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const panelClass =
  'rounded-xl border border-violet-500/45 bg-[#16162a] p-5 shadow-[0_0_28px_rgba(123,97,255,0.18)] sm:p-6';

const fieldLabelClass = 'mb-1.5 block text-xs font-medium tracking-wide text-violet-300/95';

const fieldInputClass =
  'h-12 w-full rounded-lg border border-violet-500/35 bg-[#0d0d18] px-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/25';

type CategoryPlayerPanelProps = {
  hasZoneId: boolean;
  showGuestEmail: boolean;
  profileEmail?: string;
  onSnapshotChange: (s: CategoryCheckoutState) => void;
};

export function CategoryPlayerPanel({
  hasZoneId,
  showGuestEmail,
  profileEmail,
  onSnapshotChange,
}: CategoryPlayerPanelProps) {
  const { t } = useTranslation();
  const [playerId, setPlayerId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [playerVerified, setPlayerVerified] = useState(false);

  const guestEmailRef = useRef(guestEmail);
  guestEmailRef.current = guestEmail;

  const cbRef = useRef(onSnapshotChange);
  cbRef.current = onSnapshotChange;

  const push = useCallback((s: CategoryCheckoutState) => {
    cbRef.current(s);
  }, []);

  const reqSeq = useRef(0);

  const runLookup = useCallback(async () => {
    const pid = playerId.trim();
    const zid = zoneId.trim();
    const mail = guestEmailRef.current;

    if (pid.length < 3) {
      setPlayerVerified(false);
      setDisplayName(null);
      push({ playerId: pid, zoneId: zid, playerDisplayName: null, guestEmail: mail, playerVerified: false });
      return;
    }
    if (hasZoneId && !zid) {
      setPlayerVerified(false);
      setDisplayName(null);
      push({ playerId: pid, zoneId: zid, playerDisplayName: null, guestEmail: mail, playerVerified: false });
      return;
    }

    const seq = ++reqSeq.current;
    setBusy(true);
    try {
      const res = await mockLookupPlayer({
        playerId: pid,
        zoneId: hasZoneId ? zid : null,
        hasZoneId,
      });
      if (seq !== reqSeq.current) return;
      if (res.ok && res.displayName) {
        setDisplayName(res.displayName);
        setPlayerVerified(true);
        push({
          playerId: pid,
          zoneId: zid,
          playerDisplayName: res.displayName,
          guestEmail: mail,
          playerVerified: true,
        });
      } else {
        setDisplayName(null);
        setPlayerVerified(false);
        push({
          playerId: pid,
          zoneId: zid,
          playerDisplayName: null,
          guestEmail: mail,
          playerVerified: false,
        });
      }
    } finally {
      if (seq === reqSeq.current) setBusy(false);
    }
  }, [hasZoneId, playerId, zoneId, push]);

  useEffect(() => {
    setPlayerVerified(false);
    setDisplayName(null);
    push({
      playerId: playerId.trim(),
      zoneId: zoneId.trim(),
      playerDisplayName: null,
      guestEmail: guestEmailRef.current,
      playerVerified: false,
    });
  }, [playerId, zoneId, hasZoneId, push]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void runLookup();
    }, 750);
    return () => window.clearTimeout(t);
  }, [playerId, zoneId, hasZoneId, runLookup]);

  const onBlurField = () => {
    void runLookup();
  };

  return (
    <div className={panelClass}>
      <div className={`grid gap-4 ${hasZoneId ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
        <div>
          <label className={fieldLabelClass}>{t('playerPanel.idGame')}</label>
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            onBlur={onBlurField}
            className={fieldInputClass}
            placeholder="356892037"
            autoComplete="off"
            inputMode="numeric"
          />
        </div>
        {hasZoneId ? (
          <div>
            <label className={fieldLabelClass}>{t('playerPanel.server')}</label>
            <input
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              onBlur={onBlurField}
              className={fieldInputClass}
              placeholder="9595"
              autoComplete="off"
              inputMode="numeric"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex min-h-[52px] items-center justify-between gap-3 rounded-lg border border-violet-500/30 bg-[#0d0d18]/90 px-4 py-3">
        <span className="text-sm font-medium text-violet-300/90">{t('playerPanel.player')}</span>
        <span className="max-w-[70%] truncate text-right text-sm font-semibold text-white">
          {busy ? <span className="text-violet-200/80">{t('playerPanel.checking')}</span> : null}
          {!busy && displayName ? displayName : null}
          {!busy && !displayName ? <span className="font-normal text-slate-500">—</span> : null}
        </span>
      </div>

      {showGuestEmail ? (
        <div className="mt-5 border-t border-violet-500/20 pt-5">
          <label className={fieldLabelClass}>{t('playerPanel.email')}</label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => {
              const v = e.target.value;
              setGuestEmail(v);
              cbRef.current({
                playerId: playerId.trim(),
                zoneId: zoneId.trim(),
                playerDisplayName: displayName,
                guestEmail: v,
                playerVerified,
              });
            }}
            className={fieldInputClass}
            placeholder="name@gmail.com"
            autoComplete="email"
          />
          <p className="mt-2 text-xs text-violet-200/50">{t('playerPanel.emailHint')}</p>
        </div>
      ) : (
        <div className="mt-5 border-t border-violet-500/20 pt-5 text-sm text-violet-200/70">
          {t('playerPanel.loggedInHint', { email: profileEmail ?? '—' })}
        </div>
      )}
    </div>
  );
}

export function canSelectProduct(s: CategoryCheckoutState, guestMode: boolean): boolean {
  if (!s.playerVerified) return false;
  if (guestMode && !isEmail(s.guestEmail.trim())) return false;
  return true;
}
