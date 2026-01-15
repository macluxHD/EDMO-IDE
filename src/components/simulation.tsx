import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  registerSetArmAngle,
  registerSetOscillator,
  registerStopOscillator,
} from "./simulationControls";
import React from "react";
import { useTranslation } from "react-i18next";

interface OscillatorState {
  active: boolean;
  frequency: number;
  amplitude: number;
  offset: number;
  phaseShift: number;
  phase: number;
  startTime: number;
}

interface ConfigPart {
  type: "arm" | "body";
  isMovable: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  child?: ConfigPart;
}

interface EdmoConfig {
  id: string;
  name: string;
  file: string;
  parts: ConfigPart[];
}

interface MeshProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  children?: React.ReactNode;
}

const EDMO_Arm = React.forwardRef<THREE.Group, MeshProps>(
  ({ position, rotation, children, ...rest }, ref) => {
    const armSrc = useLoader(OBJLoader, "/EDMO-IDE/mesh/EDMO1-1_Arm.obj");
    const arm = useMemo(() => armSrc.clone(true), [armSrc]);
    return (
      <group ref={ref} position={position} rotation={rotation}>
        <primitive {...rest} object={arm} />
        {children}
      </group>
    );
  }
);

const EDMO_Body = React.forwardRef<THREE.Group, MeshProps>(
  ({ position, rotation, children, ...rest }, ref) => {
    const bodySrc = useLoader(OBJLoader, "/EDMO-IDE/mesh/EDMO1-1_Body.obj");
    const body = useMemo(() => bodySrc.clone(true), [bodySrc]);
    return (
      <group ref={ref} position={position} rotation={rotation}>
        <primitive {...rest} object={body} />
        {children}
      </group>
    );
  }
);

