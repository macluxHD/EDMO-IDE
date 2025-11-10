import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { setServoRotation } from "../custom_blocks/setRotation";
import { sleep } from "../custom_blocks/sleep";
import { injectLoopGuards, getMaxIterations, type InfiniteLoopState } from "../utils/injectLoopGuards";

const EXECUTION_TIMEOUT_MS = 30000;
  
export function useCodeRunner() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [infiniteLoopState, setInfiniteLoopState] = useState<InfiniteLoopState>({
    isWarningOpen: false,
    reason: "iterations",
  });

  const runCode = async (javascriptCode: string) => {
    // Abort any previous execution
    const hadPreviousExecution = abortControllerRef.current !== null;
    stopCode();
    
    if (hadPreviousExecution) {
      toast.info("Previous execution stopped, starting new execution");
    }

    // inject loop guards to detect infinite loops
    const guardedCode = injectLoopGuards(javascriptCode);
    
    // console.log("===== CODE TO EXECUTE =====");
    // console.log(guardedCode);
    // console.log("===========================");

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // setup execution timeout
    const timeoutId = setTimeout(() => {
      handleInfiniteLoopDetection("timeout");
    }, EXECUTION_TIMEOUT_MS);

    try {
      const evalContext = {
        setServoRotation,
        sleep: sleep(signal),
      };
      const evalArgs = Object.keys(evalContext);
      const evalVals = Object.values(evalContext);
      const AsyncFunction = Object.getPrototypeOf(
        async function () {}
      ).constructor;
      const evalFunction = new AsyncFunction(...evalArgs, guardedCode);

      await evalFunction(...evalVals);
      clearTimeout(timeoutId);
      toast.success("Code execution completed successfully");
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === "AbortError") {
        // Silent - user stopped it or new execution started
      } else if (error instanceof Error && error.message === "INFINITE_LOOP_DETECTED") {
        handleInfiniteLoopDetection("iterations");
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Execution error: ${errorMessage}`, {
          autoClose: 10000,
        });
        console.error("Execution error:", error);
      }
    } finally {
      clearTimeout(timeoutId);
      // Clean up if this execution completes normally
      if (abortControllerRef.current?.signal === signal) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleInfiniteLoopDetection = (
    reason: "iterations" | "timeout"
  ): void => {
    stopCode();
    setInfiniteLoopState({
      isWarningOpen: true,
      reason,
      iterationCount: reason === "iterations" ? getMaxIterations() : undefined,
    });
  };

  const handleCloseWarning = () => {
    setInfiniteLoopState({
      isWarningOpen: false,
      reason: "iterations",
    });
    toast.warning("Code execution was stopped due to infinite loop");
  };

  const stopCode = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return { 
    runCode, 
    stopCode,
    infiniteLoopState,
    handleCloseWarning,
  };
}
