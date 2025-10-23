import React, { useMemo, useRef, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { registerSetArmAngle } from "./simulationControls";

interface MeshProps {
  [key: string]: unknown;
}

function EDMO_Arm(props: MeshProps) {
  const armSrc = useLoader(OBJLoader, "/EDMO-IDE/mesh/EDMO1-1_Arm.obj");
  const arm = useMemo(() => armSrc.clone(true), [armSrc]);
  return <primitive {...props} object={arm} />;
}

function EDMO_Body(props: MeshProps) {
  const bodySrc = useLoader(OBJLoader, "/EDMO-IDE/mesh/EDMO1-1_Body.obj");
  const body = useMemo(() => bodySrc.clone(true), [bodySrc]);
  return <primitive {...props} object={body} />;
}

function lerpAngle(a: number, b: number, t: number): number {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * THREE.MathUtils.clamp(t, 0, 1);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function Scene() {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  const anim = useRef({
    left: { running: false, start: 0, dur: 0.6, from: new THREE.Euler(), to: new THREE.Euler() },
    right: { running: false, start: 0, dur: 0.6, from: new THREE.Euler(), to: new THREE.Euler() },
  });

  // Add animation to queue
  const setArmAngleInternal = useCallback(
    (
      {
        side = "both",
        degrees = 0,
        duration = 0.6,
      } = {}
    ) => {
      const clampedDegrees = THREE.MathUtils.clamp(degrees, -90, 90);
      const rad = THREE.MathUtils.degToRad(clampedDegrees);

      function queue(armRef: React.RefObject<THREE.Group | null>, key: "left" | "right") {
        if (!armRef?.current) return;
        const r = armRef.current.rotation;
        
        anim.current[key].from.set(r.x, r.y, r.z);
        anim.current[key].to.set(r.x, r.y, r.z);
        anim.current[key].to.z = rad;
        
        anim.current[key].start = performance.now();
        anim.current[key].dur = Math.max(0, duration * 1000);
        anim.current[key].running = anim.current[key].dur > 0;
        if (!anim.current[key].running) {
          r.set(
            anim.current[key].to.x,
            anim.current[key].to.y,
            anim.current[key].to.z
          );
        }
      }

      if (side === "left" || side === "both") queue(leftArm, "left");
      if (side === "right" || side === "both") queue(rightArm, "right");
    },
    []
  );

  React.useEffect(() => {
    registerSetArmAngle(setArmAngleInternal);
  }, [setArmAngleInternal]);

  // Animation loop
  useFrame(() => {
    const now = performance.now();

    const animations: Array<[React.RefObject<THREE.Group | null>, "left" | "right"]> = [
      [leftArm, "left"],
      [rightArm, "right"],
    ];
    
    animations.forEach(([ref, key]) => {
      const state = anim.current[key];
      if (!state.running || !ref.current) return;
      const t = THREE.MathUtils.clamp((now - state.start) / state.dur, 0, 1);
      const e = easeInOutCubic(t);

      const r = ref.current.rotation;
      r.x = lerpAngle(state.from.x, state.to.x, e);
      r.y = lerpAngle(state.from.y, state.to.y, e);
      r.z = lerpAngle(state.from.z, state.to.z, e);

      if (t >= 1) state.running = false;
    });
  });

  /*React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") setArmAngle({ side: "both", degrees: -90, duration: 0.6 });
      if (e.key === "2") setArmAngle({ side: "both", degrees: 90, duration: 0.6 });
      if (e.key === "3") setArmAngle({ side: "both", degrees: 0, duration: 0.6 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setArmAngle]);*/

  return (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <OrbitControls />

      <group>
        <EDMO_Body rotation={[0, Math.PI, 0]} />
        <EDMO_Body />

          <EDMO_Arm ref={leftArm} position={[-3.29, 0, 0]} rotation={[0, Math.PI, Math.PI / 2]} />

          <EDMO_Arm  ref={rightArm} position={[3.29, 0, 0]} rotation={[0, 0, Math.PI / 2]}/>
      </group>
    </>
  );
}

function Simulation() {
  return (
    <Canvas camera={{position: [0,5,5]}}>
      <Scene />
    </Canvas>
  );
}

export default Simulation;