import React, { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import * as THREE from "three";
import type { MeshProps } from "./types";

export const EDMO_Arm = React.forwardRef<THREE.Group, MeshProps>(
  ({ position, rotation, children, ...rest }, ref) => {
    const armSrc = useLoader(OBJLoader, "/EDMO-IDE/mesh/EDMO1-1_Arm.obj");
    const arm = useMemo(() => {
      const cloned = armSrc.clone(true);
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.3,
            roughness: 1,
          });
        }
      });
      return cloned;
    }, [armSrc]);

    return (
      <group ref={ref} position={position} rotation={rotation}>
        <primitive {...rest} object={arm} />
        {children}
      </group>
    );
  }
);

EDMO_Arm.displayName = "EDMO_Arm";

export const EDMO_Body = React.forwardRef<THREE.Group, MeshProps>(
  ({ position, rotation, children, ...rest }, ref) => {
    const bodySrc = useLoader(OBJLoader, "/EDMO-IDE/mesh/EDMO1-1_Body.obj");
    const body = useMemo(() => {
      const cloned = bodySrc.clone(true);
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.3,
            roughness: 1,
          });
        }
      });
      return cloned;
    }, [bodySrc]);

    return (
      <group ref={ref} position={position} rotation={rotation}>
        <primitive {...rest} object={body} />
        {children}
      </group>
    );
  }
);

EDMO_Body.displayName = "EDMO_Body";
