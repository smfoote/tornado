/* eslint camelcase: 0 */
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var generator = _interopRequire(require("../codeGenerator"));

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

var STATES = _utilsBuilder.STATES;

var codeGenerator = {
  generatorFns: {},
  useCodeGeneratorFn: function useCodeGeneratorFn(codeGenerator) {
    this.generatorFns[codeGenerator.name] = codeGenerator.method;
  },
  useCodeGeneratorFns: function useCodeGeneratorFns(codeGenerators) {
    var _this = this;

    Object.keys(codeGenerators).forEach(function (generatorName) {
      return _this.useCodeGeneratorFn({ name: generatorName, method: codeGenerators[generatorName] });
    });
  },
  build: function build() {
    return generator.build(this.generatorFns);
  }
};

codeGenerator.useCodeGeneratorFns({
  insert_TORNADO_PARTIAL: function insert_TORNADO_PARTIAL() {},
  insert_TORNADO_PARAMS: function insert_TORNADO_PARAMS(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    var params = config.params;
    params.forEach(function (p) {
      state.addParam(p);
    });
  },
  open_TORNADO_BODY: function open_TORNADO_BODY(instruction) {
    var config = instruction.config;
    var state = instruction.state;
    var key = config.key;
    var type = config.type;
    var name = config.name;

    if (type === "bodies") {
      state.addBodies({ name: name });
    } else {
      state.addBody({ key: key, type: type });
    }
  },
  close_TORNADO_BODY: function close_TORNADO_BODY(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    if (config.type === "bodies") {
      state.leaveBodies();
    } else {
      state.leaveBody();
    }
  },
  insert_TORNADO_REFERENCE: function insert_TORNADO_REFERENCE(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    state.addReference(config);
  },

  open_HTML_ELEMENT: function open_HTML_ELEMENT(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    state.addElement(config);
  },
  close_HTML_ELEMENT: function close_HTML_ELEMENT(instruction) {
    var state = instruction.state;

    state.leaveElement();
  },
  open_HTML_ATTRIBUTE: function open_HTML_ATTRIBUTE() {},
  close_HTML_ATTRIBUTE: function close_HTML_ATTRIBUTE() {},
  insert_HTML_COMMENT: function insert_HTML_COMMENT() {},
  insert_PLAIN_TEXT: function insert_PLAIN_TEXT(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    state.addElement(config);
    state.leaveElement();
  },

  createMethodHeaders: function createMethodHeaders(tdBody, code, methodName) {
    var suffix = methodName ? methodName : tdBody;
    var fragment = "f" + suffix + ": function() {\n      var res = {};\n      var frag = td." + util.getTdMethodName("createDocumentFragment") + "();\n      res.frag = frag;\n";
    var renderer = "r" + suffix + ": function(c) {\n      var root = this.f" + suffix + "();\n";
    code.push(tdBody, { fragment: fragment, renderer: renderer });
  },

  createMethodFooters: function createMethodFooters(tdBody, code) {
    var fragment = "      return res;\n    }";
    var renderer = "      return root.frag;\n    }";
    code.push(tdBody, { fragment: fragment, renderer: renderer });
  },

  createPlaceholder: function createPlaceholder(instruction) {
    var placeholderName = this.getPlaceholderName(instruction);
    return "var " + placeholderName + " = td." + util.getTdMethodName("createTextNode") + "('');\n      " + instruction.parentNodeName + ".appendChild(" + placeholderName + ");\n      res." + placeholderName + " = " + placeholderName + ";";
  },

  getPlaceholderName: function getPlaceholderName(instruction) {
    var indexPath = instruction.indexPath;

    return "p" + indexPath.join("");
  },

  tdBody_exists: function tdBody_exists(instruction, code) {
    var parentTdBody = instruction.parentTdBody;
    var tdBody = instruction.tdBody;
    var state = instruction.state;
    var key = instruction.key;
    var node = instruction.node;
    var bodyType = instruction.bodyType;

    var bodies = node[1].bodies;
    var bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + this.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName(bodyType) + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + "), root." + this.getPlaceholderName(instruction) + ", " + bodiesHash + ", c);\n";
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
    var bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    var isInHtmlAttribute = state === STATES.HTML_ATTRIBUTE;
    var placeholderNode = isInHtmlAttribute ? "null" : "root." + this.getPlaceholderName(instruction);

    var output = "td." + util.getTdMethodName("section") + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + "), " + placeholderNode + ", " + bodiesHash + ", c)";

    if (isInHtmlAttribute) {
      var renderer = output + ",";
      code.push(parentTdBody, { renderer: renderer });
    } else {
      var fragment = "      " + this.createPlaceholder(instruction) + ";\n";
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
      var fragment = "      " + this.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("replaceNode") + "(root." + this.getPlaceholderName(instruction) + ", td." + util.getTdMethodName("block") + "('" + blockName + "', " + blockIndex + ", c, this));\n";
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
    var paramsHash = this.createParamsHash(params);
    var bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + this.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("helper") + "('" + key.join(".") + "', root." + this.getPlaceholderName(instruction) + ", c, " + paramsHash + ", " + bodiesHash + ");\n";
      code.push(parentTdBody, { fragment: fragment, renderer: renderer });
    } else {
      var renderer = "td." + util.getTdMethodName("helper") + "('" + key.join(".") + "', null, c, " + paramsHash + ", " + bodiesHash + "),";
      code.push(parentTdBody, { renderer: renderer });
    }
  },

  createBodiesHash: function createBodiesHash(tdBody, bodies, mainBody) {
    var bodiesHash = bodies.reduce(function (acc, body, idx) {
      var bodyName = body[1].name;
      acc.push("" + bodyName + ": this.r" + (tdBody + idx + 1) + ".bind(this)");
      return acc;
    }, []);
    if (mainBody && mainBody.length) {
      bodiesHash.push("main: this.r" + tdBody + ".bind(this)");
    }
    return "{" + bodiesHash.join(",") + "}";
  },

  createParamsHash: function createParamsHash(params) {
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
});

var generateJavascript = function generateJavascript(results) {
  results.code = {
    fragments: [],
    renderers: [],
    push: function push(idx, strings) {
      var fragment = strings.fragment;
      var renderer = strings.renderer;

      if (idx >= this.fragments.length) {
        if (fragment) {
          this.fragments.push(fragment);
        }
        if (renderer) {
          this.renderers.push(renderer);
        }
      } else {
        if (fragment) {
          this.fragments[idx] += fragment;
        }
        if (renderer) {
          this.renderers[idx] += renderer;
        }
      }
    },
    /**
     * Remove characters from the generated code.
     * @param {String} type Either 'fragments' or 'renderers'
     * @param {Number} idx The index of the fragment or renderer from which the characters are to be removed
     * @param {Number} start The character position to start slicing from
     * @param {Number} end The character position where the slice ends
     */
    slice: function slice(type, idx, start, end) {
      if (this[type] && this[type][idx]) {
        this[type][idx] = this[type][idx].slice(start, end);
      }
    }
  };
  return codeGenerator.build()(results.instructions, results.code);
};

module.exports = generateJavascript;
/*instruction, code*/ /*instruction, code*/ /*instruction, code*/ /*instruction, code*/
//# sourceMappingURL=generateJS.js.map