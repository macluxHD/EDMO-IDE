import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import type { EdmoConfig } from "./types";
import { DEFAULT_CAMERA_POSITION } from "./types";

interface SimulationProps {
  configId: string;
  configurations: EdmoConfig[];
}

function Simulation({ configId, configurations }: SimulationProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const resizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        setCanvasKey((key) => key + 1);
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

  const selectedConfig = configurations.find((config) => config.id === configId);

  return (
    <div
      ref={setContainer}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
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
