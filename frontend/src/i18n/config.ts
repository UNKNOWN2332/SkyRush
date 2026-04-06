import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getStoredRegion, type ShopRegion } from '../lib/region';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

export function regionToLng(r: ShopRegion): 'uz' | 'ru' {
  return r === 'RU' ? 'ru' : 'uz';
}

export function syncI18nWithRegion(): void {
  void i18n.changeLanguage(regionToLng(getStoredRegion()));
}

void i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: regionToLng(getStoredRegion()),
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
});

if (typeof window !== 'undefined') {
  window.addEventListener('skyrush-region', () => {
    syncI18nWithRegion();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'skyrush_region') syncI18nWithRegion();
  });
}

export default i18n;
