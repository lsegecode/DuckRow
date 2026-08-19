import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enTickets from './locales/en/tickets.json';
import enDashboard from './locales/en/dashboard.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esTickets from './locales/es/tickets.json';
import esDashboard from './locales/es/dashboard.json';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    tickets: enTickets,
    dashboard: enDashboard,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    tickets: esTickets,
    dashboard: esDashboard,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'tickets', 'dashboard'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
