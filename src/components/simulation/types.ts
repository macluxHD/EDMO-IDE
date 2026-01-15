import * as THREE from "three";

export interface OscillatorState {
  active: boolean;
  frequency: number;
  amplitude: number;
  offset: number;
  phaseShift: number;
  startTime: number;
}

export interface ConfigPart {
  type: "arm" | "body";
  isMovable: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  child?: ConfigPart;
}

export interface EdmoConfig {
  id: string;
  name: string;
  file: string;
  parts: ConfigPart[];
}

export interface MeshProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  children?: React.ReactNode;
}

export interface AnimationState {
  running: boolean;
  start: number;
  dur: number;
  from: THREE.Euler;
  to: THREE.Euler;
}

export const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 5, 5];
export const DEFAULT_ORBIT_TARGET = new THREE.Vector3(0, 0, 0);
