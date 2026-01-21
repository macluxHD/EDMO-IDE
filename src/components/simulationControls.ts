import { robotWebSocket } from "../services/websocketService";

export type SetArmAngleFunction = (options?: {
  index: number;
  degrees: number;
  duration: number;
}) => void;

export type SetOscillatorFunction = (options?: {
  index: number;
  frequency: number;
  amplitude: number;
  offset: number;
  phaseShift: number;
}) => void;

export type StopOscillatorFunction = (index: number) => void;

export type GetMovablePartsCountFunction = () => number;

let setArmAngleRef: SetArmAngleFunction | null = null;
let setOscillatorRef: SetOscillatorFunction | null = null;
let stopOscillatorRef: StopOscillatorFunction | null = null;
let getMovablePartsCountRef: GetMovablePartsCountFunction | null = null;

export const setArmAngle: SetArmAngleFunction = (options) => {
  // Stop any active oscillation for this servo before setting the angle
  if (options && stopOscillatorRef) {
    stopOscillatorRef(options.index);
  }

  if (setArmAngleRef) {
    setArmAngleRef(options);
  } else {
    console.warn("setArmAngle called before Simulation component mounted");
  }

  if (options) {
    robotWebSocket.setArmAngle(options.index, options.degrees);
  }
};

export const setOscillator: SetOscillatorFunction = (options) => {
  if (setOscillatorRef) {
    setOscillatorRef(options);
  } else {
    console.warn("setOscillator called before Simulation component mounted");
  }

  if (options) {
    robotWebSocket.setOscillator(
      options.index,
      options.frequency,
      options.amplitude,
      options.offset,
      options.phaseShift,
    );
  }
};

export const registerSetArmAngle = (fn: SetArmAngleFunction) => {
  setArmAngleRef = fn;
};

export const registerSetOscillator = (fn: SetOscillatorFunction) => {
  setOscillatorRef = fn;
};

export const registerStopOscillator = (fn: StopOscillatorFunction) => {
  stopOscillatorRef = fn;
};

export const registerGetMovablePartsCount = (
  fn: GetMovablePartsCountFunction,
) => {
  getMovablePartsCountRef = fn;
};

export const getMovablePartsCount = (): number => {
  if (getMovablePartsCountRef) {
    return getMovablePartsCountRef();
  }
  console.warn(
    "getMovablePartsCount called before Simulation component mounted",
  );
  return 0;
};

export const resetAllLimbs = (): void => {
  const count = getMovablePartsCount();
  if (count === 0) return;

  for (let i = 0; i < count; i++) {
    // Reset in simulation
    if (setArmAngleRef) {
      setArmAngleRef({ index: i, degrees: 0, duration: 0.3 });
    }
    // Send reset command to robot server
    robotWebSocket.setArmAngle(i, 0);
  }
};
