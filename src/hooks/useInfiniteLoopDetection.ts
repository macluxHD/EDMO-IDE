import type Interpreter from "js-interpreter";
import { useState } from "react";
import { toast } from "react-toastify";

interface InfiniteLoopState {
  isWarningOpen: boolean;
  reason: "iterations" | "timeout";
  iterationCount?: number;
}

export const LOOP_TRAP_LIMIT = 1000;
export const INFINITE_LOOP_ERROR = "Infinite loop.";

export function useInfiniteLoopDetection() {
  const [infiniteLoopState, setInfiniteLoopState] = useState<InfiniteLoopState>({
    isWarningOpen: false,
    reason: "iterations",
  });

  const handleInfiniteLoopDetection = (
    reason: "iterations" | "timeout"
  ): void => {
    setInfiniteLoopState({
      isWarningOpen: true,
      reason,
      iterationCount: reason === "iterations" ? LOOP_TRAP_LIMIT : undefined,
    });
  };

  const handleCloseWarning = () => {
    setInfiniteLoopState({
      isWarningOpen: false,
      reason: "iterations",
    });
    toast.warning("Code execution was stopped due to infinite loop");
  };

  return {
    infiniteLoopState,
    handleInfiniteLoopDetection,
    handleCloseWarning,
  };
}

export function initInterpreterInfiniteLoopTrap(
  interpreter: Interpreter,
  globalObject: unknown
) {
  // Initialize loop trap counter
  interpreter.setProperty(globalObject, "LoopTrap", LOOP_TRAP_LIMIT);
}