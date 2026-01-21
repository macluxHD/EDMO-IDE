import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { setArmAngle } from "../components/simulationControls";
import type Interpreter from "js-interpreter";
import i18next from "../i18n";
import { getServoOptions, getServoIndexFromLetter } from "../utils/servoUtils";

interface WindowWithServoCount extends Window {
  servoCountRef?: number;
}

let servoCountRef = 0;
(window as WindowWithServoCount).servoCountRef = 0;

export function updateServoCount(count: number) {
  servoCountRef = count;
  (window as WindowWithServoCount).servoCountRef = count;
  updateServoDropdowns();
}

export function updateServoDropdowns() {
  const workspace = Blockly.getMainWorkspace();
  if (!workspace) return;

  const blocks = workspace.getAllBlocks(false);
  blocks.forEach((block) => {
    if (block.type === "set_rotation" || block.type === "set_oscillator") {
      const servoField = block.getField("SERVO_ID");
      if (servoField && servoField instanceof Blockly.FieldDropdown) {
        const options = getServoOptions(Math.max(1, servoCountRef));
        const currentValue = servoField.getValue();
        const fieldDropdown = servoField as Blockly.FieldDropdown & {
          menuGenerator_?: () => Array<[string, string]>;
        };
        fieldDropdown.menuGenerator_ = () => options;
        if (options.find(([value]) => value === currentValue)) {
          servoField.setValue(currentValue);
        } else if (options.length > 0) {
          servoField.setValue(options[0][0]);
        }
      }
    }
  });
}

Blockly.Blocks["set_rotation"] = {
  init: function () {
    this.setColour("#5e3c58");
    this.setTooltip(i18next.t('setRotation.tooltip'));
    this.setInputsInline(true);
    
    const servoOptions = getServoOptions(Math.max(1, (window as WindowWithServoCount).servoCountRef || 0));
    this.appendDummyInput()
      .appendField(i18next.t('setRotation.block1'))
      .appendField(
        new Blockly.FieldDropdown(servoOptions),
        "SERVO_ID"
      );
    this.appendValueInput("ANGLE").setCheck("Number").appendField(i18next.t('setRotation.block2'));
    this.appendDummyInput().appendField(i18next.t('setRotation.block3'));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

javascriptGenerator.forBlock["set_rotation"] = function (block) {
  const servoLetter = block.getFieldValue("SERVO_ID") || "A";
  const servoIndex = getServoIndexFromLetter(servoLetter);
  const angleCode = javascriptGenerator.valueToCode(block, "ANGLE", 0) || "0";
  const code = `setServoRotation(${servoIndex}, ${angleCode});\n`;
  return code;
};

export function initInterpreterSetRotation(
  interpreter: Interpreter,
  globalObject: unknown
) {
  // Ensure function name does not conflict with variable names.
  javascriptGenerator.addReservedWords("setServoRotation");

  const wrapper = interpreter.createNativeFunction(function (
    servoId: number | string,
    angle: number
  ) {
    const index = typeof servoId === "string" ? getServoIndexFromLetter(servoId) : servoId;
    console.log(`setServoRotation called with id=${index}, angle=${angle}`);
    setArmAngle({
      index: index,
      degrees: angle,
      duration: 0.6,
    });
  });
  interpreter.setProperty(globalObject, "setServoRotation", wrapper);
}
