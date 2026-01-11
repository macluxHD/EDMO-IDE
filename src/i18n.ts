import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import * as NL from "blockly/msg/nl";
import * as FR from "blockly/msg/fr";
import * as DE from "blockly/msg/de";
import * as Blockly from "blockly";

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
  setBlocklyLocale(savedLanguage || "en");

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

function setBlocklyLocale(langCode: string) {
  switch (langCode) {
    case "nl":
      // @ts-expect-error - Blockly namespace import type mismatch
      Blockly.setLocale(NL);
      break;
    case "fr":
      // @ts-expect-error - Blockly namespace import type mismatch
      Blockly.setLocale(FR);
      break;
    case "de":
      // @ts-expect-error - Blockly namespace import type mismatch
      Blockly.setLocale(DE);
      break;
  }
}

export default i18n;
export { setBlocklyLocale };
