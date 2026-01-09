import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { registerSetArmAngle } from "./simulationControls";
import React from "react";

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

  React.useEffect(() => {
    registerSetArmAngle(setArmAngleInternal);
  }, [setArmAngleInternal]);

  useFrame(() => {
    const now = performance.now();

    flattenedParts.forEach((_, i) => {
      const ref = partRefs.current[i];
      const state = anim.current[i];
      if (!state || !state.running || !ref) return;
      const t = THREE.MathUtils.clamp((now - state.start) / state.dur, 0, 1);
      const e = easeInOutCubic(t);

      const r = ref.rotation;
      r.x = lerpAngle(state.from.x, state.to.x, e);
      r.y = lerpAngle(state.from.y, state.to.y, e);
      r.z = lerpAngle(state.from.z, state.to.z, e);

      if (t >= 1) state.running = false;
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
          Config:
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
