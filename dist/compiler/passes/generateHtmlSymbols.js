/* eslint camelcase: 0 */
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

var STATES = _utilsBuilder.STATES;

var htmlSymbols = {
  open_HTML_ELEMENT: function open_HTML_ELEMENT(instruction, code) {
    var state = instruction.state;
    var tdBody = instruction.tdBody;
    var elCount = instruction.elCount;
    var key = instruction.key;
    var namespace = instruction.namespace;

    namespace = namespace ? ", '" + namespace + "'" : "";
    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      var el" + elCount + " = td." + util.getTdMethodName("createElement") + "('" + key + "'" + namespace + ");\n";
      code.push(tdBody, { fragment: fragment });
    }
  },
  close_HTML_ELEMENT: function close_HTML_ELEMENT(instruction, code) {
    var state = instruction.state;
    var parentNodeName = instruction.parentNodeName;
    var elCount = instruction.elCount;
    var tdBody = instruction.tdBody;

    if (state === STATES.ESCAPABLE_RAW) {
      var fragment = "      el" + (elCount - 1) + ".defaultValue += td." + util.getTdMethodName("nodeToString") + "(el" + elCount + ");\n";
      code.push(tdBody, { fragment: fragment });
    } else if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + parentNodeName + ".appendChild(el" + elCount + ");\n";
      code.push(tdBody, { fragment: fragment });
    }
  },
  open_HTML_ATTRIBUTE: function open_HTML_ATTRIBUTE(instruction, code) {
    var tdBody = instruction.tdBody;
    var node = instruction.node;
    var hasTornadoRef = instruction.hasTornadoRef;
    var parentNodeName = instruction.parentNodeName;

    var attrInfo = node[1];
    var placeholderName = util.getPlaceholderName(instruction);
    var fragment = "      res." + placeholderName + " = " + parentNodeName + ";\n";
    var renderer = "      td." + util.getTdMethodName("setAttribute");
    renderer += "(root." + placeholderName + ", '" + attrInfo.attrName + "', ";
    if (hasTornadoRef) {
      renderer += "[";
    } else {
      renderer += "";
    }
    code.push(tdBody, { fragment: fragment, renderer: renderer });
  },
  close_HTML_ATTRIBUTE: function close_HTML_ATTRIBUTE(instruction, code) {
    var tdBody = instruction.tdBody;
    var hasTornadoRef = instruction.hasTornadoRef;

    var renderer = undefined;
    if (hasTornadoRef) {
      renderer = "]);\n";
    } else {
      renderer = ");\n";
    }
    // Remove the trailing comma from the last item in the array
    code.slice("renderers", tdBody, 0, -1);
    code.push(tdBody, { renderer: renderer });
  },
  insert_HTML_COMMENT: function insert_HTML_COMMENT(instruction, code) {
    var tdBody = instruction.tdBody;
    var parentNodeName = instruction.parentNodeName;
    var contents = instruction.contents;

    var fragment = "      " + parentNodeName + ".appendChild(td." + util.getTdMethodName("createHTMLComment") + "('" + contents + "'));\n";
    code.push(tdBody, { fragment: fragment });
  },
  insert_PLAIN_TEXT: function insert_PLAIN_TEXT(instruction, code) {
    var tdBody = instruction.tdBody;
    var parentNodeName = instruction.parentNodeName;
    var contents = instruction.contents;

    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + parentNodeName + ".appendChild(td." + util.getTdMethodName("createTextNode") + "('" + contents + "'));\n";
      code.push(tdBody, { fragment: fragment });
    } else {
      var renderer = "'" + contents + "',";
      code.push(tdBody, { renderer: renderer });
    }
  }
};

var addHtmlInstructions = function addHtmlInstructions(ast, options) {
  for (var s in htmlSymbols) {
    options.results.instructions.symbolsMap[s] = htmlSymbols[s];
  }
};
module.exports = addHtmlInstructions;
//# sourceMappingURL=generateHtmlSymbols.js.map