/**
 * injects loop guards into generated code to prevent infinite loops
 */

const MAX_ITERATIONS = 100000;

export interface InfiniteLoopState {
  isWarningOpen: boolean;
  reason: "iterations" | "timeout";
  iterationCount?: number;
}

export function injectLoopGuards(code: string): string {
  let guardedCode = code;
  let guardCounter = 0;

  // guard while loops
  guardedCode = guardedCode.replace(
    /while\s*\(((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*)\)\s*\{/g,
    (_match, condition) => {
      const guardVar = `__loopGuard${guardCounter++}`;
      return `let ${guardVar} = 0;\nwhile (${condition}) {\n  if (++${guardVar} > ${MAX_ITERATIONS}) throw new Error('INFINITE_LOOP_DETECTED');\n`;
    }
  );

  // guard for loops
  guardedCode = guardedCode.replace(
    /for\s*\(((?:[^;]+;[^;]+;[^)]+))\)\s*\{/g,
    (_match, forHeader) => {
      const guardVar = `__loopGuard${guardCounter++}`;
      return `let ${guardVar} = 0;\nfor (${forHeader}) {\n  if (++${guardVar} > ${MAX_ITERATIONS}) throw new Error('INFINITE_LOOP_DETECTED');\n`;
    }
  );

  // guard do-while loops
  guardedCode = guardedCode.replace(
    /do\s*\{/g,
    () => {
      const guardVar = `__loopGuard${guardCounter++}`;
      return `let ${guardVar} = 0;\ndo {\n  if (++${guardVar} > ${MAX_ITERATIONS}) throw new Error('INFINITE_LOOP_DETECTED');\n`;
    }
  );

  return guardedCode;
}

export function getMaxIterations(): number {
  return MAX_ITERATIONS;
}