function lerpAngle(a: number, b: number, t: number): number {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * THREE.MathUtils.clamp(t, 0, 1);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface SceneProps {
  parts: ConfigPart[];
}

// Flatten all parts including nested children into a single array
function flattenParts(parts: ConfigPart[]): ConfigPart[] {
  const result: ConfigPart[] = [];

  function traverse(part: ConfigPart) {
    result.push(part);
    if (part.child) {
      traverse(part.child);
    }
  }

  parts.forEach(traverse);
  return result;
}

function Scene({ parts }: SceneProps) {
  const flattenedParts = useMemo(() => flattenParts(parts), [parts]);

  const partRefs = useRef<THREE.Group[]>([]);
  const initialRotations = useRef<THREE.Euler[]>([]);
  const anim = useRef<
    {
      running: boolean;
      start: number;
      dur: number;
      from: THREE.Euler;
      to: THREE.Euler;
    }[]
  >([]);

  const oscillators = useRef<OscillatorState[]>([]);

  useEffect(() => {
    const len = flattenedParts.length;

    partRefs.current = Array.from(
      { length: len },
      (_, i) => partRefs.current[i] ?? new THREE.Group()
    );

    initialRotations.current = Array.from(
      { length: len },
      (_, i) => initialRotations.current[i] ?? new THREE.Euler()
    );

    anim.current = Array.from(
      { length: len },
      (_, i) =>
        anim.current[i] ?? {
          running: false,
          start: 0,
          dur: 0.6,
          from: new THREE.Euler(),
          to: new THREE.Euler(),
        }
    );

    oscillators.current = Array.from(
      { length: len },
      (_, i) =>
        oscillators.current[i] ?? {
          active: false,
          frequency: 0,
          amplitude: 0,
          offset: 0,
          phaseShift: 0,
          phase: 0,
          startTime: 0,
        }
    );
  }, [flattenedParts]);

  const setPartRef = useCallback(
    (el: THREE.Group | null, index: number) => {
      if (el) {
        partRefs.current[index] = el;
        const part = flattenedParts[index];
        if (part && part.rotation) {
          initialRotations.current[index] = new THREE.Euler(
            part.rotation[0],
            part.rotation[1],
            part.rotation[2]
          );
        }
      }
    },
    [flattenedParts]
  );

  const setArmAngleInternal = useCallback(
    (options?: { index: number; degrees: number; duration: number }) => {
      if (!options) return;
      const { index, degrees, duration = 0.6 } = options;

      const movableParts = flattenedParts
        .map((part, i) => (part.isMovable ? i : -1))
        .filter((i) => i !== -1);

      const actualIndex = movableParts[index];
      if (actualIndex === undefined) {
        console.warn(`Arm index ${index} not found`);
        return;
      }

      const armRef = partRefs.current[actualIndex];
      const initialRotation = initialRotations.current[actualIndex];

      if (!armRef || !anim.current[actualIndex] || !initialRotation) {
        console.warn(
          `armRef, anim state, or initial rotation not found for actualIndex=${actualIndex}`
        );
        return;
      }

      if (oscillators.current[actualIndex]) {
        oscillators.current[actualIndex].active = false;
      }

      const clampedDegrees = THREE.MathUtils.clamp(degrees, -90, 90);
      const rad = THREE.MathUtils.degToRad(clampedDegrees);

      const r = armRef.rotation;
      const state = anim.current[actualIndex];

      state.from.set(r.x, r.y, r.z);
      state.to.set(
        initialRotation.x,
        initialRotation.y,
        initialRotation.z + rad
      );

      state.start = performance.now();
      state.dur = Math.max(0, duration * 1000);
      state.running = state.dur > 0;

      if (!state.running) {
        r.set(state.to.x, state.to.y, state.to.z);
      }
    },
    [flattenedParts]
  );

  const setOscillatorInternal = useCallback(
    (options?: {
      index: number;
      frequency: number;
      amplitude: number;
      offset: number;
      phaseShift: number;
      phase: number;
    }) => {
      if (!options) return;
      const { index, frequency, amplitude, offset, phaseShift, phase } =
        options;

      const movableParts = flattenedParts
        .map((part, i) => (part.isMovable ? i : -1))
        .filter((i) => i !== -1);

      const actualIndex = movableParts[index];
      if (actualIndex === undefined) {
        console.warn(`Arm index ${index} not found for oscillator`);
        return;
      }

      if (!oscillators.current[actualIndex]) {
        console.warn(
          `Oscillator state not found for actualIndex=${actualIndex}`
        );
        return;
      }

      if (anim.current[actualIndex]) {
        anim.current[actualIndex].running = false;
      }

      const osc = oscillators.current[actualIndex];
      osc.active = true;
      osc.frequency = frequency;
      osc.amplitude = amplitude;
      osc.offset = offset;
      osc.phaseShift = phaseShift;
      osc.phase = phase;
      osc.startTime = performance.now();

      console.log(
        `Oscillator started for servo ${index}: freq=${frequency}, amp=${amplitude}, offset=${offset}, phaseShift=${phaseShift}, phase=${phase}`
      );
    },
    [flattenedParts]
  );

  const stopOscillatorInternal = useCallback(
    (index: number) => {
      const movableParts = flattenedParts
        .map((part, i) => (part.isMovable ? i : -1))
        .filter((i) => i !== -1);

      const actualIndex = movableParts[index];
      if (actualIndex === undefined) {
        return;
      }

      if (oscillators.current[actualIndex]) {
        oscillators.current[actualIndex].active = false;
      }
    },
    [flattenedParts]
  );

  React.useEffect(() => {
    registerSetArmAngle(setArmAngleInternal);
    registerSetOscillator(setOscillatorInternal);
    registerStopOscillator(stopOscillatorInternal);
  }, [setArmAngleInternal, setOscillatorInternal, stopOscillatorInternal]);

  useFrame(() => {
    const now = performance.now();

    flattenedParts.forEach((part, i) => {
      const ref = partRefs.current[i];
      if (!ref) return;

      const initialRotation = initialRotations.current[i];
      const osc = oscillators.current[i];
      const state = anim.current[i];

      // Handle oscillation (takes priority over animation if active)
      if (osc && osc.active && part.isMovable) {
        const t = (now - osc.startTime) / 1000;

        // Oscillator formula: angle = amplitude * sin(2π * frequency * t + phase + phaseShift) + offset
        const angle =
          osc.amplitude *
            Math.sin(
              2 * Math.PI * osc.frequency * t + osc.phase + osc.phaseShift
            ) +
          osc.offset;

        const clampedAngle = THREE.MathUtils.clamp(angle, -90, 90);
        const rad = THREE.MathUtils.degToRad(clampedAngle);

        if (initialRotation) {
          ref.rotation.set(
            initialRotation.x,
            initialRotation.y,
            initialRotation.z + rad
          );
        }
        return;
      }

      // Handle regular animation (lerp)
      if (state && state.running) {
        const t = THREE.MathUtils.clamp((now - state.start) / state.dur, 0, 1);
        const e = easeInOutCubic(t);

        const r = ref.rotation;
        r.x = lerpAngle(state.from.x, state.to.x, e);
        r.y = lerpAngle(state.from.y, state.to.y, e);
        r.z = lerpAngle(state.from.z, state.to.z, e);

        if (t >= 1) state.running = false;
      }
    });
  });

  let partIndex = 0;
  // Recursive function to render a part and its children
  const renderPart = (part: ConfigPart, key: string): React.ReactNode => {
    const currentIndex = partIndex++;
    const childElement = part.child
      ? renderPart(part.child, `${key}-child`)
      : null;

    if (part.type === "arm") {
      return (
        <EDMO_Arm
          ref={(el: THREE.Group<THREE.Object3DEventMap>) =>
            setPartRef(el, currentIndex)
          }
          key={key}
          position={part.position}
          rotation={part.rotation}
        >
          {childElement}
        </EDMO_Arm>
      );
    } else if (part.type === "body") {
      return (
        <EDMO_Body
          ref={(el: THREE.Group<THREE.Object3DEventMap>) =>
            setPartRef(el, currentIndex)
          }
          key={key}
          position={part.position}
          rotation={part.rotation}
        >
          {childElement}
        </EDMO_Body>
      );
    }
    return null;
  };

  return (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <OrbitControls />

      <group>
        {parts.map((part: ConfigPart, index: number) =>
          renderPart(part, `part-${index}`)
        )}
      </group>
    </>
  );
}

interface SimulationProps {
  configId: string;
  onConfigChange: (configId: string) => void;
}

function Simulation({ configId, onConfigChange }: SimulationProps) {
  const { t } = useTranslation();
  const [configurations, setConfigurations] = useState<EdmoConfig[]>([]);
  const configIdRef = React.useRef(configId);
  const onConfigChangeRef = React.useRef(onConfigChange);

  React.useEffect(() => {
    configIdRef.current = configId;
    onConfigChangeRef.current = onConfigChange;
  }, [configId, onConfigChange]);

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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
      <Canvas camera={{ position: [0, 5, 5] }}>
        <Scene parts={selectedConfig?.parts ?? []} />
      </Canvas>
    </div>
  );
}

export default Simulation;
