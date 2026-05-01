import { useEffect, useMemo, useState } from 'react'
import ar from './ar.json'
import en from './en.json'
import { I18nContext } from './i18nContext'

const LANGUAGE_STORAGE_KEY = 'choco-admin-language'
const dictionaries = { en, ar }

const getNestedValue = (source, path) => {
  return path.split('.').reduce((current, key) => current?.[key], source)
}

const interpolate = (value, params = {}) => {
  return Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{{${key}}}`, String(replacement ?? '')),
    value,
  )
}

const getInitialLanguage = () => {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (storedLanguage === 'ar' || storedLanguage === 'en') return storedLanguage
  return 'ar'
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage)
  const direction = language === 'ar' ? 'rtl' : 'ltr'
  const isRtl = direction === 'rtl'

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
    document.documentElement.dir = direction
  }, [direction, language])

  const value = useMemo(() => {
    const t = (key, params) => {
      const translatedValue = getNestedValue(dictionaries[language], key)
      const fallbackValue = getNestedValue(dictionaries.en, key)
      const valueToUse = translatedValue ?? fallbackValue ?? key

      return typeof valueToUse === 'string' ? interpolate(valueToUse, params) : key
    }

    const toggleLanguage = () => setLanguage((current) => (current === 'ar' ? 'en' : 'ar'))

    return {
      direction,
      isRtl,
      language,
      setLanguage,
      t,
      toggleLanguage,
    }
  }, [direction, isRtl, language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
