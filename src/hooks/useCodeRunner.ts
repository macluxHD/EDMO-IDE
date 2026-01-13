import { toast } from "react-toastify";
import Interpreter from "js-interpreter";
import "../custom_blocks/sleep"; // Import for Blockly block definition
import { initInterpreterSetRotation } from "../custom_blocks/setRotation";
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly";
import { v4 as uuidv4 } from "uuid";
import {
  useInfiniteLoopDetection,
  initInterpreterInfiniteLoopTrap,
  INFINITE_LOOP_ERROR,
} from "./useInfiniteLoopDetection";
import { useTranslation } from "react-i18next";
import "../custom_blocks/start";
import { t } from "i18next";
import { useState } from "react";

const interpreters = new Map<string, Interpreter | null>();
const highlightedBlocks = new Map<string, string | null>();
const runners = new Map<string, () => void>();
const highlightPauseFlags = new Map<string, boolean>();
const waitingForAsyncFlags = new Map<string, boolean>();

type ExecutionMode = 'continuous' | 'step';
let currentExecutionMode: ExecutionMode = 'continuous';
let isPausedGlobal = false;

function setHighlighted(
  blockId: string | null | undefined,
  workspace: Blockly.Workspace,
  highlighted: boolean
) {
  if (blockId) {
    const block = workspace.getBlockById(blockId);
    if (block) {
      (block as Blockly.BlockSvg).setHighlighted(highlighted);
    }
  }
}

function initApi(
  interpreter: Interpreter,
  globalObject: unknown,
  workspace: Blockly.Workspace,
  interpreterId: string,
  setIsWaitingForAsync: (value: boolean) => void
) {
  // Add an API function for the alert() block.
  interpreter.setProperty(
    globalObject,
    "alert",
    interpreter.createNativeFunction(function (text: string) {
      return alert(arguments.length ? text : "");
    })
  );

  // Add an API function for the prompt() block.
  interpreter.setProperty(
    globalObject,
    "prompt",
    interpreter.createNativeFunction(function (text: string) {
      return prompt(text);
    })
  );

  // Add an API function for highlighting blocks.
  interpreter.setProperty(
    globalObject,
    "highlightBlock",
    interpreter.createNativeFunction(function (id) {
      const blockId = id ? String(id) : null;
      console.log("🔆 Highlighting block:", blockId);

      // Unhighlight the previously highlighted block for this interpreter
      const previousBlockId = highlightedBlocks.get(interpreterId);
      setHighlighted(previousBlockId, workspace, false);

      // Highlight the new block
      setHighlighted(blockId, workspace, true);
      highlightedBlocks.set(interpreterId, blockId);

      // In step mode, set the pause flag after highlighting
      if (currentExecutionMode === 'step') {
        highlightPauseFlags.set(interpreterId, true);
      }
    })
  );

  // Initialize sleep with async handling
  initInterpreterSleepWithAsync(interpreter, globalObject, interpreterId, setIsWaitingForAsync);
  initInterpreterSetRotation(interpreter, globalObject);
  initInterpreterInfiniteLoopTrap(interpreter, globalObject);
}

// Custom sleep implementation that tracks async state
function initInterpreterSleepWithAsync(
  interpreter: Interpreter,
  globalObject: unknown,
  interpreterId: string,
  setIsWaitingForAsync: (value: boolean) => void
) {
  javascriptGenerator.addReservedWords('sleep');

  const wrapper = interpreter.createAsyncFunction(
    function(seconds: number, callback: () => void) {
      console.log(`⏰ Sleep(${seconds}s) starting - async operation beginning`);
      
      // Mark that we're waiting for async operation
      waitingForAsyncFlags.set(interpreterId, true);
      setIsWaitingForAsync(true);
      
      setTimeout(() => {
        console.log(`⏰ Sleep(${seconds}s) complete - resuming execution`);
        
        // Clear the waiting flag
        waitingForAsyncFlags.set(interpreterId, false);
        
        // Check if all interpreters are done waiting
        let anyWaiting = false;
        waitingForAsyncFlags.forEach(waiting => {
          if (waiting) anyWaiting = true;
        });
        setIsWaitingForAsync(anyWaiting);
        
        // Call the callback to continue interpreter execution
        callback();
        
        // After callback, resume execution
        const runner = runners.get(interpreterId);
        if (runner) {
          if (currentExecutionMode === 'continuous') {
            // In continuous mode, keep running
            console.log("▶️ Continuous mode: auto-resuming after sleep");
            runner();
          } else {
            // In step mode, execute until next highlight, then pause
            console.log("⏭️ Step mode: executing to next highlight after sleep");
            highlightPauseFlags.set(interpreterId, false);
            runner();
          }
        }
      }, seconds * 1000);
    }
  );
  interpreter.setProperty(globalObject, 'sleep', wrapper);
}

