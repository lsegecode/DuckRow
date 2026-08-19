import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export default function LanguageSwitcher({ variant = 'compact', className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage?.startsWith('es') ? 'es' : 'en';

  const toggleLanguage = (lang: 'en' | 'es') => {
    i18n.changeLanguage(lang);
  };

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-1 bg-obsidian p-1 rounded-xl border border-border ${className}`}>
        <button
          type="button"
          onClick={() => toggleLanguage('en')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            currentLang === 'en'
              ? 'bg-teal/20 text-teal-glow border border-teal/30 shadow-[var(--shadow-glow-teal)]'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>🇺🇸</span>
          <span>EN</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLanguage('es')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            currentLang === 'es'
              ? 'bg-teal/20 text-teal-glow border border-teal/30 shadow-[var(--shadow-glow-teal)]'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <span>🇪🇸</span>
          <span>ES</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center bg-obsidian/60 p-1 rounded-lg border border-border/80 ${className}`}>
      <button
        type="button"
        onClick={() => toggleLanguage('en')}
        className={`px-2 py-1 rounded text-xs font-bold transition-all ${
          currentLang === 'en'
            ? 'bg-teal text-white shadow-sm'
            : 'text-text-muted hover:text-text-secondary'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage('es')}
        className={`px-2 py-1 rounded text-xs font-bold transition-all ${
          currentLang === 'es'
            ? 'bg-teal text-white shadow-sm'
            : 'text-text-muted hover:text-text-secondary'
        }`}
        title="Español"
      >
        ES
      </button>
    </div>
  );
}
