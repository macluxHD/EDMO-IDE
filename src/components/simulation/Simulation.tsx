import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useTranslation } from "react-i18next";
import Scene from "./Scene";
import type { EdmoConfig } from "./types";
import { DEFAULT_CAMERA_POSITION } from "./types";

interface SimulationProps {
  configId: string;
  onConfigChange: (configId: string) => void;
}

function Simulation({ configId, onConfigChange }: SimulationProps) {
  const { t } = useTranslation();
  const [configurations, setConfigurations] = useState<EdmoConfig[]>([]);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const configIdRef = useRef(configId);
  const onConfigChangeRef = useRef(onConfigChange);

  // Track container size for Canvas resize - debounced to avoid excessive remounts
  const [canvasKey, setCanvasKey] = useState(0);
  const resizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    configIdRef.current = configId;
    onConfigChangeRef.current = onConfigChange;
  }, [configId, onConfigChange]);

  // Observe container resize and debounce Canvas remount
  useEffect(() => {
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Debounce: only update key after resize stops for 150ms
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        setCanvasKey((k) => k + 1);
      }, 150);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [container]);

  // Load configurations from manifest
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        const manifestRes = await fetch(
          "/EDMO-IDE/edmoConfigurations/manifest.json"
        );
        const fileList: string[] = await manifestRes.json();

        const configs = await Promise.all(
          fileList.map(async (file) => {
            const res = await fetch(`/EDMO-IDE/edmoConfigurations/${file}`);
            const data = await res.json();
            return { ...data, file } as EdmoConfig;
          })
        );

        setConfigurations(configs);
        if (configs.length > 0 && configIdRef.current === "") {
          onConfigChangeRef.current(configs[0].id);
        }
      } catch {
        setConfigurations([]);
      }
    };
    loadConfigurations();
  }, []);

  const selectedConfig = configurations.find((c) => c.id === configId);

  return (
    <div
      ref={setContainer}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* Configuration selector */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <label
          htmlFor="config-select"
          style={{
            color: "var(--muted)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {t("simulation.configselector")}:
        </label>
        <select
          id="config-select"
          value={configId}
          onChange={(e) => onConfigChange(e.target.value)}
          style={{
            background: "var(--panel-2)",
            color: "var(--text)",
            border: "1px solid #444",
            borderRadius: "var(--radius)",
            padding: "4px 8px",
            fontSize: "0.8rem",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {configurations.map((cfg) => (
            <option key={cfg.id} value={cfg.id}>
              {cfg.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3D Canvas - key forces proper resize after debounce */}
      <Canvas
        key={canvasKey}
        shadows
        camera={{ position: DEFAULT_CAMERA_POSITION }}
        onCreated={({ gl }) => {
          gl.autoClear = false;
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene parts={selectedConfig?.parts ?? []} container={container} />
      </Canvas>
    </div>
  );
}

export default Simulation;
