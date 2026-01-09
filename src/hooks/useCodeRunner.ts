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
import "../custom_blocks/start";

const interpreters = new Map<string, Interpreter | null>();
const highlightedBlocks = new Map<string, string | null>();

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
  interpreterId: string
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

      // Unhighlight the previously highlighted block for this interpreter
      const previousBlockId = highlightedBlocks.get(interpreterId);
      setHighlighted(previousBlockId, workspace, false);

      // Highlight the new block
      setHighlighted(blockId, workspace, true);
      highlightedBlocks.set(interpreterId, blockId);
    })
  );

  initInterpreterSleep(interpreter, globalObject);
  initInterpreterSetRotation(interpreter, globalObject);
  initInterpreterInfiniteLoopTrap(interpreter, globalObject);
}

function runCode(
  code: string,
  handleInfiniteLoopDetection: (reason: "iterations" | "timeout") => void,
  workspace: Blockly.Workspace
) {
  const interpreterId = uuidv4();
  interpreters.set(
    interpreterId,
    new Interpreter(code, (interpreter, globalObject) =>
      initApi(interpreter, globalObject, workspace, interpreterId)
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
      toast.success("Code execution completed successfully");

      // Unhighlight the block for this interpreter
      setHighlighted(highlightedBlocks.get(interpreterId), workspace, false);

      interpreters.delete(interpreterId);
      highlightedBlocks.delete(interpreterId);
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

    // Unhighlight the block for this interpreter
    setHighlighted(highlightedBlocks.get(interpreterId), workspace, false);

    interpreters.delete(interpreterId);
    highlightedBlocks.delete(interpreterId);
  }
}

export function useCodeRunner() {
  const { infiniteLoopState, handleInfiniteLoopDetection, handleCloseWarning } =
    useInfiniteLoopDetection();

  const runCodes = async (workspace: Blockly.Workspace) => {
    const allBlocks = workspace.getAllBlocks(false);
    const startBlock = allBlocks.filter((block) => block.type === "start");

    if (startBlock.length === 0) return;

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
      runCode(code, handleInfiniteLoopDetection, workspace);
    }
  };

  const stopCode = (workspace: Blockly.Workspace) => {
    if (interpreters.size === 0) return;
    toast.info("Halting code execution...");

    // Unhighlight all blocks for all interpreters
    interpreters.forEach((_, interpreterId) => {
      setHighlighted(highlightedBlocks.get(interpreterId), workspace, false);
    });

    interpreters.clear();
    highlightedBlocks.clear();
  };

  return {
    runCodes,
    stopCode,
    infiniteLoopState,
    handleCloseWarning,
  };
}