function runCode(
  code: string,
  handleInfiniteLoopDetection: (reason: "iterations" | "timeout") => void,
  workspace: Blockly.Workspace,
  setIsPaused: (value: boolean) => void,
  setIsWaitingForAsync: (value: boolean) => void
) {
  const interpreterId = uuidv4();
  interpreters.set(
    interpreterId,
    new Interpreter(code, (interpreter, globalObject) =>
      initApi(interpreter, globalObject, workspace, interpreterId, setIsWaitingForAsync)
    )
  );

  waitingForAsyncFlags.set(interpreterId, false);

  const runner = () => {
    const interpreter = interpreters.get(interpreterId);
    if (!interpreter) return;

    // Check if we're waiting for an async operation (like sleep)
    const isWaiting = waitingForAsyncFlags.get(interpreterId);
    if (isWaiting) {
      // Don't execute while waiting - the callback will call runner() when ready
      console.log("⏸️ Waiting for async operation (sleep) to complete");
      return;
    }

    // If paused in step mode (and not waiting for async), wait for user to click Step
    if (currentExecutionMode === 'step' && isPausedGlobal) {
      console.log("⏸️ Paused in step mode - waiting for Step button");
      return;
    }

    let hasMore = false;

    try {
      if (currentExecutionMode === 'step') {
        // In step mode: execute steps until we hit a highlightBlock() call
        // Reset the highlight pause flag
        highlightPauseFlags.set(interpreterId, false);
        
        // Keep stepping until:
        // 1. We hit a highlightBlock() call (highlightPause becomes true)
        // 2. There's no more code to execute
        // 3. We hit the maximum safety limit
        let stepsExecuted = 0;
        const MAX_STEPS = 100000;
        
        while (stepsExecuted < MAX_STEPS) {
          hasMore = interpreter.step();
          stepsExecuted++;
          
          // If highlightBlock was called, we've completed one user-visible step
          if (highlightPauseFlags.get(interpreterId)) {
            console.log("✅ Step complete after", stepsExecuted, "internal steps");
            break;
          }
          
          // If no more code to execute, we're done
          if (!hasMore) {
            console.log("✅ Execution complete");
            break;
          }
        }
        
        if (stepsExecuted >= MAX_STEPS) {
          console.warn("⚠️ Reached max steps in step mode - possible infinite loop");
        }
        
      } else {
        // In continuous mode: run normally
        hasMore = interpreter.run();
      }
    } catch (error) {
      if (error === INFINITE_LOOP_ERROR) {
        handleInfiniteLoopDetection("iterations");
      } else {
        console.error("Code execution error:", error);
        toast.error(t("codeRunner.error"));
      }

      // Unhighlight the block for this interpreter
      setHighlighted(highlightedBlocks.get(interpreterId), workspace, false);

      interpreters.delete(interpreterId);
      highlightedBlocks.delete(interpreterId);
      runners.delete(interpreterId);
      highlightPauseFlags.delete(interpreterId);
      waitingForAsyncFlags.delete(interpreterId);
      isPausedGlobal = false;
      setIsPaused(false);
      setIsWaitingForAsync(false);
      return;
    }

    if (hasMore) {
      // Check again if we're now waiting for an async operation
      const isNowWaiting = waitingForAsyncFlags.get(interpreterId);
      
      if (isNowWaiting) {
        // Async operation started during this step - the callback will resume
        console.log("⏸️ Async operation started - waiting for completion");
        return;
      }
      
      // In step mode, pause after highlighting a block
      if (currentExecutionMode === 'step') {
        isPausedGlobal = true;
        setIsPaused(true);
        console.log("⏸️ Paused after step - waiting for next Step button press");
        return;
      }

      // In continuous mode, keep going
      window.setTimeout(runner, 10);
    } else {
      // Execution completed
      if (interpreters.size === 1) {
        toast.success(t("codeRunner.success"));
      }

      // Unhighlight the block for this interpreter
      setHighlighted(highlightedBlocks.get(interpreterId), workspace, false);

      interpreters.delete(interpreterId);
      highlightedBlocks.delete(interpreterId);
      runners.delete(interpreterId);
      highlightPauseFlags.delete(interpreterId);
      waitingForAsyncFlags.delete(interpreterId);
      
      // Reset paused state when execution completes
      if (interpreters.size === 0) {
        isPausedGlobal = false;
        setIsPaused(false);
        setIsWaitingForAsync(false);
      }
    }
  };

  // Store runner so stepForward() can call it
  runners.set(interpreterId, runner);

  runner();
}

