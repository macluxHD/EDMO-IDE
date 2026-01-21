import { useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DEFAULT_CAMERA_POSITION, DEFAULT_ORBIT_TARGET } from "./types";

interface ResetCameraButtonProps {
  controlsRef: React.MutableRefObject<{
    target: THREE.Vector3;
    update: () => void;
  } | null>;
  onUpdate?: () => void;
}

function ResetCameraButton({ controlsRef, onUpdate }: ResetCameraButtonProps) {
  const { camera, size } = useThree();

  const handleReset = useCallback(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...DEFAULT_CAMERA_POSITION);
    const startTarget = controls.target.clone();
    const endTarget = DEFAULT_ORBIT_TARGET.clone();

    const duration = 500; // ms
    const startTime = performance.now();

    const animateReset = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      camera.position.lerpVectors(startPos, endPos, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();
      onUpdate?.();

      if (t < 1) {
        requestAnimationFrame(animateReset);
      }
    };

    animateReset();
  }, [camera, controlsRef, onUpdate]);

  return (
    <Html
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        transform: "none",
      }}
      calculatePosition={() => [size.width - 52, size.height - 52]}
      zIndexRange={[99, 99]}
    >
      <button
        onClick={handleReset}
        title="Reset camera to default position"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "1px solid #ccc",
          background: "rgba(255, 255, 255, 0.9)",
          color: "#333",
          fontSize: "18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(245, 245, 245, 0.95)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
        }}
      >
        ⌂
      </button>
    </Html>
  );
}

export default ResetCameraButton;
