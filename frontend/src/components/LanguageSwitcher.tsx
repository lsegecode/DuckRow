import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage?.startsWith('es') ? 'es' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'es' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const setLanguage = (lang: 'en' | 'es') => {
    if (currentLang !== lang) {
      i18n.changeLanguage(lang);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggleLanguage}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleLanguage();
        }
      }}
      className={`relative inline-flex items-center w-[74px] h-[32px] p-1 rounded-full bg-obsidian-light border border-border/80 shadow-inner cursor-pointer select-none group hover:border-teal/50 transition-colors ${className}`}
      title={currentLang === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
    >
      {/* Sliding illuminated thumb */}
      <div
        className={`absolute top-1 bottom-1 w-[32px] rounded-full bg-gradient-to-r from-teal to-teal-glow shadow-[0_0_12px_rgba(20,184,154,0.5)] transition-all duration-300 ease-out z-0 ${
          currentLang === 'en' ? 'left-1' : 'left-[37px]'
        }`}
      />

      {/* EN option */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLanguage('en');
        }}
        className={`relative z-10 flex-1 text-center text-xs font-extrabold tracking-wider transition-colors duration-300 cursor-pointer ${
          currentLang === 'en' ? 'text-white' : 'text-text-muted hover:text-text-secondary'
        }`}
      >
        EN
      </button>

      {/* ES option */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLanguage('es');
        }}
        className={`relative z-10 flex-1 text-center text-xs font-extrabold tracking-wider transition-colors duration-300 cursor-pointer ${
          currentLang === 'es' ? 'text-white' : 'text-text-muted hover:text-text-secondary'
        }`}
      >
        ES
      </button>
    </div>
  );
}
