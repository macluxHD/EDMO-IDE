import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { setArmAngle } from "../components/simulationControls";
import type Interpreter from "js-interpreter";

// Sets rotation of servo x to angle y
Blockly.Blocks["set_rotation"] = {
  init: function () {
    this.setColour("#5e3c58");
    this.setTooltip(
      "Sets the rotation of the specified servo to the given angle."
    );
    this.setInputsInline(true);
    this.appendValueInput("SERVO_ID")
      .setCheck("Number")
      .appendField("set rotation of servo");
    this.appendValueInput("ANGLE").setCheck("Number").appendField("to angle");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["set_rotation"] = function (block) {
  const servoIdCode =
    javascriptGenerator.valueToCode(block, "SERVO_ID", 0) || "0";
  const angleCode = javascriptGenerator.valueToCode(block, "ANGLE", 0) || "0";
  const code = `setServoRotation(${servoIdCode}, ${angleCode});\n`;
  return code;
};

export function initInterpreterSetRotation(
  interpreter: Interpreter,
  globalObject: unknown
) {
  // Ensure function name does not conflict with variable names.
  javascriptGenerator.addReservedWords("setServoRotation");

  const wrapper = interpreter.createNativeFunction(function (
    servoId: number,
    angle: number
  ) {
    console.log(`setServoRotation called with id=${servoId}, angle=${angle}`);
    setArmAngle({
      index: servoId,
      degrees: angle,
      duration: 0.6,
    });
  });
  interpreter.setProperty(globalObject, "setServoRotation", wrapper);
}
