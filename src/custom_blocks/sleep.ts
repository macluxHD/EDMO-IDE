import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Interpreter from "js-interpreter";
import i18next from "../i18n";

Blockly.Blocks["sleep"] = {
  init: function () {
    this.setColour("#5e3c58");
    this.setTooltip(i18next.t('sleep.tooltip'));
    this.setInputsInline(true);

    this.appendValueInput("SECONDS")
      .setCheck("Number")
      .appendField(i18next.t('sleep.block1'));
    this.appendDummyInput().appendField(i18next.t('sleep.block2'));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock['sleep'] = function(block) {
  const seconds = javascriptGenerator.valueToCode(block, 'SECONDS', 0) || '1';
  const code = `sleep(${seconds});\n`;
  return code;
};

export function initInterpreterSleep(interpreter: Interpreter, globalObject: unknown) {
  // Ensure function name does not conflict with variable names.
  javascriptGenerator.addReservedWords('sleep');

  const wrapper = interpreter.createAsyncFunction(
    function(seconds: number, callback: () => void) {
      setTimeout(callback, seconds * 1000);
    }
  )
  interpreter.setProperty(globalObject, 'sleep', wrapper);
}