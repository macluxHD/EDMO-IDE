import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { setOscillator } from "../components/simulationControls";
import type Interpreter from "js-interpreter";
import i18next from "../i18n";
import { getServoOptions, getServoIndexFromLetter } from "../utils/servoUtils";

interface WindowWithServoCount extends Window {
  servoCountRef?: number;
}

Blockly.Blocks["set_oscillator"] = {
  init: function () {
    this.setColour("#5e3c58");
    this.setTooltip(i18next.t("setOscillator.tooltip"));
    this.setInputsInline(true);
    
    const servoOptions = getServoOptions(Math.max(1, (window as WindowWithServoCount).servoCountRef || 0));
    this.appendDummyInput()
      .appendField(i18next.t("setOscillator.block1"))
      .appendField(
        new Blockly.FieldDropdown(servoOptions),
        "SERVO_ID"
      );
    this.appendValueInput("FREQUENCY")
      .setCheck("Number")
      .appendField(i18next.t("setOscillator.frequency"));
    this.appendValueInput("AMPLITUDE")
      .setCheck("Number")
      .appendField(i18next.t("setOscillator.amplitude"));
    this.appendValueInput("OFFSET")
      .setCheck("Number")
      .appendField(i18next.t("setOscillator.offset"));
    this.appendValueInput("PHASE_SHIFT")
      .setCheck("Number")
      .appendField(i18next.t("setOscillator.phaseShift"));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["set_oscillator"] = function (block) {
  const servoLetter = block.getFieldValue("SERVO_ID") || "A";
  const servoIndex = getServoIndexFromLetter(servoLetter);
  const frequencyCode =
    javascriptGenerator.valueToCode(block, "FREQUENCY", 0) || "0";
  const amplitudeCode =
    javascriptGenerator.valueToCode(block, "AMPLITUDE", 0) || "0";
  const offsetCode = javascriptGenerator.valueToCode(block, "OFFSET", 0) || "0";
  const phaseShiftCode =
    javascriptGenerator.valueToCode(block, "PHASE_SHIFT", 0) || "0";
  const code = `setOscillator(${servoIndex}, ${frequencyCode}, ${amplitudeCode}, ${offsetCode}, ${phaseShiftCode});\n`;
  return code;
};

export function initInterpreterSetOscillator(
  interpreter: Interpreter,
  globalObject: unknown
) {
  // Ensure function name does not conflict with variable names.
  javascriptGenerator.addReservedWords("setOscillator");

  const wrapper = interpreter.createNativeFunction(function (
    servoId: number | string,
    frequency: number,
    amplitude: number,
    offset: number,
    phaseShift: number
  ) {
    const index = typeof servoId === "string" ? getServoIndexFromLetter(servoId) : servoId;
    console.log(
      `setOscillator called with id=${index}, frequency=${frequency}, amplitude=${amplitude}, offset=${offset}, phaseShift=${phaseShift}`
    );
    setOscillator({
      index: index,
      frequency: frequency,
      amplitude: amplitude,
      offset: offset,
      phaseShift: phaseShift,
    });
  });
  interpreter.setProperty(globalObject, "setOscillator", wrapper);
}
