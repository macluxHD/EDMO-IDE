import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const localeKeys = ["nl", "en", "fr", "de"];

const resources = {} as Record<string, { translation: Record<string, string> }>;

(async () => {
  await Promise.all(
    localeKeys.map(async (key) => {
      const locale = await import(`./assets/locales/${key}.json`);
      resources[key] = { translation: locale };
    })
  );

  // Get saved language from localStorage
  const savedLanguage = localStorage.getItem("language");

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      supportedLngs: localeKeys,
      resources,
      fallbackLng: "en",
      lng: savedLanguage || undefined,

      interpolation: {
        escapeValue: false,
      },
    });
})();

export default i18n;