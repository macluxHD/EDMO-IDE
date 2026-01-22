import React, { useMemo, useEffect, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  registerSetArmAngle,
  registerSetOscillator,
  registerStopOscillator,
  registerGetMovablePartsCount,
} from "../simulationControls";
import type { ConfigPart, OscillatorState, AnimationState } from "./types";
import { lerpAngle, easeInOutCubic } from "./animations";
import { EDMO_Arm, EDMO_Body, EDMO_ArmV2, EDMO_BodyV2 } from "./EdmoMeshes";
import GizmoControls from "./GizmoControls";
import { getServoLetter, getServoColor } from "../../utils/servoUtils";
import { updateServoCount } from "../../custom_blocks/setRotation";

interface SceneProps {
  parts: ConfigPart[];
  container: HTMLDivElement | null;
}

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

function Scene({ parts, container }: SceneProps) {
  const flattenedParts = useMemo(() => flattenParts(parts), [parts]);

  const partRefs = useRef<THREE.Group[]>([]);
  const initialRotations = useRef<THREE.Euler[]>([]);
  const anim = useRef<AnimationState[]>([]);
  const oscillators = useRef<OscillatorState[]>([]);

  // Initialize refs arrays when parts change
  useEffect(() => {
    const len = flattenedParts.length;

    partRefs.current = Array.from(
      { length: len },
      (_, i) => partRefs.current[i] ?? new THREE.Group(),
    );

    initialRotations.current = Array.from(
      { length: len },
      (_, i) => initialRotations.current[i] ?? new THREE.Euler(),
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
        },
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
          startTime: 0,
        },
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
            part.rotation[2],
          );
        }
      }
    },
    [flattenedParts],
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
          `armRef, anim state, or initial rotation not found for actualIndex=${actualIndex}`,
        );
        return;
      }

      if (oscillators.current[actualIndex]) {
        oscillators.current[actualIndex].active = false;
      }

      const clampedDegrees = THREE.MathUtils.clamp(degrees, -90, 90);
      const part = flattenedParts[actualIndex];
      const flipMultiplier = part?.flip ? -1 : 1;
      const rad = THREE.MathUtils.degToRad(clampedDegrees) * flipMultiplier;

      const r = armRef.rotation;
      const state = anim.current[actualIndex];

      state.from.set(r.x, r.y, r.z);
      state.to.set(
        initialRotation.x,
        initialRotation.y,
        initialRotation.z + rad,
      );

      state.start = performance.now();
      state.dur = Math.max(0, duration * 1000);
      state.running = state.dur > 0;

      if (!state.running) {
        r.set(state.to.x, state.to.y, state.to.z);
      }
    },
    [flattenedParts],
  );

  const setOscillatorInternal = useCallback(
    (options?: {
      index: number;
      frequency: number;
      amplitude: number;
      offset: number;
      phaseShift: number;
    }) => {
      if (!options) return;
      const { index, frequency, amplitude, offset, phaseShift } = options;

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
          `Oscillator state not found for actualIndex=${actualIndex}`,
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
      osc.startTime = performance.now();

      console.log(
        `Oscillator started for servo ${index}: freq=${frequency}, amp=${amplitude}, offset=${offset}, phaseShift=${phaseShift}`,
      );
    },
    [flattenedParts],
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
    [flattenedParts],
  );

  const getMovablePartsCountInternal = useCallback(() => {
    return flattenedParts.filter((part) => part.isMovable).length;
  }, [flattenedParts]);

  const movablePartsIndices = useMemo(() => {
    return flattenedParts
      .map((part, i) => (part.isMovable ? i : -1))
      .filter((i) => i !== -1);
  }, [flattenedParts]);

  useEffect(() => {
    const count = movablePartsIndices.length;
    updateServoCount(count);
  }, [movablePartsIndices.length]);

  // Register control callbacks
  React.useEffect(() => {
    registerSetArmAngle(setArmAngleInternal);
    registerSetOscillator(setOscillatorInternal);
    registerStopOscillator(stopOscillatorInternal);
    registerGetMovablePartsCount(getMovablePartsCountInternal);
  }, [
    setArmAngleInternal,
    setOscillatorInternal,
    stopOscillatorInternal,
    getMovablePartsCountInternal,
  ]);

  // Animation frame loop
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

        // Oscillator formula: angle = amplitude * sin(2π * frequency * t + phaseShift) + offset
        const angle =
          osc.amplitude *
          Math.sin(2 * Math.PI * osc.frequency * t + osc.phaseShift) +
          osc.offset;

        // map 0 to 180 degrees to -90 to 90
        const mappedAngle = angle - 90;
        const clampedAngle = THREE.MathUtils.clamp(mappedAngle, -90, 90);
        const flipMultiplier = part.flip ? -1 : 1;
        const rad = THREE.MathUtils.degToRad(clampedAngle) * flipMultiplier;

        if (initialRotation) {
          ref.rotation.set(
            initialRotation.x,
            initialRotation.y,
            initialRotation.z + rad,
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

  const renderServoLabel = useCallback(
    (
      partIndex: number,
      servoIndex: number,
      position: [number, number, number],
      configColor?: string,
    ) => {
      const letter = getServoLetter(servoIndex);
      const color = getServoColor(servoIndex, configColor);
      return (
        <Text
          key={`servo-label-${partIndex}`}
          position={[position[0], position[1] + 1.5, position[2]]}
          fontSize={0.6}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {letter}
        </Text>
      );
    },
    [],
  );

  const renderPart = (part: ConfigPart, key: string): React.ReactNode => {
    const currentIndex = partIndex++;
    const childElement = part.child
      ? renderPart(part.child, `${key}-child`)
      : null;

    const servoIndex = movablePartsIndices.indexOf(currentIndex);
    const showLabel = part.isMovable && servoIndex !== -1;

    if (part.type === "arm") {
      return (
        <group key={key}>
          <EDMO_Arm
            ref={(el: THREE.Group<THREE.Object3DEventMap>) =>
              setPartRef(el, currentIndex)
            }
            position={part.position}
            rotation={part.rotation}
            color={part.color}
          >
            {childElement}
          </EDMO_Arm>
          {showLabel &&
            renderServoLabel(
              currentIndex,
              servoIndex,
              part.position,
              part.color,
            )}
        </group>
      );
    } else if (part.type === "body") {
      return (
        <group key={key}>
          <EDMO_Body
            ref={(el: THREE.Group<THREE.Object3DEventMap>) =>
              setPartRef(el, currentIndex)
            }
            position={part.position}
            rotation={part.rotation}
            color={part.color}
          >
            {childElement}
          </EDMO_Body>
          {showLabel &&
            renderServoLabel(
              currentIndex,
              servoIndex,
              part.position,
              part.color,
            )}
        </group>
      );
    } else if (part.type === "armv2") {
      return (
        <group key={key}>
          <EDMO_ArmV2
            ref={(el: THREE.Group<THREE.Object3DEventMap>) =>
              setPartRef(el, currentIndex)
            }
            position={part.position}
            rotation={part.rotation}
            color={part.color}
          >
            {childElement}
          </EDMO_ArmV2>
          {showLabel &&
            renderServoLabel(
              currentIndex,
              servoIndex,
              part.position,
              part.color,
            )}
        </group>
      );
    } else if (part.type === "bodyv2") {
      return (
        <group key={key}>
          <EDMO_BodyV2
            ref={(el: THREE.Group<THREE.Object3DEventMap>) =>
              setPartRef(el, currentIndex)
            }
            position={part.position}
            rotation={part.rotation}
            color={part.color}
          >
            {childElement}
          </EDMO_BodyV2>
          {showLabel &&
            renderServoLabel(
              currentIndex,
              servoIndex,
              part.position,
              part.color,
            )}
        </group>
      );
    }
    return null;
  };

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={1} />

      {/* Main directional light with shadows */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill light from opposite side */}
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />

      <hemisphereLight args={[0x87ceeb, 0x362d1e]} />

      <GizmoControls container={container} />

      <group>
        {parts.map((part: ConfigPart, index: number) =>
          renderPart(part, `part-${index}`),
        )}
      </group>
    </>
  );
}

export default Scene;
