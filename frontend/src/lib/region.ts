import { useEffect, useState } from 'react';

export type ShopRegion = 'UZ' | 'RU';

const KEY = 'skyrush_region';

export const REGIONS: { code: ShopRegion }[] = [{ code: 'UZ' }, { code: 'RU' }];

export function getStoredRegion(): ShopRegion {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'RU' || v === 'UZ') return v;
  } catch {
    /* ignore */
  }
  return 'UZ';
}

export function setStoredRegion(r: ShopRegion): void {
  try {
    localStorage.setItem(KEY, r);
  } catch {
    /* ignore */
  }
}

export function useShopRegion(): ShopRegion {
  const [region, setRegion] = useState<ShopRegion>(() => getStoredRegion());

  useEffect(() => {
    const sync = () => setRegion(getStoredRegion());
    window.addEventListener('skyrush-region', sync as EventListener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('skyrush-region', sync as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return region;
}
