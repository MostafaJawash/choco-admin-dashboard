import { Globe2 } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'

export default function LanguageToggle({ className = '' }) {
  const { language, t, toggleLanguage } = useI18n()
  const nextLanguageLabel = language === 'ar' ? t('language.english') : t('language.arabic')
  const ariaLabel = language === 'ar' ? t('language.switchToEnglish') : t('language.switchToArabic')

  return (
    <button
      type="button"
      className={`btn-secondary min-h-11 w-full ${className}`}
      onClick={toggleLanguage}
      aria-label={ariaLabel}
    >
      <Globe2 size={16} />
      {language === 'ar' ? '🌐' : '🌍'} {nextLanguageLabel}
    </button>
  )
}
