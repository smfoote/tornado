/* eslint camelcase: 0 */

"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

var STATES = _utilsBuilder.STATES;

var blockExtension = {
  codeGen: {
    tdBody_block: function tdBody_block(instruction, code) {
      debugger;
      var parentTdBody = instruction.parentTdBody;
      var state = instruction.state;
      var key = instruction.key;
      var blockIndex = instruction.blockIndex;

      var blockName = key.join(".");

      if (state !== STATES.HTML_ATTRIBUTE) {
        var fragment = "      " + this.createPlaceholder(instruction) + ";\n";
        var renderer = "      td." + util.getTdMethodName("replaceNode") + "(root." + this.getPlaceholderName(instruction) + ", td." + util.getTdMethodName("block") + "('" + blockName + "', " + blockIndex + ", c, this));\n";
        code.push(parentTdBody, { fragment: fragment, renderer: renderer });
      } else {
        var renderer = "td." + util.getTdMethodName("nodeToString") + "(td." + util.getTdMethodName("block") + "('" + blockName + "', " + blockIndex + ", c, this)),";
        code.push(parentTdBody, { renderer: renderer });
      }
    }
  }
};

module.exports = blockExtension;
//# sourceMappingURL=block.js.map