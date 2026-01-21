import type { EdmoConfig } from "./simulation/types";
import { useTranslation } from "react-i18next";

const THUMBNAIL_OVERRIDES: Record<string, string> = {
  robot_arm: "arm.png",
  biped: "biped.png",
  snake: "snake.png",
  starfish: "starfish.png",
};

interface ModelSelectionOverlayProps {
  isOpen: boolean;
  configurations: EdmoConfig[];
  isLoading: boolean;
  error: string | null;
  onModelSelect: (configId: string) => void;
}

export default function ModelSelectionOverlay({
  isOpen,
  configurations,
  isLoading,
  error,
  onModelSelect,
}: ModelSelectionOverlayProps) {
  const { t } = useTranslation();
  const baseUrl = import.meta.env.BASE_URL ?? "/";

  if (!isOpen) return null;

  return (
    <div className="model-selection-overlay">
      <div className="model-selection-panel">
        <p className="model-selection-kicker">
          {t("modelSelection.caption")}
        </p>
        <h1 className="model-selection-title">
          {t("modelSelection.title")}
        </h1>
        <p className="model-selection-description">
          {t("modelSelection.description")}
        </p>

        {isLoading && (
          <p className="model-selection-loading">
            {t("modelSelection.loading")}
          </p>
        )}

        {error && (
          <p className="model-selection-error">
            {t("modelSelection.error", { message: error })}
          </p>
        )}

        {!isLoading && !error && configurations.length > 0 && (
          <div className="model-selection-grid">
            {configurations.map((config) => (
              <button
                key={config.id}
                type="button"
                className="model-selection-card"
                onClick={() => onModelSelect(config.id)}
              >
                <img
                  className="model-selection-card-image"
                  src={`${baseUrl}robot-thumbnails/${
                    THUMBNAIL_OVERRIDES[config.id] ?? `${config.id}.png`
                  }`}
                  alt={config.name}
                  loading="lazy"
                />
                <span className="model-selection-card-name">{config.name}</span>
              </button>
            ))}
          </div>
        )}
        {!isLoading && !error && configurations.length === 0 && (
          <p className="model-selection-error">
            {t("modelSelection.noModels")}
          </p>
        )}
      </div>
    </div>
  );
}
