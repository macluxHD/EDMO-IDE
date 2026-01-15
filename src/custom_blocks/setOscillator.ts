import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { setOscillator } from "../components/simulationControls";
import type Interpreter from "js-interpreter";

// Sets oscillators frequency, amplitude, offset, phase shift and phase for servo x
Blockly.Blocks["set_oscillator"] = {
  init: function () {
    this.setColour("#5e3c58");
    this.setTooltip("Sets the oscillator parameters of the specified servo.");
    this.setInputsInline(true);
    this.appendValueInput("SERVO_ID")
      .setCheck("Number")
      .appendField("set oscillator of servo");
    this.appendValueInput("FREQUENCY")
      .setCheck("Number")
      .appendField("frequency");
    this.appendValueInput("AMPLITUDE")
      .setCheck("Number")
      .appendField("amplitude");
    this.appendValueInput("OFFSET").setCheck("Number").appendField("offset");
    this.appendValueInput("PHASE_SHIFT")
      .setCheck("Number")
      .appendField("phase shift");
    this.appendValueInput("PHASE").setCheck("Number").appendField("phase");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["set_oscillator"] = function (block) {
  const servoIdCode =
    javascriptGenerator.valueToCode(block, "SERVO_ID", 0) || "0";
  const frequencyCode =
    javascriptGenerator.valueToCode(block, "FREQUENCY", 0) || "0";
  const amplitudeCode =
    javascriptGenerator.valueToCode(block, "AMPLITUDE", 0) || "0";
  const offsetCode = javascriptGenerator.valueToCode(block, "OFFSET", 0) || "0";
  const phaseShiftCode =
    javascriptGenerator.valueToCode(block, "PHASE_SHIFT", 0) || "0";
  const phaseCode = javascriptGenerator.valueToCode(block, "PHASE", 0) || "0";
  const code = `setOscillator(${servoIdCode}, ${frequencyCode}, ${amplitudeCode}, ${offsetCode}, ${phaseShiftCode}, ${phaseCode});\n`;
  return code;
};

export function initInterpreterSetOscillator(
  interpreter: Interpreter,
  globalObject: unknown
) {
  // Ensure function name does not conflict with variable names.
  javascriptGenerator.addReservedWords("setOscillator");

  const wrapper = interpreter.createNativeFunction(function (
    servoId: number,
    frequency: number,
    amplitude: number,
    offset: number,
    phaseShift: number,
    phase: number
  ) {
    console.log(
      `setOscillator called with id=${servoId}, frequency=${frequency}, amplitude=${amplitude}, offset=${offset}, phaseShift=${phaseShift}, phase=${phase}`
    );
    setOscillator({
      index: servoId,
      frequency: frequency,
      amplitude: amplitude,
      offset: offset,
      phaseShift: phaseShift,
      phase: phase,
    });
  });
  interpreter.setProperty(globalObject, "setOscillator", wrapper);
}
