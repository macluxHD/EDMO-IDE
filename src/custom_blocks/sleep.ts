import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["sleep"] = {
  init: function () {
    this.setColour("#5e3c58");
    this.setTooltip("Pauses the program for the specified number of seconds.");
    this.setInputsInline(true);

    this.appendValueInput("SECONDS")
      .setCheck("Number")
      .appendField("Sleep for");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock['sleep'] = function(block) {
  const seconds = javascriptGenerator.valueToCode(block, 'SECONDS', 0) || '1';
  const code = `await sleep(${seconds});\n`;
  return code;
};

export const sleep = (signal: AbortSignal) => {
  return (seconds: number) => {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, seconds * 1000);
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  };
};