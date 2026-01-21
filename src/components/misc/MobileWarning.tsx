import { useTranslation } from "react-i18next";
import "./MobileWarning.css";

export default function MobileWarning() {
  const { t } = useTranslation();

  return (
    <div className="mobile-warning-overlay">
      <div className="mobile-warning-content">
        <div className="mobile-warning-icon">⚠️</div>
        <h2 className="mobile-warning-title">{t("mobileWarning.title")}</h2>
        <p className="mobile-warning-message">{t("mobileWarning.message")}</p>
        <p className="mobile-warning-hint">{t("mobileWarning.hint")}</p>
      </div>
    </div>
  );
}
