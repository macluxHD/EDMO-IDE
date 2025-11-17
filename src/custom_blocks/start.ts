import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["start"] = {
  init: function () {
    this.appendDummyInput()
        .appendField("Start");
    this.setColour("#8BC34A");
    this.setTooltip("Point where the program starts");

    this.setNextStatement(true);
  },
};

javascriptGenerator.forBlock['start'] = function() {
  return '';
};