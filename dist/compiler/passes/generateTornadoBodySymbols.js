/* eslint camelcase: 0 */
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

var STATES = _utilsBuilder.STATES;

var noop = function noop() {};

function createMethodHeaders(tdBody, code, methodName) {
  var suffix = methodName ? methodName : tdBody;
  var fragment = "f" + suffix + ": function() {\n    var res = {};\n    var frag = td." + util.getTdMethodName("createDocumentFragment") + "();\n    res.frag = frag;\n";
  var renderer = "r" + suffix + ": function(c) {\n    var root = this.f" + suffix + "();\n";
  code.push(tdBody, { fragment: fragment, renderer: renderer });
}
function createMethodFooters(tdBody, code) {
  var fragment = "      return res;\n  }";
  var renderer = "      return root.frag;\n  }";
  code.push(tdBody, { fragment: fragment, renderer: renderer });
}

function createParamsHash(params) {
  var paramsHash = params.reduce(function (acc, param) {
    var paramVal = param[1].val;
    var paramKey = param[1].key;
    if (Array.isArray(paramVal)) {
      paramVal = "td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(paramVal[1].key) + ")";
    } else {
      paramVal = typeof paramVal === "number" ? paramVal : "'" + paramVal + "'";
    }
    acc.push("" + paramKey + ": " + paramVal);
    return acc;
  }, []);
  return "{" + paramsHash.join(",") + "}";
}
function createBodiesHash(tdBody, bodies, mainBody) {
  var bodiesHash = bodies.reduce(function (acc, body, idx) {
    var bodyName = body[1].name;
    acc.push("" + bodyName + ": this.r" + (tdBody + idx + 1) + ".bind(this)");
    return acc;
  }, []);
  if (mainBody && mainBody.length) {
    bodiesHash.push("main: this.r" + tdBody + ".bind(this)");
  }
  return "{" + bodiesHash.join(",") + "}";
}

var tornadoBodySymbols = {
  open_TORNADO_BODY: function open_TORNADO_BODY(instruction, code) {
    var tdBody = instruction.tdBody;
    var bodyType = instruction.bodyType;
    var tdMethodName = instruction.tdMethodName;
    var needsOwnMethod = instruction.needsOwnMethod;

    if (needsOwnMethod) {
      createMethodHeaders(tdBody, code, tdMethodName);
    }
    var buildTdBodyCode = (this["tdBody_" + bodyType] || noop).bind(this);
    buildTdBodyCode(instruction, code);
  },
  close_TORNADO_BODY: function close_TORNADO_BODY(instruction, code) {
    var tdBody = instruction.tdBody;
    var needsOwnMethod = instruction.needsOwnMethod;
    var tdMethodName = instruction.tdMethodName;

    if (needsOwnMethod) {
      createMethodFooters(tdBody, code, tdMethodName);
    }
  },
  tdBody_exists: function tdBody_exists(instruction, code) {
    var parentTdBody = instruction.parentTdBody;
    var tdBody = instruction.tdBody;
    var state = instruction.state;
    var key = instruction.key;
    var node = instruction.node;
    var bodyType = instruction.bodyType;

    var bodies = node[1].bodies;
    var bodiesHash = createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + util.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName(bodyType) + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + "), root." + util.getPlaceholderName(instruction) + ", " + bodiesHash + ", c);\n";
      code.push(parentTdBody, { renderer: renderer, fragment: fragment });
    } else {
      var renderer = "td." + util.getTdMethodName(bodyType) + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + "), null, " + bodiesHash + ", c),";
      code.push(parentTdBody, { renderer: renderer });
    }
  },

  tdBody_notExists: function tdBody_notExists(instruction, code) {
    this.tdBody_exists(instruction, code);
  },

  tdBody_section: function tdBody_section(instruction, code) {
    var parentTdBody = instruction.parentTdBody;
    var tdBody = instruction.tdBody;
    var state = instruction.state;
    var key = instruction.key;
    var node = instruction.node;

    var bodies = node[1].bodies;
    var bodiesHash = createBodiesHash(tdBody, bodies, node[1].body);
    var isInHtmlAttribute = state === STATES.HTML_ATTRIBUTE;
    var placeholderNode = isInHtmlAttribute ? "null" : "root." + util.getPlaceholderName(instruction);

    var output = "td." + util.getTdMethodName("section") + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + "), " + placeholderNode + ", " + bodiesHash + ", c)";

    if (isInHtmlAttribute) {
      var renderer = output + ",";
      code.push(parentTdBody, { renderer: renderer });
    } else {
      var fragment = "      " + util.createPlaceholder(instruction) + ";\n";
      var renderer = "      " + output + ";\n";
      code.push(parentTdBody, { fragment: fragment, renderer: renderer });
    }
  },

  tdBody_block: function tdBody_block(instruction, code) {
    var parentTdBody = instruction.parentTdBody;
    var state = instruction.state;
    var key = instruction.key;
    var blockIndex = instruction.blockIndex;

    var blockName = key.join(".");
    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + util.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("replaceNode") + "(root." + util.getPlaceholderName(instruction) + ", td." + util.getTdMethodName("block") + "('" + blockName + "', " + blockIndex + ", c, this));\n";
      code.push(parentTdBody, { fragment: fragment, renderer: renderer });
    } else {
      var renderer = "td." + util.getTdMethodName("nodeToString") + "(td." + util.getTdMethodName("block") + "('" + blockName + "', " + blockIndex + ", c, this)),";
      code.push(parentTdBody, { renderer: renderer });
    }
  },

  tdBody_helper: function tdBody_helper(instruction, code) {
    var parentTdBody = instruction.parentTdBody;
    var tdBody = instruction.tdBody;
    var state = instruction.state;
    var key = instruction.key;
    var node = instruction.node;

    var params = node[1].params;
    var bodies = node[1].bodies;
    var paramsHash = createParamsHash(params);
    var bodiesHash = createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + util.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("helper") + "('" + key.join(".") + "', root." + util.getPlaceholderName(instruction) + ", c, " + paramsHash + ", " + bodiesHash + ");\n";
      code.push(parentTdBody, { fragment: fragment, renderer: renderer });
    }
  }
};

var addTornadoBodyInstructions = function addTornadoBodyInstructions(ast, options) {
  for (var s in tornadoBodySymbols) {
    options.results.instructions.symbolsMap[s] = tornadoBodySymbols[s];
  }
};
module.exports = addTornadoBodyInstructions;
//# sourceMappingURL=generateTornadoBodySymbols.js.map