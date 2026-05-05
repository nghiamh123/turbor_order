import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viTranslations from './locales/vi.json';
import enTranslations from './locales/en.json';

const savedLocale = localStorage.getItem('turboorder_locale') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: viTranslations.vi },
      en: { translation: enTranslations.en },
    },
    lng: savedLocale,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

/** Change language and persist to localStorage */
export function changeLanguage(locale: 'vi' | 'en') {
  localStorage.setItem('turboorder_locale', locale);
  i18n.changeLanguage(locale);
}

export default i18n;
