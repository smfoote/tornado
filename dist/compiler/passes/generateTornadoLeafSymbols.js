"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/* eslint camelcase: 0 */

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

var STATES = _utilsBuilder.STATES;

var tornadoLeafSymbols = {
  insert_TORNADO_PARTIAL: function insert_TORNADO_PARTIAL(instruction, code) {
    var tdBody = instruction.tdBody;
    var key = instruction.key;

    var context = "c";
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + util.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("replaceNode") + "(root." + util.getPlaceholderName(instruction) + ", td." + util.getTdMethodName("getPartial") + "('" + key + "', " + context + ", this));\n";
      code.push(tdBody, { fragment: fragment, renderer: renderer });
    } else {
      var renderer = "td." + util.getTdMethodName("getPartial") + "('" + key + "', " + context + ", this).then(function(node){return td." + util.getTdMethodName("nodeToString") + "(node)}),";
      code.push(tdBody, { renderer: renderer });
    }
  },
  insert_TORNADO_REFERENCE: function insert_TORNADO_REFERENCE(instruction, code) {
    var tdBody = instruction.tdBody;
    var key = instruction.key;
    var state = instruction.state;

    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + util.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("replaceNode") + "(root." + util.getPlaceholderName(instruction) + ", td." + util.getTdMethodName("createTextNode") + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + ")));\n";
      code.push(tdBody, { fragment: fragment, renderer: renderer });
    } else {
      var renderer = "td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + "),";
      code.push(tdBody, { renderer: renderer });
    }
  }
};
var addTornadoLeafInstructions = function addTornadoLeafInstructions(ast, options) {
  for (var s in tornadoLeafSymbols) {
    options.results.instructions.symbolsMap[s] = tornadoLeafSymbols[s];
  }
};
module.exports = addTornadoLeafInstructions;
//# sourceMappingURL=generateTornadoLeafSymbols.js.map