export function useCodeRunner() {
  const { t } = useTranslation();
  const { infiniteLoopState, handleInfiniteLoopDetection, handleCloseWarning } =
    useInfiniteLoopDetection();

  const [executionMode, setExecutionMode] = useState<ExecutionMode>('continuous');
  const [isPaused, setIsPaused] = useState(false);
  const [isWaitingForAsync, setIsWaitingForAsync] = useState(false);

  const runCodes = async (workspace: Blockly.Workspace, mode: ExecutionMode = 'continuous') => {
    const allBlocks = workspace.getAllBlocks(false);
    const startBlock = allBlocks.filter((block) => block.type === "start");

    if (startBlock.length === 0) return;

    // Set execution mode
    currentExecutionMode = mode;
    isPausedGlobal = false;
    setExecutionMode(mode);
    setIsPaused(false);
    setIsWaitingForAsync(false);

    javascriptGenerator.INFINITE_LOOP_TRAP = `if (--LoopTrap == 0) throw "${INFINITE_LOOP_ERROR}";\n`;

    javascriptGenerator.STATEMENT_PREFIX = "highlightBlock(%1);\n";
    javascriptGenerator.addReservedWords("highlightBlock");

    const codes = startBlock.map((block) => {
      const code = javascriptGenerator.blockToCode(block);
      return Array.isArray(code) ? code[0] : code;
    });
    javascriptGenerator.INFINITE_LOOP_TRAP = null;
    javascriptGenerator.STATEMENT_PREFIX = null;

    for (const code of codes) {
      runCode(code, handleInfiniteLoopDetection, workspace, setIsPaused, setIsWaitingForAsync);
    }
  };

  const stopCode = (workspace: Blockly.Workspace) => {
    if (interpreters.size === 0) return;
    toast.info(t("codeRunner.halting"));

    // Unhighlight all blocks for all interpreters
    interpreters.forEach((_, interpreterId) => {
      setHighlighted(highlightedBlocks.get(interpreterId), workspace, false);
    });

    interpreters.clear();
    highlightedBlocks.clear();
    runners.clear();
    highlightPauseFlags.clear();
    waitingForAsyncFlags.clear();
    isPausedGlobal = false;
    setIsPaused(false);
    setIsWaitingForAsync(false);
  };

  const stepForward = () => {
    // Guard: only step if we're paused with active interpreters
    // Don't allow stepping while waiting for async operations
    if (interpreters.size === 0 || !isPausedGlobal) {
      console.log("⚠️ Cannot step: not paused or no interpreters running");
      return;
    }

    console.log("⏭️ Step button pressed - unpausing and executing one step");

    // Unpause to allow one step
    isPausedGlobal = false;
    setIsPaused(false);

    // Call each runner function - they will execute one step and pause again
    runners.forEach((runner) => {
      runner();
    });
  };

  return {
    runCodes,
    stopCode,
    stepForward,
    infiniteLoopState,
    handleCloseWarning,
    executionMode,
    isPaused,
    isRunning: interpreters.size > 0,
    isWaitingForAsync,
  };
}