import { useTranslation } from "react-i18next";
import "./InfiniteLoopWarning.css";

interface InfiniteLoopWarningProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "iterations" | "timeout";
  iterationCount?: number;
}

export default function InfiniteLoopWarning({
  isOpen,
  onClose,
  reason,
  iterationCount,
}: InfiniteLoopWarningProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const message =
    reason === "iterations"
        ? t('infiniteLoop.iterations', { count: iterationCount })
        : t('infiniteLoop.timeout');

  return (
    <div className="loop-modal-overlay" onClick={onClose}>
      <div className="loop-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="loop-modal-icon">⚠️</div>
        <h2 className="loop-modal-title">{t('infiniteLoop.title')}</h2>
        <p className="loop-modal-message">{message}</p>
        <p className="loop-modal-hint">
          {t('infiniteLoop.hint')}
        </p>
        <pre className="loop-modal-code">
          <code>
{`repeat while true do
  set rotation of servo 0 to angle 90
end`}
          </code>
        </pre>
        <button className="loop-modal-btn" onClick={onClose}>
          {t('infiniteLoop.closeButton')}
        </button>
      </div>
    </div>
  );
}

