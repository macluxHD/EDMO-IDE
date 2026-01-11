import { robotWebSocket } from "../services/websocketService";

export type SetArmAngleFunction = (options?: {
  index: number;
  degrees: number;
  duration: number;
}) => void;

let setArmAngleRef: SetArmAngleFunction | null = null;

export const setArmAngle: SetArmAngleFunction = (options) => {
  if (setArmAngleRef) {
    setArmAngleRef(options);
  } else {
    console.warn("setArmAngle called before Simulation component mounted");
  }

  if (options) {
    robotWebSocket.sendCommand({
      type: "setArmAngle",
      index: options.index,
      degrees: options.degrees,
    });
  }
};

export const registerSetArmAngle = (fn: SetArmAngleFunction) => {
  setArmAngleRef = fn;
};
