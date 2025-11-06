/**
 * Processes generated Blockly code to handle async/await correctly.
 * 
 * This function:
 * 1. Identifies functions that contain 'await' keywords
 * 2. Adds 'async' keyword to those function definitions
 * 3. Adds 'await' keyword to calls of async functions
 */
export function processAsyncFunctions(code: string): string {
  const functionRegex = /(?<=^|\n)(function\s+(\w+)\s*\([^)]*\)\s*\{)/g;
  const asyncFunctions = new Set<string>();
  
  let match;
  const functionBodies = new Map<string, { start: number; end: number }>();
  
  while ((match = functionRegex.exec(code)) !== null) {
    const funcName = match[2];
    const startPos = match.index + match[0].indexOf('function');
    
    // start at 1 because the regex match already consumed the opening brace
    let braceCount = 1;
    let endPos = startPos;
    
    for (let i = match.index + match[0].length; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
      } else if (code[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endPos = i;
          break;
        }
      }
    }
    
    const functionBody = code.substring(match.index + match[0].length, endPos);
    functionBodies.set(funcName, { start: startPos, end: endPos + 1 });
    
    if (/\bawait\s+/.test(functionBody)) {
      asyncFunctions.add(funcName);
    }
  }
  
  asyncFunctions.forEach(funcName => {
    code = code.replace(
      new RegExp(`(?<=^|\\n)(function\\s+${funcName}\\s*\\()`, 'g'),
      'async function ' + funcName + '('
    );
  });
  
  asyncFunctions.forEach(funcName => {
    code = code.replace(
      new RegExp(`(?<!await\\s+)\\b${funcName}\\s*\\(`, 'g'),
      (match, offset) => {
        const beforeMatch = code.substring(Math.max(0, offset - 20), offset);
        if (/function\s*$/.test(beforeMatch)) {
          return match;
        }
        return 'await ' + match;
      }
    );
  });
  
  return code;
}

