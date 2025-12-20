import { toast } from "react-toastify";
import Interpreter from "js-interpreter";
import { initInterpreterSleep } from "../custom_blocks/sleep";
import { initInterpreterSetRotation } from "../custom_blocks/setRotation";
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly";
import { v4 as uuidv4 } from "uuid";
import {
  useInfiniteLoopDetection,
  initInterpreterInfiniteLoopTrap,
  INFINITE_LOOP_ERROR,
} from "./useInfiniteLoopDetection";

const interpreters = new Map<string, Interpreter | null>();

function initApi(interpreter: Interpreter, globalObject: unknown, workspace: Blockly.Workspace) {
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
  interpreter.setProperty(globalObject, 'highlightBlock',
    interpreter.createNativeFunction(function (id) {
      return (workspace as Blockly.WorkspaceSvg).highlightBlock(id);
  }));


  initInterpreterSleep(interpreter, globalObject);
  initInterpreterSetRotation(interpreter, globalObject);
  initInterpreterInfiniteLoopTrap(interpreter, globalObject);
}

export function useCodeRunner() {
  const { infiniteLoopState, handleInfiniteLoopDetection, handleCloseWarning } =
    useInfiniteLoopDetection();

  const runCode = async (workspace: Blockly.Workspace) => {
    javascriptGenerator.INFINITE_LOOP_TRAP = `if (--LoopTrap == 0) throw "${INFINITE_LOOP_ERROR}";\n`;

    javascriptGenerator.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
    javascriptGenerator.addReservedWords('highlightBlock');

    const code = javascriptGenerator.workspaceToCode(workspace);
    javascriptGenerator.INFINITE_LOOP_TRAP = null;
    javascriptGenerator.STATEMENT_PREFIX = null;

    const interpreterId = uuidv4();
    interpreters.set(
      interpreterId,
      new Interpreter(code, (interpreter, globalObject) =>
        initApi(interpreter, globalObject, workspace)
      )
    );

    const runner = () => {
      const interpreter = interpreters.get(interpreterId);
      if (!interpreter) return;

      const hasMore = interpreter.run();

      if (hasMore) {
        // Execution is currently blocked by some async call.
        // Try again later.
        window.setTimeout(runner, 10);
      } else {
        (workspace as Blockly.WorkspaceSvg).highlightBlock(null);
        toast.success("Code execution completed successfully");
        interpreters.delete(interpreterId);
      }
    };

    try {
      runner();
    } catch (error) {
      if (error === INFINITE_LOOP_ERROR) {
        handleInfiniteLoopDetection("iterations");
      } else {
        console.error("Code execution error:", error);
        toast.error("An error occurred during code execution");
      }
      interpreters.delete(interpreterId);
    }
  };

  const stopCode = (workspace: Blockly.Workspace) => {
    if (interpreters.size === 0) return;
    toast.info("Halting code execution...");
    interpreters.clear();
    (workspace as Blockly.WorkspaceSvg).highlightBlock(null);
  };

  return {
    runCode,
    stopCode,
    infiniteLoopState,
    handleCloseWarning,
  };
}
