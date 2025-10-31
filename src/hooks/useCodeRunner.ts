import { useRef } from "react";
import { setServoRotation } from "../custom_blocks/setRotation";
import { sleep } from "../custom_blocks/sleep";

export function useCodeRunner() {
  const abortControllerRef = useRef<AbortController | null>(null);

  // TODO: Add some way to be able to cancel infinite loops that do not have any sleep calls
  const runCode = async (javascriptCode: string) => {
    // Abort any previous execution
    stopCode();

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

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
      const evalFunction = new AsyncFunction(...evalArgs, javascriptCode);

      await evalFunction(...evalVals);
      console.log("Execution completed");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Execution aborted");
      } else {
        console.error("Execution error:", error);
      }
    } finally {
      // Clean up if this execution completes normally
      if (abortControllerRef.current?.signal === signal) {
        abortControllerRef.current = null;
      }
    }
  };

  const stopCode = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log("Execution stopped");
    }
  };

  return { runCode, stopCode };
}
