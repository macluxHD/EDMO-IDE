import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ViewportGizmo } from "three-viewport-gizmo";
import { DEFAULT_ORBIT_TARGET } from "./types";
import ResetCameraButton from "./ResetCameraButton";

interface GizmoControlsProps {
  container: HTMLDivElement | null;
}

function GizmoControls({ container }: GizmoControlsProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  const gizmoRef = useRef<ViewportGizmo | null>(null);

  useEffect(() => {
    if (!container) {
      return;
    }

    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.copy(DEFAULT_ORBIT_TARGET);
    controls.update();
    controlsRef.current = controls;

    const gizmo = new ViewportGizmo(camera, gl, {
      container: container,
    });
    gizmo.attachControls(controls);
    gizmoRef.current = gizmo;

    // Handle window resize
    const handleResize = () => {
      gizmo.update();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      controls.dispose();
      gizmo.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [camera, gl, container]);

  const handleGizmoUpdate = () => {
    gizmoRef.current?.update();
  };

  useFrame(() => {
    gizmoRef.current?.render();
  });

  return (
    <ResetCameraButton controlsRef={controlsRef} onUpdate={handleGizmoUpdate} />
  );
}

export default GizmoControls;
