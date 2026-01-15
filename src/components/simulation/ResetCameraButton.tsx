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
      zIndexRange={[1001, 1001]}
    >
      <button
        onClick={handleReset}
        title="Reset camera to default position"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "1px solid #555",
          background: "rgba(50, 50, 50, 0.8)",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(80, 80, 80, 0.9)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(50, 50, 50, 0.8)";
        }}
      >
        ⌂
      </button>
    </Html>
  );
}

export default ResetCameraButton;
