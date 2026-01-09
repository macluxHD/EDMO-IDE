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
};

export const registerSetArmAngle = (fn: SetArmAngleFunction) => {
  setArmAngleRef = fn;
};
