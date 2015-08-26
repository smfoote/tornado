/* eslint camelcase: 0 */
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var generator = _interopRequire(require("../codeGenerator"));

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

var STATES = _utilsBuilder.STATES;

var noop = function noop() {};

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
  insert_TORNADO_PARTIAL: function insert_TORNADO_PARTIAL(instruction, code) {
    var tdBody = instruction.tdBody;
    var key = instruction.key;

    var context = "c";
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + this.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("replaceNode") + "(root." + this.getPlaceholderName(instruction) + ", td." + util.getTdMethodName("getPartial") + "('" + key + "', " + context + ", this));\n";
      code.push(tdBody, { fragment: fragment, renderer: renderer });
    } else {
      var renderer = "td." + util.getTdMethodName("getPartial") + "('" + key + "', " + context + ", this).then(function(node){return td." + util.getTdMethodName("nodeToString") + "(node)}),";
      code.push(tdBody, { renderer: renderer });
    }
  },
  open_TORNADO_BODY: function open_TORNADO_BODY(instruction, code) {
    var tdBody = instruction.tdBody;
    var bodyType = instruction.bodyType;
    var tdMethodName = instruction.tdMethodName;
    var needsOwnMethod = instruction.needsOwnMethod;

    if (needsOwnMethod) {
      this.createMethodHeaders(tdBody, code, tdMethodName);
    }
    var buildTdBodyCode = (this["tdBody_" + bodyType] || noop).bind(this);
    buildTdBodyCode(instruction, code);
  },
  close_TORNADO_BODY: function close_TORNADO_BODY(instruction, code) {
    var tdBody = instruction.tdBody;
    var needsOwnMethod = instruction.needsOwnMethod;
    var tdMethodName = instruction.tdMethodName;

    if (needsOwnMethod) {
      this.createMethodFooters(tdBody, code, tdMethodName);
    }
  },
  insert_TORNADO_REFERENCE: function insert_TORNADO_REFERENCE(instruction, code) {
    var tdBody = instruction.tdBody;
    var key = instruction.key;
    var state = instruction.state;

    if (state !== STATES.HTML_ATTRIBUTE) {
      var fragment = "      " + this.createPlaceholder(instruction) + ";\n";
      var renderer = "      td." + util.getTdMethodName("replaceNode") + "(root." + this.getPlaceholderName(instruction) + ", td." + util.getTdMethodName("createTextNode") + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + ")));\n";
      code.push(tdBody, { fragment: fragment, renderer: renderer });
    } else {
      var renderer = "td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(key) + "),";
      code.push(tdBody, { renderer: renderer });
    }
  },

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
    var placeholderName = this.getPlaceholderName(instruction);
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
//# sourceMappingURL=generateJS.js.map