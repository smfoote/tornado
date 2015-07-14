(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Context = _interopRequire(require("./compiler/context"));

var escapableRaw = _interopRequire(require("./compiler/passes/escapableRaw"));

var htmlEntities = _interopRequire(require("./compiler/passes/htmlEntities"));

var adjustAttrs = _interopRequire(require("./compiler/passes/adjustAttrs"));

var buildInstructions = _interopRequire(require("./compiler/passes/buildInstructions"));

var generateJS = _interopRequire(require("./compiler/passes/generateJS"));

var postprocess = _interopRequire(require("./compiler/passes/postprocess"));

// import visualize from './compiler/passes/visualize';

var defaultPasses = [[], // checks
[escapableRaw, htmlEntities, adjustAttrs], // transforms
[buildInstructions], // generates
[generateJS, postprocess] // codegen
];
var compiler = {
  compile: function compile(ast, name, options) {
    var passes = undefined;

    if (options && options.passes) {
      passes = options.passes;
      // merge defaults into passes
      for (var key in defaultPasses) {
        if (defaultPasses.hasOwnProperty(key) && !passes.hasOwnProperty(key)) {
          passes[key] = defaultPasses[key];
        }
      }
    } else {
      passes = defaultPasses;
    }
    var results = {
      name: name,
      instructions: []
    };
    passes.forEach(function (stage) {
      stage.forEach(function (pass) {
        var context = new Context(results);
        pass(ast, { results: results, context: context });
      });
    });
    return results.code;
  }
};

module.exports = compiler;
//# sourceMappingURL=compiler.js.map
},{"./compiler/context":3,"./compiler/passes/adjustAttrs":4,"./compiler/passes/buildInstructions":5,"./compiler/passes/escapableRaw":6,"./compiler/passes/generateJS":7,"./compiler/passes/htmlEntities":8,"./compiler/passes/postprocess":9}],2:[function(require,module,exports){
"use strict";
/**
 * the visitor pattern so we can map AST to functions
 */

var generator = {
  build: function build(fns) {
    var execute = function execute(instruction, code) {
      var action = instruction.action;
      var nodeType = instruction.nodeType;

      if (fns["" + action + "_" + nodeType]) {
        fns["" + action + "_" + nodeType](instruction, code);
      }
    };

    var walk = function walk(_x, code) {
      var instructions = arguments[0] === undefined ? [] : arguments[0];

      instructions.forEach(function (instruction) {
        execute.apply(null, [instruction, code]);
      });
    };

    return walk;
  }
};

module.exports = generator;
//# sourceMappingURL=codeGenerator.js.map
},{}],3:[function(require,module,exports){
"use strict";

if (!Object.assign) {
  Object.defineProperty(Object, "assign", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function value(target) {
      if (target === undefined || target === null) {
        throw new TypeError("Cannot convert first argument to object");
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

var STATES = {
  OUTER_SPACE: "OUTER_SPACE",
  HTML_TAG: "HTML_TAG",
  HTML_BODY: "HTML_BODY",
  HTML_ATTRIBUTE: "HTML_ATTRIBUTE",
  ESCAPABLE_RAW: "ESCAPABLE_RAW",
  TORNADO_TAG: "TORNADO_TAG",
  TORNADO_BODY: "TORNADO_BODY"
};

var Context = function Context(results) {
  var nodeStack = [{ indexPath: [] }];
  // let refCount;
  var tornadoBodiesPointer = -1;
  var defaultState = STATES.OUTER_SPACE;

  var context = {
    blocks: {},
    state: defaultState,
    getCurrentTdBody: function getCurrentTdBody(nodeType) {
      if (nodeType === "TORNADO_BODY") {
        return tornadoBodiesPointer;
      } else {
        return this.stack.peek("tdBody");
      }
    },
    getElContainer: function getElContainer() {
      var container = this.stack.peek("parentNodeIdx");
      var nodeType = this.stack.peek("nodeType");
      if (nodeType === "TORNADO_BODY") {
        return -1;
      } else if (nodeType === "HTML_ELEMENT") {
        return container + 1;
      }
    },
    incrementCurrentTdBody: function incrementCurrentTdBody() {
      tornadoBodiesPointer++;
    },
    pushInstruction: function pushInstruction(instruction) {
      results.instructions.push(instruction);
    },
    getCurrentState: function getCurrentState() {
      var state = STATES[this.stack.peek("nodeType")] || this.stack.peek("state");
      if (!state) {
        return STATES.OUTER_SPACE;
      } else {
        return state;
      }
    },
    getNamespaceFromNode: function getNamespaceFromNode(node) {
      var nodeInfo = node[1].tag_info;
      var namespace = nodeInfo.attributes.filter(function (attr) {
        return attr[1].attrName === "xmlns";
      });
      if (namespace.length) {
        return namespace[0][1].value[0][1];
      }
      return "";
    },
    getCurrentNamespace: function getCurrentNamespace(namespace) {
      return namespace ? namespace : this.stack.peek("namespace") || "";
    },
    stack: {
      push: function push(node, index, method) {
        var nodeType = node[0];
        var parentIndexPath = this.stack.peek("indexPath");
        var isTornadoBody = nodeType === "TORNADO_BODY";
        var isParentTdBody = this.stack.peek("nodeType") === "TORNADO_BODY";
        var isAttr = nodeType === "HTML_ATTRIBUTE";
        var namespace = "";
        var parentTdBody = undefined,
            blockName = undefined,
            blockIndex = undefined;
        if (nodeType === "HTML_ELEMENT") {
          namespace = this.getNamespaceFromNode(node);
        }
        if (nodeType === "HTML_ELEMENT" || nodeType === "HTML_ATTRIBUTE") {
          namespace = this.getCurrentNamespace(namespace);
        }
        var indexPath = parentIndexPath.slice(0);
        var state = this.getCurrentState();
        if (isParentTdBody) {
          indexPath = [];
        }
        if (!isAttr) {
          indexPath.push(index);
        }

        if (isTornadoBody) {
          var bodyType = node[1].type;
          parentTdBody = this.stack.peek("tdBody");
          if (node[1].body && node[1].body.length) {
            this.incrementCurrentTdBody();
          }
          if (bodyType === "block" || bodyType === "inlinePartial") {
            blockName = node[1].key.join(".");
            if (bodyType === "block") {
              if (this.blocks.hasOwnProperty(blockName)) {
                blockIndex = ++this.blocks[blockName];
              } else {
                blockIndex = this.blocks[blockName] = 0;
              }
            }
          }
        }

        if (node[1].escapableRaw) {
          state = STATES.ESCAPABLE_RAW;
        }
        var stackItem = {
          node: node,
          nodeType: nodeType,
          indexPath: indexPath,
          state: state,
          previousState: this.stack.peek("state"),
          blockName: blockName,
          blockIndex: blockIndex,
          namespace: namespace,
          tdBody: this.getCurrentTdBody(nodeType),
          parentTdBody: parentTdBody,
          parentNodeIdx: this.getElContainer()
        };
        nodeStack.push(stackItem);
        method(stackItem, this);
      },
      pop: function pop(method) {
        var stackItem = this.stack.peek();
        nodeStack.pop();
        method(stackItem, this);
      },
      peek: function peek(prop) {
        var len = nodeStack.length;
        var topItem = nodeStack[len - 1];
        if (!prop) {
          return topItem;
        }
        return topItem.hasOwnProperty(prop) ? topItem[prop] : false;
      }
    }
  };

  // Give Context.stack the same prototype as Context.
  context.stack = Object.assign(Object.create(context), context.stack);

  return context;
};

module.exports = Context;
//# sourceMappingURL=context.js.map
},{}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var svgAdjustAttrs = {
  attributename: "attributeName",
  attributetype: "attributeType",
  basefrequency: "baseFrequency",
  baseprofile: "baseProfile",
  calcmode: "calcMode",
  clippathunits: "clipPathUnits",
  diffuseconstant: "diffuseConstant",
  edgemode: "edgeMode",
  filterunits: "filterUnits",
  glyphref: "glyphRef",
  gradienttransform: "gradientTransform",
  gradientunits: "gradientUnits",
  kernelmatrix: "kernelMatrix",
  kernelunitlength: "kernelUnitLength",
  keypoints: "keyPoints",
  keysplines: "keySplines",
  keytimes: "keyTimes",
  lengthadjust: "lengthAdjust",
  limitingconeangle: "limitingConeAngle",
  markerheight: "markerHeight",
  markerunits: "markerUnits",
  markerwidth: "markerWidth",
  maskcontentunits: "maskContentUnits",
  maskunits: "maskUnits",
  numoctaves: "numOctaves",
  pathlength: "pathLength",
  patterncontentunits: "patternContentUnits",
  patterntransform: "patternTransform",
  patternunits: "patternUnits",
  pointsatx: "pointsAtX",
  pointsaty: "pointsAtY",
  pointsatz: "pointsAtZ",
  preservealpha: "preserveAlpha",
  preserveaspectratio: "preserveAspectRatio",
  primitiveunits: "primitiveUnits",
  refx: "refX",
  refy: "refY",
  repeatcount: "repeatCount",
  repeatdur: "repeatDur",
  requiredextensions: "requiredExtensions",
  requiredfeatures: "requiredFeatures",
  specularconstant: "specularConstant",
  specularexponent: "specularExponent",
  spreadmethod: "spreadMethod",
  startoffset: "startOffset",
  stddeviation: "stdDeviation",
  stitchtiles: "stitchTiles",
  surfacescale: "surfaceScale",
  systemlanguage: "systemLanguage",
  tablevalues: "tableValues",
  targetx: "targetX",
  targety: "targetY",
  textlength: "textLength",
  viewbox: "viewBox",
  viewtarget: "viewTarget",
  xchannelselector: "xChannelSelector",
  ychannelselector: "yChannelSelector",
  zoomandpan: "zoomAndPan"
};

var generatedWalker = visitor.build({
  HTML_ATTRIBUTE: function HTML_ATTRIBUTE(item) {
    var node = item.node;
    var namespace = item.namespace;

    var attrName = node[1].attrName;
    var adjustedAttr = undefined;
    if (namespace) {
      adjustedAttr = svgAdjustAttrs[attrName];
    }
    node[1].attrName = adjustedAttr || attrName;
  }
});

var adjustAttrs = function adjustAttrs(ast, options) {
  return generatedWalker(ast, options.context);
};

module.exports = adjustAttrs;
//# sourceMappingURL=adjustAttrs.js.map
},{"../visitor":14}],5:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var Instruction = _interopRequire(require("../utils/Instruction"));

var generateWalker = visitor.build({
  TORNADO_PARTIAL: {
    enter: function enter(item, ctx) {
      // let meta = item.node[1];
      // let params = meta.params;
      // if (params.length === 1 && params[0].key === 'context') {
      //   context = `td.${util.getTdMethodName('get')}(c, ${params[0].val})`;
      // }
      ctx.pushInstruction(new Instruction("insert", { key: item.node[1].key, item: item, ctx: ctx }));
    }
  },
  TORNADO_BODY: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("open", { key: item.node[1].key, item: item, ctx: ctx }));
    },
    leave: function leave(item, ctx) {
      ctx.pushInstruction(new Instruction("close", { item: item, ctx: ctx }));
    }
  },
  TORNADO_REFERENCE: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { key: item.node[1].key, item: item, ctx: ctx }));
    }
  },
  TORNADO_COMMENT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { item: item, ctx: ctx }));
    }
  },
  HTML_ELEMENT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("open", { key: item.node[1].tag_info.key, item: item, ctx: ctx }));
    },
    leave: function leave(item, ctx) {
      item.state = item.previousState;
      ctx.pushInstruction(new Instruction("close", { item: item, ctx: ctx }));
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("open", { item: item, ctx: ctx }));
    },
    leave: function leave(item, ctx) {
      ctx.pushInstruction(new Instruction("close", { item: item, ctx: ctx }));
    }
  },
  HTML_COMMENT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { item: item, ctx: ctx }));
    }
  },
  PLAIN_TEXT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { item: item, ctx: ctx }));
    }
  }
});

var generateInstructions = function generateInstructions(ast, options) {
  return generateWalker(ast, options.context);
};

module.exports = generateInstructions;
//# sourceMappingURL=buildInstructions.js.map
},{"../utils/Instruction":10,"../visitor":14}],6:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

var visitor = _interopRequire(require("../visitor"));

var generatedWalker = visitor.build({
  HTML_ELEMENT: function HTML_ELEMENT(item) {
    var node = item.node;

    var key = node[1].tag_info.key;
    if (util.elTypes.escapableRaw.indexOf(key) > -1) {
      node[1].escapableRaw = true;
    }
  }
});

var escapableRaw = function escapableRaw(ast, options) {
  return generatedWalker(ast, options.context);
};

module.exports = escapableRaw;
//# sourceMappingURL=escapableRaw.js.map
},{"../utils/builder":11,"../visitor":14}],7:[function(require,module,exports){
/* eslint camelcase: 0 */
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var generator = _interopRequire(require("../codeGenerator"));

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

var STATES = _utilsBuilder.STATES;

var noop = function noop() {};

var codeGenerator = generator.build({
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

var generateJavascript = function generateJavascript(ast, options) {
  options.results.code = {
    fragments: [],
    renderers: [],
    push: function push(idx, strings) {
      var fragment = strings.fragment;
      var renderer = strings.renderer;

      if (idx >= this.fragments.length) {
        if (fragment) this.fragments.push(fragment);
        if (renderer) this.renderers.push(renderer);
      } else {
        if (fragment) this.fragments[idx] += fragment;
        if (renderer) this.renderers[idx] += renderer;
      }
    },
    slice: function slice(type, idx, start, end) {
      if (this[type] && this[type][idx]) {
        this[type][idx] = this[type][idx].slice(start, end);
      }
    }
  };
  return codeGenerator(options.results.instructions, options.results.code);
};

module.exports = generateJavascript;
//# sourceMappingURL=generateJS.js.map
},{"../codeGenerator":2,"../utils/builder":11}],8:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var namedEntities = _interopRequire(require("../utils/namedHTMLEntities"));

var hexDecEntities = _interopRequire(require("../utils/hexDecHTMLEntities"));

var visitor = _interopRequire(require("../visitor"));

var generatedWalker = visitor.build({
  HTML_ENTITY: function HTML_ENTITY(item) {
    var node = item.node;

    var entity = node[1];
    var value = undefined;
    var entityType = namedEntities[entity];
    var entityAlias = hexDecEntities[entity];
    if (entityAlias) {
      entityType = namedEntities[entityAlias.entityName];
    }
    if (entityType) {
      value = entityType.characters;
    }
    node[0] = "PLAIN_TEXT";
    node[1] = value;
  }
});

var htmlEntities = function htmlEntities(ast, options) {
  return generatedWalker(ast, options.context);
};

module.exports = htmlEntities;
//# sourceMappingURL=htmlEntities.js.map
},{"../utils/hexDecHTMLEntities":12,"../utils/namedHTMLEntities":13,"../visitor":14}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

var flush = function flush(results) {
  results.code = "(function(){\nvar frags = {},\n  template = {\n    " + results.code.fragments.join(",\n    ") + ",\n    " + results.code.renderers.join(",\n    ") + "\n  };\n  template.render = template.r0;\n  td." + util.getTdMethodName("register") + "(\"" + results.name + "\", template);\n  return template;\n})();";
};

var postprocess = function postprocess(ast, options) {
  var results = options.results;
  if (results) {
    flush(results);
  }
};

module.exports = postprocess;
//# sourceMappingURL=postprocess.js.map
},{"../utils/builder":11}],10:[function(require,module,exports){
"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var Instruction = function Instruction(action, config) {
  var item = config.item;
  var key = config.key;
  var indexPath = config.indexPath;
  var state = item.state;
  var node = item.node;
  var namespace = item.namespace;
  var blockName = item.blockName;
  var blockIndex = item.blockIndex;
  var parentNodeIdx = item.parentNodeIdx;
  var parentTdBody = item.parentTdBody;
  var tdBody = item.tdBody;

  var _node = _slicedToArray(node, 1);

  var nodeType = _node[0];

  var contents = undefined;
  var parentNodeName = parentNodeIdx === -1 ? "frag" : "el" + parentNodeIdx;
  var bodyType = undefined,
      tdMethodName = undefined,
      needsOwnMethod = undefined,
      hasTornadoRef = undefined;
  if (nodeType === "TORNADO_BODY") {
    bodyType = node[1].type || "";
    needsOwnMethod = !!(node[1].body && node[1].body.length);

    if (blockName) {
      tdMethodName = "_" + bodyType.substring(0, 1) + "_" + blockName;

      if (blockIndex !== undefined) {
        tdMethodName += blockIndex;
      }
    }
  } else if (nodeType === "HTML_ATTRIBUTE") {
    var attrVal = node[1].value;
    hasTornadoRef = attrVal && attrVal.some(function (val) {
      var type = val[0];
      return type === "TORNADO_REFERENCE" || type === "TORNADO_BODY" || type === "TORNADO_PARTIAL";
    });
  } else if (nodeType === "HTML_COMMENT" || nodeType === "PLAIN_TEXT") {
    contents = node[1].replace(/'/g, "\\'");
  }
  indexPath = item.indexPath;
  var instr = {
    action: action,
    nodeType: nodeType,
    bodyType: bodyType,
    blockIndex: blockIndex,
    needsOwnMethod: needsOwnMethod,
    hasTornadoRef: hasTornadoRef,
    tdMethodName: tdMethodName,
    parentTdBody: parentTdBody,
    tdBody: tdBody,
    contents: contents,
    parentNodeName: parentNodeName,
    indexPath: indexPath,
    key: key,
    state: state,
    node: node,
    namespace: namespace,
    elCount: parentNodeIdx + 1
  };
  return instr;
};

module.exports = Instruction;
//# sourceMappingURL=Instruction.js.map
},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
//TODO: instead of using helper methods this should be an API that does things.
var STATES = {
  OUTER_SPACE: "OUTER_SPACE",
  HTML_TAG: "HTML_TAG",
  HTML_BODY: "HTML_BODY",
  HTML_ELEMENT: "HTML_BODY",
  HTML_ATTRIBUTE: "HTML_ATTRIBUTE",
  ESCAPABLE_RAW: "ESCAPABLE_RAW",
  TORNADO_TAG: "TORNADO_TAG",
  TORNADO_BODY: "TORNADO_BODY"
};
exports.STATES = STATES;
var methodNameMap = {
  register: "r",
  get: "g",
  createDocumentFragment: "f",
  createTextNode: "t",
  createHTMLComment: "c",
  createElement: "m",
  setAttribute: "a",
  getPartial: "p",
  replaceNode: "n",
  exists: "e",
  helper: "h",
  block: "b",
  getNodeAtIdxPath: "i",
  nodeToString: "s"
};
var PRODUCTION = "production";
var mode = "dev"; //TODO: this should be an option in the compiler

exports["default"] = {
  /**
   * Return a method name based on whether we are compiling for production or dev
   * @param {String} fullName The full name of the method
   * @return {String} Return the shortened alias name or the fullName
   */
  getTdMethodName: function getTdMethodName(fullName) {
    if (mode === PRODUCTION) {
      return methodNameMap[fullName];
    } else {
      return fullName;
    }
  },

  /**
   * Adjust an attribute's name as necessary (e.g. SVG cares about case)
   * @param {String} elType The element's tag name
   * @param {String} attrName The attribute's name before adjustment
   * @return {String} The adjusted attribute name (or the given attribute name if no adjustment
   * is needed)
   */
  adjustAttrName: function adjustAttrName(elType, attrName, ctx) {
    if (ctx.namespace) {
      attrName = this.svgAdjustAttrs[attrName] || attrName;
    }
    return attrName;
  },

  elTypes: {
    escapableRaw: ["textarea", "title"]
  }
};
//# sourceMappingURL=builder.js.map
},{}],12:[function(require,module,exports){
"use strict";var hexDecEntities={"&#9;":{entityName:"&Tab;"}, "&#10;":{entityName:"&NewLine;"}, "&#33;":{entityName:"&excl;"}, "&#34;":{entityName:"&quot;"}, "&#35;":{entityName:"&num;"}, "&#36;":{entityName:"&dollar;"}, "&#37;":{entityName:"&percnt;"}, "&#38;":{entityName:"&amp;"}, "&#39;":{entityName:"&apos;"}, "&#40;":{entityName:"&lpar;"}, "&#41;":{entityName:"&rpar;"}, "&#42;":{entityName:"&ast;"}, "&#43;":{entityName:"&plus;"}, "&#44;":{entityName:"&comma;"}, "&#46;":{entityName:"&period;"}, "&#47;":{entityName:"&sol;"}, "&#58;":{entityName:"&colon;"}, "&#59;":{entityName:"&semi;"}, "&#60;":{entityName:"&lt;"}, "&#61;":{entityName:"&equals;"}, "&#62;":{entityName:"&gt;"}, "&#63;":{entityName:"&quest;"}, "&#64;":{entityName:"&commat;"}, "&#91;":{entityName:"&lsqb;"}, "&#92;":{entityName:"&bsol;"}, "&#93;":{entityName:"&rsqb;"}, "&#94;":{entityName:"&Hat;"}, "&#95;":{entityName:"&lowbar;"}, "&#96;":{entityName:"&grave;"}, "&#123;":{entityName:"&lcub;"}, "&#124;":{entityName:"&verbar;"}, "&#125;":{entityName:"&rcub;"}, "&#160;":{entityName:"&nbsp;"}, "&#161;":{entityName:"&iexcl;"}, "&#162;":{entityName:"&cent;"}, "&#163;":{entityName:"&pound;"}, "&#164;":{entityName:"&curren;"}, "&#165;":{entityName:"&yen;"}, "&#166;":{entityName:"&brvbar;"}, "&#167;":{entityName:"&sect;"}, "&#168;":{entityName:"&Dot;"}, "&#169;":{entityName:"&copy;"}, "&#170;":{entityName:"&ordf;"}, "&#171;":{entityName:"&laquo;"}, "&#172;":{entityName:"&not;"}, "&#173;":{entityName:"&shy;"}, "&#174;":{entityName:"&reg;"}, "&#175;":{entityName:"&macr;"}, "&#176;":{entityName:"&deg;"}, "&#177;":{entityName:"&plusmn;"}, "&#178;":{entityName:"&sup2;"}, "&#179;":{entityName:"&sup3;"}, "&#180;":{entityName:"&acute;"}, "&#181;":{entityName:"&micro;"}, "&#182;":{entityName:"&para;"}, "&#183;":{entityName:"&middot;"}, "&#184;":{entityName:"&cedil;"}, "&#185;":{entityName:"&sup1;"}, "&#186;":{entityName:"&ordm;"}, "&#187;":{entityName:"&raquo;"}, "&#188;":{entityName:"&frac14;"}, "&#189;":{entityName:"&frac12;"}, "&#190;":{entityName:"&frac34;"}, "&#191;":{entityName:"&iquest;"}, "&#192;":{entityName:"&Agrave;"}, "&#193;":{entityName:"&Aacute;"}, "&#194;":{entityName:"&Acirc;"}, "&#195;":{entityName:"&Atilde;"}, "&#196;":{entityName:"&Auml;"}, "&#197;":{entityName:"&Aring;"}, "&#198;":{entityName:"&AElig;"}, "&#199;":{entityName:"&Ccedil;"}, "&#200;":{entityName:"&Egrave;"}, "&#201;":{entityName:"&Eacute;"}, "&#202;":{entityName:"&Ecirc;"}, "&#203;":{entityName:"&Euml;"}, "&#204;":{entityName:"&Igrave;"}, "&#205;":{entityName:"&Iacute;"}, "&#206;":{entityName:"&Icirc;"}, "&#207;":{entityName:"&Iuml;"}, "&#208;":{entityName:"&ETH;"}, "&#209;":{entityName:"&Ntilde;"}, "&#210;":{entityName:"&Ograve;"}, "&#211;":{entityName:"&Oacute;"}, "&#212;":{entityName:"&Ocirc;"}, "&#213;":{entityName:"&Otilde;"}, "&#214;":{entityName:"&Ouml;"}, "&#215;":{entityName:"&times;"}, "&#216;":{entityName:"&Oslash;"}, "&#217;":{entityName:"&Ugrave;"}, "&#218;":{entityName:"&Uacute;"}, "&#219;":{entityName:"&Ucirc;"}, "&#220;":{entityName:"&Uuml;"}, "&#221;":{entityName:"&Yacute;"}, "&#222;":{entityName:"&THORN;"}, "&#223;":{entityName:"&szlig;"}, "&#224;":{entityName:"&agrave;"}, "&#225;":{entityName:"&aacute;"}, "&#226;":{entityName:"&acirc;"}, "&#227;":{entityName:"&atilde;"}, "&#228;":{entityName:"&auml;"}, "&#229;":{entityName:"&aring;"}, "&#230;":{entityName:"&aelig;"}, "&#231;":{entityName:"&ccedil;"}, "&#232;":{entityName:"&egrave;"}, "&#233;":{entityName:"&eacute;"}, "&#234;":{entityName:"&ecirc;"}, "&#235;":{entityName:"&euml;"}, "&#236;":{entityName:"&igrave;"}, "&#237;":{entityName:"&iacute;"}, "&#238;":{entityName:"&icirc;"}, "&#239;":{entityName:"&iuml;"}, "&#240;":{entityName:"&eth;"}, "&#241;":{entityName:"&ntilde;"}, "&#242;":{entityName:"&ograve;"}, "&#243;":{entityName:"&oacute;"}, "&#244;":{entityName:"&ocirc;"}, "&#245;":{entityName:"&otilde;"}, "&#246;":{entityName:"&ouml;"}, "&#247;":{entityName:"&divide;"}, "&#248;":{entityName:"&oslash;"}, "&#249;":{entityName:"&ugrave;"}, "&#250;":{entityName:"&uacute;"}, "&#251;":{entityName:"&ucirc;"}, "&#252;":{entityName:"&uuml;"}, "&#253;":{entityName:"&yacute;"}, "&#254;":{entityName:"&thorn;"}, "&#255;":{entityName:"&yuml;"}, "&#256;":{entityName:"&Amacr;"}, "&#257;":{entityName:"&amacr;"}, "&#258;":{entityName:"&Abreve;"}, "&#259;":{entityName:"&abreve;"}, "&#260;":{entityName:"&Aogon;"}, "&#261;":{entityName:"&aogon;"}, "&#262;":{entityName:"&Cacute;"}, "&#263;":{entityName:"&cacute;"}, "&#264;":{entityName:"&Ccirc;"}, "&#265;":{entityName:"&ccirc;"}, "&#266;":{entityName:"&Cdot;"}, "&#267;":{entityName:"&cdot;"}, "&#268;":{entityName:"&Ccaron;"}, "&#269;":{entityName:"&ccaron;"}, "&#270;":{entityName:"&Dcaron;"}, "&#271;":{entityName:"&dcaron;"}, "&#272;":{entityName:"&Dstrok;"}, "&#273;":{entityName:"&dstrok;"}, "&#274;":{entityName:"&Emacr;"}, "&#275;":{entityName:"&emacr;"}, "&#278;":{entityName:"&Edot;"}, "&#279;":{entityName:"&edot;"}, "&#280;":{entityName:"&Eogon;"}, "&#281;":{entityName:"&eogon;"}, "&#282;":{entityName:"&Ecaron;"}, "&#283;":{entityName:"&ecaron;"}, "&#284;":{entityName:"&Gcirc;"}, "&#285;":{entityName:"&gcirc;"}, "&#286;":{entityName:"&Gbreve;"}, "&#287;":{entityName:"&gbreve;"}, "&#288;":{entityName:"&Gdot;"}, "&#289;":{entityName:"&gdot;"}, "&#290;":{entityName:"&Gcedil;"}, "&#292;":{entityName:"&Hcirc;"}, "&#293;":{entityName:"&hcirc;"}, "&#294;":{entityName:"&Hstrok;"}, "&#295;":{entityName:"&hstrok;"}, "&#296;":{entityName:"&Itilde;"}, "&#297;":{entityName:"&itilde;"}, "&#298;":{entityName:"&Imacr;"}, "&#299;":{entityName:"&imacr;"}, "&#302;":{entityName:"&Iogon;"}, "&#303;":{entityName:"&iogon;"}, "&#304;":{entityName:"&Idot;"}, "&#305;":{entityName:"&imath;"}, "&#306;":{entityName:"&IJlig;"}, "&#307;":{entityName:"&ijlig;"}, "&#308;":{entityName:"&Jcirc;"}, "&#309;":{entityName:"&jcirc;"}, "&#310;":{entityName:"&Kcedil;"}, "&#311;":{entityName:"&kcedil;"}, "&#312;":{entityName:"&kgreen;"}, "&#313;":{entityName:"&Lacute;"}, "&#314;":{entityName:"&lacute;"}, "&#315;":{entityName:"&Lcedil;"}, "&#316;":{entityName:"&lcedil;"}, "&#317;":{entityName:"&Lcaron;"}, "&#318;":{entityName:"&lcaron;"}, "&#319;":{entityName:"&Lmidot;"}, "&#320;":{entityName:"&lmidot;"}, "&#321;":{entityName:"&Lstrok;"}, "&#322;":{entityName:"&lstrok;"}, "&#323;":{entityName:"&Nacute;"}, "&#324;":{entityName:"&nacute;"}, "&#325;":{entityName:"&Ncedil;"}, "&#326;":{entityName:"&ncedil;"}, "&#327;":{entityName:"&Ncaron;"}, "&#328;":{entityName:"&ncaron;"}, "&#329;":{entityName:"&napos;"}, "&#330;":{entityName:"&ENG;"}, "&#331;":{entityName:"&eng;"}, "&#332;":{entityName:"&Omacr;"}, "&#333;":{entityName:"&omacr;"}, "&#336;":{entityName:"&Odblac;"}, "&#337;":{entityName:"&odblac;"}, "&#338;":{entityName:"&OElig;"}, "&#339;":{entityName:"&oelig;"}, "&#340;":{entityName:"&Racute;"}, "&#341;":{entityName:"&racute;"}, "&#342;":{entityName:"&Rcedil;"}, "&#343;":{entityName:"&rcedil;"}, "&#344;":{entityName:"&Rcaron;"}, "&#345;":{entityName:"&rcaron;"}, "&#346;":{entityName:"&Sacute;"}, "&#347;":{entityName:"&sacute;"}, "&#348;":{entityName:"&Scirc;"}, "&#349;":{entityName:"&scirc;"}, "&#350;":{entityName:"&Scedil;"}, "&#351;":{entityName:"&scedil;"}, "&#352;":{entityName:"&Scaron;"}, "&#353;":{entityName:"&scaron;"}, "&#354;":{entityName:"&Tcedil;"}, "&#355;":{entityName:"&tcedil;"}, "&#356;":{entityName:"&Tcaron;"}, "&#357;":{entityName:"&tcaron;"}, "&#358;":{entityName:"&Tstrok;"}, "&#359;":{entityName:"&tstrok;"}, "&#360;":{entityName:"&Utilde;"}, "&#361;":{entityName:"&utilde;"}, "&#362;":{entityName:"&Umacr;"}, "&#363;":{entityName:"&umacr;"}, "&#364;":{entityName:"&Ubreve;"}, "&#365;":{entityName:"&ubreve;"}, "&#366;":{entityName:"&Uring;"}, "&#367;":{entityName:"&uring;"}, "&#368;":{entityName:"&Udblac;"}, "&#369;":{entityName:"&udblac;"}, "&#370;":{entityName:"&Uogon;"}, "&#371;":{entityName:"&uogon;"}, "&#372;":{entityName:"&Wcirc;"}, "&#373;":{entityName:"&wcirc;"}, "&#374;":{entityName:"&Ycirc;"}, "&#375;":{entityName:"&ycirc;"}, "&#376;":{entityName:"&Yuml;"}, "&#377;":{entityName:"&Zacute;"}, "&#378;":{entityName:"&zacute;"}, "&#379;":{entityName:"&Zdot;"}, "&#380;":{entityName:"&zdot;"}, "&#381;":{entityName:"&Zcaron;"}, "&#382;":{entityName:"&zcaron;"}, "&#402;":{entityName:"&fnof;"}, "&#437;":{entityName:"&imped;"}, "&#501;":{entityName:"&gacute;"}, "&#567;":{entityName:"&jmath;"}, "&#710;":{entityName:"&circ;"}, "&#711;":{entityName:"&caron;"}, "&#728;":{entityName:"&breve;"}, "&#729;":{entityName:"&dot;"}, "&#730;":{entityName:"&ring;"}, "&#731;":{entityName:"&ogon;"}, "&#732;":{entityName:"&tilde;"}, "&#733;":{entityName:"&dblac;"}, "&#785;":{entityName:"&DownBreve;"}, "&#818;":{entityName:"&UnderBar;"}, "&#913;":{entityName:"&Alpha;"}, "&#914;":{entityName:"&Beta;"}, "&#915;":{entityName:"&Gamma;"}, "&#916;":{entityName:"&Delta;"}, "&#917;":{entityName:"&Epsilon;"}, "&#918;":{entityName:"&Zeta;"}, "&#919;":{entityName:"&Eta;"}, "&#920;":{entityName:"&Theta;"}, "&#921;":{entityName:"&Iota;"}, "&#922;":{entityName:"&Kappa;"}, "&#923;":{entityName:"&Lambda;"}, "&#924;":{entityName:"&Mu;"}, "&#925;":{entityName:"&Nu;"}, "&#926;":{entityName:"&Xi;"}, "&#927;":{entityName:"&Omicron;"}, "&#928;":{entityName:"&Pi;"}, "&#929;":{entityName:"&Rho;"}, "&#931;":{entityName:"&Sigma;"}, "&#932;":{entityName:"&Tau;"}, "&#933;":{entityName:"&Upsilon;"}, "&#934;":{entityName:"&Phi;"}, "&#935;":{entityName:"&Chi;"}, "&#936;":{entityName:"&Psi;"}, "&#937;":{entityName:"&Omega;"}, "&#945;":{entityName:"&alpha;"}, "&#946;":{entityName:"&beta;"}, "&#947;":{entityName:"&gamma;"}, "&#948;":{entityName:"&delta;"}, "&#949;":{entityName:"&epsiv;"}, "&#950;":{entityName:"&zeta;"}, "&#951;":{entityName:"&eta;"}, "&#952;":{entityName:"&theta;"}, "&#953;":{entityName:"&iota;"}, "&#954;":{entityName:"&kappa;"}, "&#955;":{entityName:"&lambda;"}, "&#956;":{entityName:"&mu;"}, "&#957;":{entityName:"&nu;"}, "&#958;":{entityName:"&xi;"}, "&#959;":{entityName:"&omicron;"}, "&#960;":{entityName:"&pi;"}, "&#961;":{entityName:"&rho;"}, "&#962;":{entityName:"&sigmav;"}, "&#963;":{entityName:"&sigma;"}, "&#964;":{entityName:"&tau;"}, "&#965;":{entityName:"&upsi;"}, "&#966;":{entityName:"&phi;"}, "&#967;":{entityName:"&chi;"}, "&#968;":{entityName:"&psi;"}, "&#969;":{entityName:"&omega;"}, "&#977;":{entityName:"&thetav;"}, "&#978;":{entityName:"&Upsi;"}, "&#981;":{entityName:"&straightphi;"}, "&#982;":{entityName:"&piv;"}, "&#988;":{entityName:"&Gammad;"}, "&#989;":{entityName:"&gammad;"}, "&#1008;":{entityName:"&kappav;"}, "&#1009;":{entityName:"&rhov;"}, "&#1013;":{entityName:"&epsi;"}, "&#1014;":{entityName:"&bepsi;"}, "&#1025;":{entityName:"&IOcy;"}, "&#1026;":{entityName:"&DJcy;"}, "&#1027;":{entityName:"&GJcy;"}, "&#1028;":{entityName:"&Jukcy;"}, "&#1029;":{entityName:"&DScy;"}, "&#1030;":{entityName:"&Iukcy;"}, "&#1031;":{entityName:"&YIcy;"}, "&#1032;":{entityName:"&Jsercy;"}, "&#1033;":{entityName:"&LJcy;"}, "&#1034;":{entityName:"&NJcy;"}, "&#1035;":{entityName:"&TSHcy;"}, "&#1036;":{entityName:"&KJcy;"}, "&#1038;":{entityName:"&Ubrcy;"}, "&#1039;":{entityName:"&DZcy;"}, "&#1040;":{entityName:"&Acy;"}, "&#1041;":{entityName:"&Bcy;"}, "&#1042;":{entityName:"&Vcy;"}, "&#1043;":{entityName:"&Gcy;"}, "&#1044;":{entityName:"&Dcy;"}, "&#1045;":{entityName:"&IEcy;"}, "&#1046;":{entityName:"&ZHcy;"}, "&#1047;":{entityName:"&Zcy;"}, "&#1048;":{entityName:"&Icy;"}, "&#1049;":{entityName:"&Jcy;"}, "&#1050;":{entityName:"&Kcy;"}, "&#1051;":{entityName:"&Lcy;"}, "&#1052;":{entityName:"&Mcy;"}, "&#1053;":{entityName:"&Ncy;"}, "&#1054;":{entityName:"&Ocy;"}, "&#1055;":{entityName:"&Pcy;"}, "&#1056;":{entityName:"&Rcy;"}, "&#1057;":{entityName:"&Scy;"}, "&#1058;":{entityName:"&Tcy;"}, "&#1059;":{entityName:"&Ucy;"}, "&#1060;":{entityName:"&Fcy;"}, "&#1061;":{entityName:"&KHcy;"}, "&#1062;":{entityName:"&TScy;"}, "&#1063;":{entityName:"&CHcy;"}, "&#1064;":{entityName:"&SHcy;"}, "&#1065;":{entityName:"&SHCHcy;"}, "&#1066;":{entityName:"&HARDcy;"}, "&#1067;":{entityName:"&Ycy;"}, "&#1068;":{entityName:"&SOFTcy;"}, "&#1069;":{entityName:"&Ecy;"}, "&#1070;":{entityName:"&YUcy;"}, "&#1071;":{entityName:"&YAcy;"}, "&#1072;":{entityName:"&acy;"}, "&#1073;":{entityName:"&bcy;"}, "&#1074;":{entityName:"&vcy;"}, "&#1075;":{entityName:"&gcy;"}, "&#1076;":{entityName:"&dcy;"}, "&#1077;":{entityName:"&iecy;"}, "&#1078;":{entityName:"&zhcy;"}, "&#1079;":{entityName:"&zcy;"}, "&#1080;":{entityName:"&icy;"}, "&#1081;":{entityName:"&jcy;"}, "&#1082;":{entityName:"&kcy;"}, "&#1083;":{entityName:"&lcy;"}, "&#1084;":{entityName:"&mcy;"}, "&#1085;":{entityName:"&ncy;"}, "&#1086;":{entityName:"&ocy;"}, "&#1087;":{entityName:"&pcy;"}, "&#1088;":{entityName:"&rcy;"}, "&#1089;":{entityName:"&scy;"}, "&#1090;":{entityName:"&tcy;"}, "&#1091;":{entityName:"&ucy;"}, "&#1092;":{entityName:"&fcy;"}, "&#1093;":{entityName:"&khcy;"}, "&#1094;":{entityName:"&tscy;"}, "&#1095;":{entityName:"&chcy;"}, "&#1096;":{entityName:"&shcy;"}, "&#1097;":{entityName:"&shchcy;"}, "&#1098;":{entityName:"&hardcy;"}, "&#1099;":{entityName:"&ycy;"}, "&#1100;":{entityName:"&softcy;"}, "&#1101;":{entityName:"&ecy;"}, "&#1102;":{entityName:"&yucy;"}, "&#1103;":{entityName:"&yacy;"}, "&#1105;":{entityName:"&iocy;"}, "&#1106;":{entityName:"&djcy;"}, "&#1107;":{entityName:"&gjcy;"}, "&#1108;":{entityName:"&jukcy;"}, "&#1109;":{entityName:"&dscy;"}, "&#1110;":{entityName:"&iukcy;"}, "&#1111;":{entityName:"&yicy;"}, "&#1112;":{entityName:"&jsercy;"}, "&#1113;":{entityName:"&ljcy;"}, "&#1114;":{entityName:"&njcy;"}, "&#1115;":{entityName:"&tshcy;"}, "&#1116;":{entityName:"&kjcy;"}, "&#1118;":{entityName:"&ubrcy;"}, "&#1119;":{entityName:"&dzcy;"}, "&#8194;":{entityName:"&ensp;"}, "&#8195;":{entityName:"&emsp;"}, "&#8196;":{entityName:"&emsp13;"}, "&#8197;":{entityName:"&emsp14;"}, "&#8199;":{entityName:"&numsp;"}, "&#8200;":{entityName:"&puncsp;"}, "&#8201;":{entityName:"&thinsp;"}, "&#8202;":{entityName:"&hairsp;"}, "&#8203;":{entityName:"&ZeroWidthSpace;"}, "&#8204;":{entityName:"&zwnj;"}, "&#8205;":{entityName:"&zwj;"}, "&#8206;":{entityName:"&lrm;"}, "&#8207;":{entityName:"&rlm;"}, "&#8208;":{entityName:"&hyphen;"}, "&#8211;":{entityName:"&ndash;"}, "&#8212;":{entityName:"&mdash;"}, "&#8213;":{entityName:"&horbar;"}, "&#8214;":{entityName:"&Verbar;"}, "&#8216;":{entityName:"&lsquo;"}, "&#8217;":{entityName:"&rsquo;"}, "&#8218;":{entityName:"&lsquor;"}, "&#8220;":{entityName:"&ldquo;"}, "&#8221;":{entityName:"&rdquo;"}, "&#8222;":{entityName:"&ldquor;"}, "&#8224;":{entityName:"&dagger;"}, "&#8225;":{entityName:"&Dagger;"}, "&#8226;":{entityName:"&bull;"}, "&#8229;":{entityName:"&nldr;"}, "&#8230;":{entityName:"&hellip;"}, "&#8240;":{entityName:"&permil;"}, "&#8241;":{entityName:"&pertenk;"}, "&#8242;":{entityName:"&prime;"}, "&#8243;":{entityName:"&Prime;"}, "&#8244;":{entityName:"&tprime;"}, "&#8245;":{entityName:"&bprime;"}, "&#8249;":{entityName:"&lsaquo;"}, "&#8250;":{entityName:"&rsaquo;"}, "&#8254;":{entityName:"&oline;"}, "&#8257;":{entityName:"&caret;"}, "&#8259;":{entityName:"&hybull;"}, "&#8260;":{entityName:"&frasl;"}, "&#8271;":{entityName:"&bsemi;"}, "&#8279;":{entityName:"&qprime;"}, "&#8287;":{entityName:"&MediumSpace;"}, "&#8288;":{entityName:"&NoBreak;"}, "&#8289;":{entityName:"&ApplyFunction;"}, "&#8290;":{entityName:"&InvisibleTimes;"}, "&#8291;":{entityName:"&InvisibleComma;"}, "&#8364;":{entityName:"&euro;"}, "&#8411;":{entityName:"&tdot;"}, "&#8412;":{entityName:"&DotDot;"}, "&#8450;":{entityName:"&Copf;"}, "&#8453;":{entityName:"&incare;"}, "&#8458;":{entityName:"&gscr;"}, "&#8459;":{entityName:"&hamilt;"}, "&#8460;":{entityName:"&Hfr;"}, "&#8461;":{entityName:"&quaternions;"}, "&#8462;":{entityName:"&planckh;"}, "&#8463;":{entityName:"&planck;"}, "&#8464;":{entityName:"&Iscr;"}, "&#8465;":{entityName:"&image;"}, "&#8466;":{entityName:"&Lscr;"}, "&#8467;":{entityName:"&ell;"}, "&#8469;":{entityName:"&Nopf;"}, "&#8470;":{entityName:"&numero;"}, "&#8471;":{entityName:"&copysr;"}, "&#8472;":{entityName:"&weierp;"}, "&#8473;":{entityName:"&Popf;"}, "&#8474;":{entityName:"&rationals;"}, "&#8475;":{entityName:"&Rscr;"}, "&#8476;":{entityName:"&real;"}, "&#8477;":{entityName:"&reals;"}, "&#8478;":{entityName:"&rx;"}, "&#8482;":{entityName:"&trade;"}, "&#8484;":{entityName:"&integers;"}, "&#8486;":{entityName:"&ohm;"}, "&#8487;":{entityName:"&mho;"}, "&#8488;":{entityName:"&Zfr;"}, "&#8489;":{entityName:"&iiota;"}, "&#8491;":{entityName:"&angst;"}, "&#8492;":{entityName:"&bernou;"}, "&#8493;":{entityName:"&Cfr;"}, "&#8495;":{entityName:"&escr;"}, "&#8496;":{entityName:"&Escr;"}, "&#8497;":{entityName:"&Fscr;"}, "&#8499;":{entityName:"&phmmat;"}, "&#8500;":{entityName:"&order;"}, "&#8501;":{entityName:"&alefsym;"}, "&#8502;":{entityName:"&beth;"}, "&#8503;":{entityName:"&gimel;"}, "&#8504;":{entityName:"&daleth;"}, "&#8517;":{entityName:"&CapitalDifferentialD;"}, "&#8518;":{entityName:"&DifferentialD;"}, "&#8519;":{entityName:"&ExponentialE;"}, "&#8520;":{entityName:"&ImaginaryI;"}, "&#8531;":{entityName:"&frac13;"}, "&#8532;":{entityName:"&frac23;"}, "&#8533;":{entityName:"&frac15;"}, "&#8534;":{entityName:"&frac25;"}, "&#8535;":{entityName:"&frac35;"}, "&#8536;":{entityName:"&frac45;"}, "&#8537;":{entityName:"&frac16;"}, "&#8538;":{entityName:"&frac56;"}, "&#8539;":{entityName:"&frac18;"}, "&#8540;":{entityName:"&frac38;"}, "&#8541;":{entityName:"&frac58;"}, "&#8542;":{entityName:"&frac78;"}, "&#8592;":{entityName:"&larr;"}, "&#8593;":{entityName:"&uarr;"}, "&#8594;":{entityName:"&rarr;"}, "&#8595;":{entityName:"&darr;"}, "&#8596;":{entityName:"&harr;"}, "&#8597;":{entityName:"&varr;"}, "&#8598;":{entityName:"&nwarr;"}, "&#8599;":{entityName:"&nearr;"}, "&#8600;":{entityName:"&searr;"}, "&#8601;":{entityName:"&swarr;"}, "&#8602;":{entityName:"&nlarr;"}, "&#8603;":{entityName:"&nrarr;"}, "&#8605;":{entityName:"&rarrw;"}, "&#8606;":{entityName:"&Larr;"}, "&#8607;":{entityName:"&Uarr;"}, "&#8608;":{entityName:"&Rarr;"}, "&#8609;":{entityName:"&Darr;"}, "&#8610;":{entityName:"&larrtl;"}, "&#8611;":{entityName:"&rarrtl;"}, "&#8612;":{entityName:"&LeftTeeArrow;"}, "&#8613;":{entityName:"&UpTeeArrow;"}, "&#8614;":{entityName:"&map;"}, "&#8615;":{entityName:"&DownTeeArrow;"}, "&#8617;":{entityName:"&larrhk;"}, "&#8618;":{entityName:"&rarrhk;"}, "&#8619;":{entityName:"&larrlp;"}, "&#8620;":{entityName:"&rarrlp;"}, "&#8621;":{entityName:"&harrw;"}, "&#8622;":{entityName:"&nharr;"}, "&#8624;":{entityName:"&lsh;"}, "&#8625;":{entityName:"&rsh;"}, "&#8626;":{entityName:"&ldsh;"}, "&#8627;":{entityName:"&rdsh;"}, "&#8629;":{entityName:"&crarr;"}, "&#8630;":{entityName:"&cularr;"}, "&#8631;":{entityName:"&curarr;"}, "&#8634;":{entityName:"&olarr;"}, "&#8635;":{entityName:"&orarr;"}, "&#8636;":{entityName:"&lharu;"}, "&#8637;":{entityName:"&lhard;"}, "&#8638;":{entityName:"&uharr;"}, "&#8639;":{entityName:"&uharl;"}, "&#8640;":{entityName:"&rharu;"}, "&#8641;":{entityName:"&rhard;"}, "&#8642;":{entityName:"&dharr;"}, "&#8643;":{entityName:"&dharl;"}, "&#8644;":{entityName:"&rlarr;"}, "&#8645;":{entityName:"&udarr;"}, "&#8646;":{entityName:"&lrarr;"}, "&#8647;":{entityName:"&llarr;"}, "&#8648;":{entityName:"&uuarr;"}, "&#8649;":{entityName:"&rrarr;"}, "&#8650;":{entityName:"&ddarr;"}, "&#8651;":{entityName:"&lrhar;"}, "&#8652;":{entityName:"&rlhar;"}, "&#8653;":{entityName:"&nlArr;"}, "&#8654;":{entityName:"&nhArr;"}, "&#8655;":{entityName:"&nrArr;"}, "&#8656;":{entityName:"&lArr;"}, "&#8657;":{entityName:"&uArr;"}, "&#8658;":{entityName:"&rArr;"}, "&#8659;":{entityName:"&dArr;"}, "&#8660;":{entityName:"&hArr;"}, "&#8661;":{entityName:"&vArr;"}, "&#8662;":{entityName:"&nwArr;"}, "&#8663;":{entityName:"&neArr;"}, "&#8664;":{entityName:"&seArr;"}, "&#8665;":{entityName:"&swArr;"}, "&#8666;":{entityName:"&lAarr;"}, "&#8667;":{entityName:"&rAarr;"}, "&#8669;":{entityName:"&zigrarr;"}, "&#8676;":{entityName:"&larrb;"}, "&#8677;":{entityName:"&rarrb;"}, "&#8693;":{entityName:"&duarr;"}, "&#8701;":{entityName:"&loarr;"}, "&#8702;":{entityName:"&roarr;"}, "&#8703;":{entityName:"&hoarr;"}, "&#8704;":{entityName:"&forall;"}, "&#8705;":{entityName:"&comp;"}, "&#8706;":{entityName:"&part;"}, "&#8707;":{entityName:"&exist;"}, "&#8708;":{entityName:"&nexist;"}, "&#8709;":{entityName:"&empty;"}, "&#8711;":{entityName:"&nabla;"}, "&#8712;":{entityName:"&isin;"}, "&#8713;":{entityName:"&notin;"}, "&#8715;":{entityName:"&niv;"}, "&#8716;":{entityName:"&notni;"}, "&#8719;":{entityName:"&prod;"}, "&#8720;":{entityName:"&coprod;"}, "&#8721;":{entityName:"&sum;"}, "&#8722;":{entityName:"&minus;"}, "&#8723;":{entityName:"&mnplus;"}, "&#8724;":{entityName:"&plusdo;"}, "&#8726;":{entityName:"&setmn;"}, "&#8727;":{entityName:"&lowast;"}, "&#8728;":{entityName:"&compfn;"}, "&#8730;":{entityName:"&radic;"}, "&#8733;":{entityName:"&prop;"}, "&#8734;":{entityName:"&infin;"}, "&#8735;":{entityName:"&angrt;"}, "&#8736;":{entityName:"&ang;"}, "&#8737;":{entityName:"&angmsd;"}, "&#8738;":{entityName:"&angsph;"}, "&#8739;":{entityName:"&mid;"}, "&#8740;":{entityName:"&nmid;"}, "&#8741;":{entityName:"&par;"}, "&#8742;":{entityName:"&npar;"}, "&#8743;":{entityName:"&and;"}, "&#8744;":{entityName:"&or;"}, "&#8745;":{entityName:"&cap;"}, "&#8746;":{entityName:"&cup;"}, "&#8747;":{entityName:"&int;"}, "&#8748;":{entityName:"&Int;"}, "&#8749;":{entityName:"&tint;"}, "&#8750;":{entityName:"&conint;"}, "&#8751;":{entityName:"&Conint;"}, "&#8752;":{entityName:"&Cconint;"}, "&#8753;":{entityName:"&cwint;"}, "&#8754;":{entityName:"&cwconint;"}, "&#8755;":{entityName:"&awconint;"}, "&#8756;":{entityName:"&there4;"}, "&#8757;":{entityName:"&becaus;"}, "&#8758;":{entityName:"&ratio;"}, "&#8759;":{entityName:"&Colon;"}, "&#8760;":{entityName:"&minusd;"}, "&#8762;":{entityName:"&mDDot;"}, "&#8763;":{entityName:"&homtht;"}, "&#8764;":{entityName:"&sim;"}, "&#8765;":{entityName:"&bsim;"}, "&#8766;":{entityName:"&ac;"}, "&#8767;":{entityName:"&acd;"}, "&#8768;":{entityName:"&wreath;"}, "&#8769;":{entityName:"&nsim;"}, "&#8770;":{entityName:"&esim;"}, "&#8771;":{entityName:"&sime;"}, "&#8772;":{entityName:"&nsime;"}, "&#8773;":{entityName:"&cong;"}, "&#8774;":{entityName:"&simne;"}, "&#8775;":{entityName:"&ncong;"}, "&#8776;":{entityName:"&asymp;"}, "&#8777;":{entityName:"&nap;"}, "&#8778;":{entityName:"&ape;"}, "&#8779;":{entityName:"&apid;"}, "&#8780;":{entityName:"&bcong;"}, "&#8781;":{entityName:"&asympeq;"}, "&#8782;":{entityName:"&bump;"}, "&#8783;":{entityName:"&bumpe;"}, "&#8784;":{entityName:"&esdot;"}, "&#8785;":{entityName:"&eDot;"}, "&#8786;":{entityName:"&efDot;"}, "&#8787;":{entityName:"&erDot;"}, "&#8788;":{entityName:"&colone;"}, "&#8789;":{entityName:"&ecolon;"}, "&#8790;":{entityName:"&ecir;"}, "&#8791;":{entityName:"&cire;"}, "&#8793;":{entityName:"&wedgeq;"}, "&#8794;":{entityName:"&veeeq;"}, "&#8796;":{entityName:"&trie;"}, "&#8799;":{entityName:"&equest;"}, "&#8800;":{entityName:"&ne;"}, "&#8801;":{entityName:"&equiv;"}, "&#8802;":{entityName:"&nequiv;"}, "&#8804;":{entityName:"&le;"}, "&#8805;":{entityName:"&ge;"}, "&#8806;":{entityName:"&lE;"}, "&#8807;":{entityName:"&gE;"}, "&#8808;":{entityName:"&lnE;"}, "&#8809;":{entityName:"&gnE;"}, "&#8810;":{entityName:"&Lt;"}, "&#8811;":{entityName:"&Gt;"}, "&#8812;":{entityName:"&twixt;"}, "&#8813;":{entityName:"&NotCupCap;"}, "&#8814;":{entityName:"&nlt;"}, "&#8815;":{entityName:"&ngt;"}, "&#8816;":{entityName:"&nle;"}, "&#8817;":{entityName:"&nge;"}, "&#8818;":{entityName:"&lsim;"}, "&#8819;":{entityName:"&gsim;"}, "&#8820;":{entityName:"&nlsim;"}, "&#8821;":{entityName:"&ngsim;"}, "&#8822;":{entityName:"&lg;"}, "&#8823;":{entityName:"&gl;"}, "&#8824;":{entityName:"&ntlg;"}, "&#8825;":{entityName:"&ntgl;"}, "&#8826;":{entityName:"&pr;"}, "&#8827;":{entityName:"&sc;"}, "&#8828;":{entityName:"&prcue;"}, "&#8829;":{entityName:"&sccue;"}, "&#8830;":{entityName:"&prsim;"}, "&#8831;":{entityName:"&scsim;"}, "&#8832;":{entityName:"&npr;"}, "&#8833;":{entityName:"&nsc;"}, "&#8834;":{entityName:"&sub;"}, "&#8835;":{entityName:"&sup;"}, "&#8836;":{entityName:"&nsub;"}, "&#8837;":{entityName:"&nsup;"}, "&#8838;":{entityName:"&sube;"}, "&#8839;":{entityName:"&supe;"}, "&#8840;":{entityName:"&nsube;"}, "&#8841;":{entityName:"&nsupe;"}, "&#8842;":{entityName:"&subne;"}, "&#8843;":{entityName:"&supne;"}, "&#8845;":{entityName:"&cupdot;"}, "&#8846;":{entityName:"&uplus;"}, "&#8847;":{entityName:"&sqsub;"}, "&#8848;":{entityName:"&sqsup;"}, "&#8849;":{entityName:"&sqsube;"}, "&#8850;":{entityName:"&sqsupe;"}, "&#8851;":{entityName:"&sqcap;"}, "&#8852;":{entityName:"&sqcup;"}, "&#8853;":{entityName:"&oplus;"}, "&#8854;":{entityName:"&ominus;"}, "&#8855;":{entityName:"&otimes;"}, "&#8856;":{entityName:"&osol;"}, "&#8857;":{entityName:"&odot;"}, "&#8858;":{entityName:"&ocir;"}, "&#8859;":{entityName:"&oast;"}, "&#8861;":{entityName:"&odash;"}, "&#8862;":{entityName:"&plusb;"}, "&#8863;":{entityName:"&minusb;"}, "&#8864;":{entityName:"&timesb;"}, "&#8865;":{entityName:"&sdotb;"}, "&#8866;":{entityName:"&vdash;"}, "&#8867;":{entityName:"&dashv;"}, "&#8868;":{entityName:"&top;"}, "&#8869;":{entityName:"&bottom;"}, "&#8871;":{entityName:"&models;"}, "&#8872;":{entityName:"&vDash;"}, "&#8873;":{entityName:"&Vdash;"}, "&#8874;":{entityName:"&Vvdash;"}, "&#8875;":{entityName:"&VDash;"}, "&#8876;":{entityName:"&nvdash;"}, "&#8877;":{entityName:"&nvDash;"}, "&#8878;":{entityName:"&nVdash;"}, "&#8879;":{entityName:"&nVDash;"}, "&#8880;":{entityName:"&prurel;"}, "&#8882;":{entityName:"&vltri;"}, "&#8883;":{entityName:"&vrtri;"}, "&#8884;":{entityName:"&ltrie;"}, "&#8885;":{entityName:"&rtrie;"}, "&#8886;":{entityName:"&origof;"}, "&#8887;":{entityName:"&imof;"}, "&#8888;":{entityName:"&mumap;"}, "&#8889;":{entityName:"&hercon;"}, "&#8890;":{entityName:"&intcal;"}, "&#8891;":{entityName:"&veebar;"}, "&#8893;":{entityName:"&barvee;"}, "&#8894;":{entityName:"&angrtvb;"}, "&#8895;":{entityName:"&lrtri;"}, "&#8896;":{entityName:"&xwedge;"}, "&#8897;":{entityName:"&xvee;"}, "&#8898;":{entityName:"&xcap;"}, "&#8899;":{entityName:"&xcup;"}, "&#8900;":{entityName:"&diam;"}, "&#8901;":{entityName:"&sdot;"}, "&#8902;":{entityName:"&sstarf;"}, "&#8903;":{entityName:"&divonx;"}, "&#8904;":{entityName:"&bowtie;"}, "&#8905;":{entityName:"&ltimes;"}, "&#8906;":{entityName:"&rtimes;"}, "&#8907;":{entityName:"&lthree;"}, "&#8908;":{entityName:"&rthree;"}, "&#8909;":{entityName:"&bsime;"}, "&#8910;":{entityName:"&cuvee;"}, "&#8911;":{entityName:"&cuwed;"}, "&#8912;":{entityName:"&Sub;"}, "&#8913;":{entityName:"&Sup;"}, "&#8914;":{entityName:"&Cap;"}, "&#8915;":{entityName:"&Cup;"}, "&#8916;":{entityName:"&fork;"}, "&#8917;":{entityName:"&epar;"}, "&#8918;":{entityName:"&ltdot;"}, "&#8919;":{entityName:"&gtdot;"}, "&#8920;":{entityName:"&Ll;"}, "&#8921;":{entityName:"&Gg;"}, "&#8922;":{entityName:"&leg;"}, "&#8923;":{entityName:"&gel;"}, "&#8926;":{entityName:"&cuepr;"}, "&#8927;":{entityName:"&cuesc;"}, "&#8928;":{entityName:"&nprcue;"}, "&#8929;":{entityName:"&nsccue;"}, "&#8930;":{entityName:"&nsqsube;"}, "&#8931;":{entityName:"&nsqsupe;"}, "&#8934;":{entityName:"&lnsim;"}, "&#8935;":{entityName:"&gnsim;"}, "&#8936;":{entityName:"&prnsim;"}, "&#8937;":{entityName:"&scnsim;"}, "&#8938;":{entityName:"&nltri;"}, "&#8939;":{entityName:"&nrtri;"}, "&#8940;":{entityName:"&nltrie;"}, "&#8941;":{entityName:"&nrtrie;"}, "&#8942;":{entityName:"&vellip;"}, "&#8943;":{entityName:"&ctdot;"}, "&#8944;":{entityName:"&utdot;"}, "&#8945;":{entityName:"&dtdot;"}, "&#8946;":{entityName:"&disin;"}, "&#8947;":{entityName:"&isinsv;"}, "&#8948;":{entityName:"&isins;"}, "&#8949;":{entityName:"&isindot;"}, "&#8950;":{entityName:"&notinvc;"}, "&#8951;":{entityName:"&notinvb;"}, "&#8953;":{entityName:"&isinE;"}, "&#8954;":{entityName:"&nisd;"}, "&#8955;":{entityName:"&xnis;"}, "&#8956;":{entityName:"&nis;"}, "&#8957;":{entityName:"&notnivc;"}, "&#8958;":{entityName:"&notnivb;"}, "&#8965;":{entityName:"&barwed;"}, "&#8966;":{entityName:"&Barwed;"}, "&#8968;":{entityName:"&lceil;"}, "&#8969;":{entityName:"&rceil;"}, "&#8970;":{entityName:"&lfloor;"}, "&#8971;":{entityName:"&rfloor;"}, "&#8972;":{entityName:"&drcrop;"}, "&#8973;":{entityName:"&dlcrop;"}, "&#8974;":{entityName:"&urcrop;"}, "&#8975;":{entityName:"&ulcrop;"}, "&#8976;":{entityName:"&bnot;"}, "&#8978;":{entityName:"&profline;"}, "&#8979;":{entityName:"&profsurf;"}, "&#8981;":{entityName:"&telrec;"}, "&#8982;":{entityName:"&target;"}, "&#8988;":{entityName:"&ulcorn;"}, "&#8989;":{entityName:"&urcorn;"}, "&#8990;":{entityName:"&dlcorn;"}, "&#8991;":{entityName:"&drcorn;"}, "&#8994;":{entityName:"&frown;"}, "&#8995;":{entityName:"&smile;"}, "&#9005;":{entityName:"&cylcty;"}, "&#9006;":{entityName:"&profalar;"}, "&#9014;":{entityName:"&topbot;"}, "&#9021;":{entityName:"&ovbar;"}, "&#9023;":{entityName:"&solbar;"}, "&#9084;":{entityName:"&angzarr;"}, "&#9136;":{entityName:"&lmoust;"}, "&#9137;":{entityName:"&rmoust;"}, "&#9140;":{entityName:"&tbrk;"}, "&#9141;":{entityName:"&bbrk;"}, "&#9142;":{entityName:"&bbrktbrk;"}, "&#9180;":{entityName:"&OverParenthesis;"}, "&#9181;":{entityName:"&UnderParenthesis;"}, "&#9182;":{entityName:"&OverBrace;"}, "&#9183;":{entityName:"&UnderBrace;"}, "&#9186;":{entityName:"&trpezium;"}, "&#9191;":{entityName:"&elinters;"}, "&#9251;":{entityName:"&blank;"}, "&#9416;":{entityName:"&oS;"}, "&#9472;":{entityName:"&boxh;"}, "&#9474;":{entityName:"&boxv;"}, "&#9484;":{entityName:"&boxdr;"}, "&#9488;":{entityName:"&boxdl;"}, "&#9492;":{entityName:"&boxur;"}, "&#9496;":{entityName:"&boxul;"}, "&#9500;":{entityName:"&boxvr;"}, "&#9508;":{entityName:"&boxvl;"}, "&#9516;":{entityName:"&boxhd;"}, "&#9524;":{entityName:"&boxhu;"}, "&#9532;":{entityName:"&boxvh;"}, "&#9552;":{entityName:"&boxH;"}, "&#9553;":{entityName:"&boxV;"}, "&#9554;":{entityName:"&boxdR;"}, "&#9555;":{entityName:"&boxDr;"}, "&#9556;":{entityName:"&boxDR;"}, "&#9557;":{entityName:"&boxdL;"}, "&#9558;":{entityName:"&boxDl;"}, "&#9559;":{entityName:"&boxDL;"}, "&#9560;":{entityName:"&boxuR;"}, "&#9561;":{entityName:"&boxUr;"}, "&#9562;":{entityName:"&boxUR;"}, "&#9563;":{entityName:"&boxuL;"}, "&#9564;":{entityName:"&boxUl;"}, "&#9565;":{entityName:"&boxUL;"}, "&#9566;":{entityName:"&boxvR;"}, "&#9567;":{entityName:"&boxVr;"}, "&#9568;":{entityName:"&boxVR;"}, "&#9569;":{entityName:"&boxvL;"}, "&#9570;":{entityName:"&boxVl;"}, "&#9571;":{entityName:"&boxVL;"}, "&#9572;":{entityName:"&boxHd;"}, "&#9573;":{entityName:"&boxhD;"}, "&#9574;":{entityName:"&boxHD;"}, "&#9575;":{entityName:"&boxHu;"}, "&#9576;":{entityName:"&boxhU;"}, "&#9577;":{entityName:"&boxHU;"}, "&#9578;":{entityName:"&boxvH;"}, "&#9579;":{entityName:"&boxVh;"}, "&#9580;":{entityName:"&boxVH;"}, "&#9600;":{entityName:"&uhblk;"}, "&#9604;":{entityName:"&lhblk;"}, "&#9608;":{entityName:"&block;"}, "&#9617;":{entityName:"&blk14;"}, "&#9618;":{entityName:"&blk12;"}, "&#9619;":{entityName:"&blk34;"}, "&#9633;":{entityName:"&squ;"}, "&#9642;":{entityName:"&squf;"}, "&#9643;":{entityName:"&EmptyVerySmallSquare;"}, "&#9645;":{entityName:"&rect;"}, "&#9646;":{entityName:"&marker;"}, "&#9649;":{entityName:"&fltns;"}, "&#9651;":{entityName:"&xutri;"}, "&#9652;":{entityName:"&utrif;"}, "&#9653;":{entityName:"&utri;"}, "&#9656;":{entityName:"&rtrif;"}, "&#9657;":{entityName:"&rtri;"}, "&#9661;":{entityName:"&xdtri;"}, "&#9662;":{entityName:"&dtrif;"}, "&#9663;":{entityName:"&dtri;"}, "&#9666;":{entityName:"&ltrif;"}, "&#9667;":{entityName:"&ltri;"}, "&#9674;":{entityName:"&loz;"}, "&#9675;":{entityName:"&cir;"}, "&#9708;":{entityName:"&tridot;"}, "&#9711;":{entityName:"&xcirc;"}, "&#9720;":{entityName:"&ultri;"}, "&#9721;":{entityName:"&urtri;"}, "&#9722;":{entityName:"&lltri;"}, "&#9723;":{entityName:"&EmptySmallSquare;"}, "&#9724;":{entityName:"&FilledSmallSquare;"}, "&#9733;":{entityName:"&starf;"}, "&#9734;":{entityName:"&star;"}, "&#9742;":{entityName:"&phone;"}, "&#9792;":{entityName:"&female;"}, "&#9794;":{entityName:"&male;"}, "&#9824;":{entityName:"&spades;"}, "&#9827;":{entityName:"&clubs;"}, "&#9829;":{entityName:"&hearts;"}, "&#9830;":{entityName:"&diams;"}, "&#9834;":{entityName:"&sung;"}, "&#9837;":{entityName:"&flat;"}, "&#9838;":{entityName:"&natur;"}, "&#9839;":{entityName:"&sharp;"}, "&#10003;":{entityName:"&check;"}, "&#10007;":{entityName:"&cross;"}, "&#10016;":{entityName:"&malt;"}, "&#10038;":{entityName:"&sext;"}, "&#10072;":{entityName:"&VerticalSeparator;"}, "&#10098;":{entityName:"&lbbrk;"}, "&#10099;":{entityName:"&rbbrk;"}, "&#10214;":{entityName:"&lobrk;"}, "&#10215;":{entityName:"&robrk;"}, "&#10216;":{entityName:"&lang;"}, "&#10217;":{entityName:"&rang;"}, "&#10218;":{entityName:"&Lang;"}, "&#10219;":{entityName:"&Rang;"}, "&#10220;":{entityName:"&loang;"}, "&#10221;":{entityName:"&roang;"}, "&#10229;":{entityName:"&xlarr;"}, "&#10230;":{entityName:"&xrarr;"}, "&#10231;":{entityName:"&xharr;"}, "&#10232;":{entityName:"&xlArr;"}, "&#10233;":{entityName:"&xrArr;"}, "&#10234;":{entityName:"&xhArr;"}, "&#10236;":{entityName:"&xmap;"}, "&#10239;":{entityName:"&dzigrarr;"}, "&#10498;":{entityName:"&nvlArr;"}, "&#10499;":{entityName:"&nvrArr;"}, "&#10500;":{entityName:"&nvHarr;"}, "&#10501;":{entityName:"&Map;"}, "&#10508;":{entityName:"&lbarr;"}, "&#10509;":{entityName:"&rbarr;"}, "&#10510;":{entityName:"&lBarr;"}, "&#10511;":{entityName:"&rBarr;"}, "&#10512;":{entityName:"&RBarr;"}, "&#10513;":{entityName:"&DDotrahd;"}, "&#10514;":{entityName:"&UpArrowBar;"}, "&#10515;":{entityName:"&DownArrowBar;"}, "&#10518;":{entityName:"&Rarrtl;"}, "&#10521;":{entityName:"&latail;"}, "&#10522;":{entityName:"&ratail;"}, "&#10523;":{entityName:"&lAtail;"}, "&#10524;":{entityName:"&rAtail;"}, "&#10525;":{entityName:"&larrfs;"}, "&#10526;":{entityName:"&rarrfs;"}, "&#10527;":{entityName:"&larrbfs;"}, "&#10528;":{entityName:"&rarrbfs;"}, "&#10531;":{entityName:"&nwarhk;"}, "&#10532;":{entityName:"&nearhk;"}, "&#10533;":{entityName:"&searhk;"}, "&#10534;":{entityName:"&swarhk;"}, "&#10535;":{entityName:"&nwnear;"}, "&#10536;":{entityName:"&nesear;"}, "&#10537;":{entityName:"&seswar;"}, "&#10538;":{entityName:"&swnwar;"}, "&#10547;":{entityName:"&rarrc;"}, "&#10549;":{entityName:"&cudarrr;"}, "&#10550;":{entityName:"&ldca;"}, "&#10551;":{entityName:"&rdca;"}, "&#10552;":{entityName:"&cudarrl;"}, "&#10553;":{entityName:"&larrpl;"}, "&#10556;":{entityName:"&curarrm;"}, "&#10557;":{entityName:"&cularrp;"}, "&#10565;":{entityName:"&rarrpl;"}, "&#10568;":{entityName:"&harrcir;"}, "&#10569;":{entityName:"&Uarrocir;"}, "&#10570;":{entityName:"&lurdshar;"}, "&#10571;":{entityName:"&ldrushar;"}, "&#10574;":{entityName:"&LeftRightVector;"}, "&#10575;":{entityName:"&RightUpDownVector;"}, "&#10576;":{entityName:"&DownLeftRightVector;"}, "&#10577;":{entityName:"&LeftUpDownVector;"}, "&#10578;":{entityName:"&LeftVectorBar;"}, "&#10579;":{entityName:"&RightVectorBar;"}, "&#10580;":{entityName:"&RightUpVectorBar;"}, "&#10581;":{entityName:"&RightDownVectorBar;"}, "&#10582;":{entityName:"&DownLeftVectorBar;"}, "&#10583;":{entityName:"&DownRightVectorBar;"}, "&#10584;":{entityName:"&LeftUpVectorBar;"}, "&#10585;":{entityName:"&LeftDownVectorBar;"}, "&#10586;":{entityName:"&LeftTeeVector;"}, "&#10587;":{entityName:"&RightTeeVector;"}, "&#10588;":{entityName:"&RightUpTeeVector;"}, "&#10589;":{entityName:"&RightDownTeeVector;"}, "&#10590;":{entityName:"&DownLeftTeeVector;"}, "&#10591;":{entityName:"&DownRightTeeVector;"}, "&#10592;":{entityName:"&LeftUpTeeVector;"}, "&#10593;":{entityName:"&LeftDownTeeVector;"}, "&#10594;":{entityName:"&lHar;"}, "&#10595;":{entityName:"&uHar;"}, "&#10596;":{entityName:"&rHar;"}, "&#10597;":{entityName:"&dHar;"}, "&#10598;":{entityName:"&luruhar;"}, "&#10599;":{entityName:"&ldrdhar;"}, "&#10600;":{entityName:"&ruluhar;"}, "&#10601;":{entityName:"&rdldhar;"}, "&#10602;":{entityName:"&lharul;"}, "&#10603;":{entityName:"&llhard;"}, "&#10604;":{entityName:"&rharul;"}, "&#10605;":{entityName:"&lrhard;"}, "&#10606;":{entityName:"&udhar;"}, "&#10607;":{entityName:"&duhar;"}, "&#10608;":{entityName:"&RoundImplies;"}, "&#10609;":{entityName:"&erarr;"}, "&#10610;":{entityName:"&simrarr;"}, "&#10611;":{entityName:"&larrsim;"}, "&#10612;":{entityName:"&rarrsim;"}, "&#10613;":{entityName:"&rarrap;"}, "&#10614;":{entityName:"&ltlarr;"}, "&#10616;":{entityName:"&gtrarr;"}, "&#10617;":{entityName:"&subrarr;"}, "&#10619;":{entityName:"&suplarr;"}, "&#10620;":{entityName:"&lfisht;"}, "&#10621;":{entityName:"&rfisht;"}, "&#10622;":{entityName:"&ufisht;"}, "&#10623;":{entityName:"&dfisht;"}, "&#10629;":{entityName:"&lopar;"}, "&#10630;":{entityName:"&ropar;"}, "&#10635;":{entityName:"&lbrke;"}, "&#10636;":{entityName:"&rbrke;"}, "&#10637;":{entityName:"&lbrkslu;"}, "&#10638;":{entityName:"&rbrksld;"}, "&#10639;":{entityName:"&lbrksld;"}, "&#10640;":{entityName:"&rbrkslu;"}, "&#10641;":{entityName:"&langd;"}, "&#10642;":{entityName:"&rangd;"}, "&#10643;":{entityName:"&lparlt;"}, "&#10644;":{entityName:"&rpargt;"}, "&#10645;":{entityName:"&gtlPar;"}, "&#10646;":{entityName:"&ltrPar;"}, "&#10650;":{entityName:"&vzigzag;"}, "&#10652;":{entityName:"&vangrt;"}, "&#10653;":{entityName:"&angrtvbd;"}, "&#10660;":{entityName:"&ange;"}, "&#10661;":{entityName:"&range;"}, "&#10662;":{entityName:"&dwangle;"}, "&#10663;":{entityName:"&uwangle;"}, "&#10664;":{entityName:"&angmsdaa;"}, "&#10665;":{entityName:"&angmsdab;"}, "&#10666;":{entityName:"&angmsdac;"}, "&#10667;":{entityName:"&angmsdad;"}, "&#10668;":{entityName:"&angmsdae;"}, "&#10669;":{entityName:"&angmsdaf;"}, "&#10670;":{entityName:"&angmsdag;"}, "&#10671;":{entityName:"&angmsdah;"}, "&#10672;":{entityName:"&bemptyv;"}, "&#10673;":{entityName:"&demptyv;"}, "&#10674;":{entityName:"&cemptyv;"}, "&#10675;":{entityName:"&raemptyv;"}, "&#10676;":{entityName:"&laemptyv;"}, "&#10677;":{entityName:"&ohbar;"}, "&#10678;":{entityName:"&omid;"}, "&#10679;":{entityName:"&opar;"}, "&#10681;":{entityName:"&operp;"}, "&#10683;":{entityName:"&olcross;"}, "&#10684;":{entityName:"&odsold;"}, "&#10686;":{entityName:"&olcir;"}, "&#10687;":{entityName:"&ofcir;"}, "&#10688;":{entityName:"&olt;"}, "&#10689;":{entityName:"&ogt;"}, "&#10690;":{entityName:"&cirscir;"}, "&#10691;":{entityName:"&cirE;"}, "&#10692;":{entityName:"&solb;"}, "&#10693;":{entityName:"&bsolb;"}, "&#10697;":{entityName:"&boxbox;"}, "&#10701;":{entityName:"&trisb;"}, "&#10702;":{entityName:"&rtriltri;"}, "&#10703;":{entityName:"&LeftTriangleBar;"}, "&#10704;":{entityName:"&RightTriangleBar;"}, "&#10714;":{entityName:"&race;"}, "&#10716;":{entityName:"&iinfin;"}, "&#10717;":{entityName:"&infintie;"}, "&#10718;":{entityName:"&nvinfin;"}, "&#10723;":{entityName:"&eparsl;"}, "&#10724;":{entityName:"&smeparsl;"}, "&#10725;":{entityName:"&eqvparsl;"}, "&#10731;":{entityName:"&lozf;"}, "&#10740;":{entityName:"&RuleDelayed;"}, "&#10742;":{entityName:"&dsol;"}, "&#10752;":{entityName:"&xodot;"}, "&#10753;":{entityName:"&xoplus;"}, "&#10754;":{entityName:"&xotime;"}, "&#10756;":{entityName:"&xuplus;"}, "&#10758;":{entityName:"&xsqcup;"}, "&#10764;":{entityName:"&qint;"}, "&#10765;":{entityName:"&fpartint;"}, "&#10768;":{entityName:"&cirfnint;"}, "&#10769;":{entityName:"&awint;"}, "&#10770;":{entityName:"&rppolint;"}, "&#10771;":{entityName:"&scpolint;"}, "&#10772;":{entityName:"&npolint;"}, "&#10773;":{entityName:"&pointint;"}, "&#10774;":{entityName:"&quatint;"}, "&#10775;":{entityName:"&intlarhk;"}, "&#10786;":{entityName:"&pluscir;"}, "&#10787;":{entityName:"&plusacir;"}, "&#10788;":{entityName:"&simplus;"}, "&#10789;":{entityName:"&plusdu;"}, "&#10790;":{entityName:"&plussim;"}, "&#10791;":{entityName:"&plustwo;"}, "&#10793;":{entityName:"&mcomma;"}, "&#10794;":{entityName:"&minusdu;"}, "&#10797;":{entityName:"&loplus;"}, "&#10798;":{entityName:"&roplus;"}, "&#10799;":{entityName:"&Cross;"}, "&#10800;":{entityName:"&timesd;"}, "&#10801;":{entityName:"&timesbar;"}, "&#10803;":{entityName:"&smashp;"}, "&#10804;":{entityName:"&lotimes;"}, "&#10805;":{entityName:"&rotimes;"}, "&#10806;":{entityName:"&otimesas;"}, "&#10807;":{entityName:"&Otimes;"}, "&#10808;":{entityName:"&odiv;"}, "&#10809;":{entityName:"&triplus;"}, "&#10810;":{entityName:"&triminus;"}, "&#10811;":{entityName:"&tritime;"}, "&#10812;":{entityName:"&iprod;"}, "&#10815;":{entityName:"&amalg;"}, "&#10816;":{entityName:"&capdot;"}, "&#10818;":{entityName:"&ncup;"}, "&#10819;":{entityName:"&ncap;"}, "&#10820;":{entityName:"&capand;"}, "&#10821;":{entityName:"&cupor;"}, "&#10822;":{entityName:"&cupcap;"}, "&#10823;":{entityName:"&capcup;"}, "&#10824;":{entityName:"&cupbrcap;"}, "&#10825;":{entityName:"&capbrcup;"}, "&#10826;":{entityName:"&cupcup;"}, "&#10827;":{entityName:"&capcap;"}, "&#10828;":{entityName:"&ccups;"}, "&#10829;":{entityName:"&ccaps;"}, "&#10832;":{entityName:"&ccupssm;"}, "&#10835;":{entityName:"&And;"}, "&#10836;":{entityName:"&Or;"}, "&#10837;":{entityName:"&andand;"}, "&#10838;":{entityName:"&oror;"}, "&#10839;":{entityName:"&orslope;"}, "&#10840;":{entityName:"&andslope;"}, "&#10842;":{entityName:"&andv;"}, "&#10843;":{entityName:"&orv;"}, "&#10844;":{entityName:"&andd;"}, "&#10845;":{entityName:"&ord;"}, "&#10847;":{entityName:"&wedbar;"}, "&#10854;":{entityName:"&sdote;"}, "&#10858;":{entityName:"&simdot;"}, "&#10861;":{entityName:"&congdot;"}, "&#10862;":{entityName:"&easter;"}, "&#10863;":{entityName:"&apacir;"}, "&#10864;":{entityName:"&apE;"}, "&#10865;":{entityName:"&eplus;"}, "&#10866;":{entityName:"&pluse;"}, "&#10867;":{entityName:"&Esim;"}, "&#10868;":{entityName:"&Colone;"}, "&#10869;":{entityName:"&Equal;"}, "&#10871;":{entityName:"&eDDot;"}, "&#10872;":{entityName:"&equivDD;"}, "&#10873;":{entityName:"&ltcir;"}, "&#10874;":{entityName:"&gtcir;"}, "&#10875;":{entityName:"&ltquest;"}, "&#10876;":{entityName:"&gtquest;"}, "&#10877;":{entityName:"&les;"}, "&#10878;":{entityName:"&ges;"}, "&#10879;":{entityName:"&lesdot;"}, "&#10880;":{entityName:"&gesdot;"}, "&#10881;":{entityName:"&lesdoto;"}, "&#10882;":{entityName:"&gesdoto;"}, "&#10883;":{entityName:"&lesdotor;"}, "&#10884;":{entityName:"&gesdotol;"}, "&#10885;":{entityName:"&lap;"}, "&#10886;":{entityName:"&gap;"}, "&#10887;":{entityName:"&lne;"}, "&#10888;":{entityName:"&gne;"}, "&#10889;":{entityName:"&lnap;"}, "&#10890;":{entityName:"&gnap;"}, "&#10891;":{entityName:"&lEg;"}, "&#10892;":{entityName:"&gEl;"}, "&#10893;":{entityName:"&lsime;"}, "&#10894;":{entityName:"&gsime;"}, "&#10895;":{entityName:"&lsimg;"}, "&#10896;":{entityName:"&gsiml;"}, "&#10897;":{entityName:"&lgE;"}, "&#10898;":{entityName:"&glE;"}, "&#10899;":{entityName:"&lesges;"}, "&#10900;":{entityName:"&gesles;"}, "&#10901;":{entityName:"&els;"}, "&#10902;":{entityName:"&egs;"}, "&#10903;":{entityName:"&elsdot;"}, "&#10904;":{entityName:"&egsdot;"}, "&#10905;":{entityName:"&el;"}, "&#10906;":{entityName:"&eg;"}, "&#10909;":{entityName:"&siml;"}, "&#10910;":{entityName:"&simg;"}, "&#10911;":{entityName:"&simlE;"}, "&#10912;":{entityName:"&simgE;"}, "&#10913;":{entityName:"&LessLess;"}, "&#10914;":{entityName:"&GreaterGreater;"}, "&#10916;":{entityName:"&glj;"}, "&#10917;":{entityName:"&gla;"}, "&#10918;":{entityName:"&ltcc;"}, "&#10919;":{entityName:"&gtcc;"}, "&#10920;":{entityName:"&lescc;"}, "&#10921;":{entityName:"&gescc;"}, "&#10922;":{entityName:"&smt;"}, "&#10923;":{entityName:"&lat;"}, "&#10924;":{entityName:"&smte;"}, "&#10925;":{entityName:"&late;"}, "&#10926;":{entityName:"&bumpE;"}, "&#10927;":{entityName:"&pre;"}, "&#10928;":{entityName:"&sce;"}, "&#10931;":{entityName:"&prE;"}, "&#10932;":{entityName:"&scE;"}, "&#10933;":{entityName:"&prnE;"}, "&#10934;":{entityName:"&scnE;"}, "&#10935;":{entityName:"&prap;"}, "&#10936;":{entityName:"&scap;"}, "&#10937;":{entityName:"&prnap;"}, "&#10938;":{entityName:"&scnap;"}, "&#10939;":{entityName:"&Pr;"}, "&#10940;":{entityName:"&Sc;"}, "&#10941;":{entityName:"&subdot;"}, "&#10942;":{entityName:"&supdot;"}, "&#10943;":{entityName:"&subplus;"}, "&#10944;":{entityName:"&supplus;"}, "&#10945;":{entityName:"&submult;"}, "&#10946;":{entityName:"&supmult;"}, "&#10947;":{entityName:"&subedot;"}, "&#10948;":{entityName:"&supedot;"}, "&#10949;":{entityName:"&subE;"}, "&#10950;":{entityName:"&supE;"}, "&#10951;":{entityName:"&subsim;"}, "&#10952;":{entityName:"&supsim;"}, "&#10955;":{entityName:"&subnE;"}, "&#10956;":{entityName:"&supnE;"}, "&#10959;":{entityName:"&csub;"}, "&#10960;":{entityName:"&csup;"}, "&#10961;":{entityName:"&csube;"}, "&#10962;":{entityName:"&csupe;"}, "&#10963;":{entityName:"&subsup;"}, "&#10964;":{entityName:"&supsub;"}, "&#10965;":{entityName:"&subsub;"}, "&#10966;":{entityName:"&supsup;"}, "&#10967;":{entityName:"&suphsub;"}, "&#10968;":{entityName:"&supdsub;"}, "&#10969;":{entityName:"&forkv;"}, "&#10970;":{entityName:"&topfork;"}, "&#10971;":{entityName:"&mlcp;"}, "&#10980;":{entityName:"&Dashv;"}, "&#10982;":{entityName:"&Vdashl;"}, "&#10983;":{entityName:"&Barv;"}, "&#10984;":{entityName:"&vBar;"}, "&#10985;":{entityName:"&vBarv;"}, "&#10987;":{entityName:"&Vbar;"}, "&#10988;":{entityName:"&Not;"}, "&#10989;":{entityName:"&bNot;"}, "&#10990;":{entityName:"&rnmid;"}, "&#10991;":{entityName:"&cirmid;"}, "&#10992;":{entityName:"&midcir;"}, "&#10993;":{entityName:"&topcir;"}, "&#10994;":{entityName:"&nhpar;"}, "&#10995;":{entityName:"&parsim;"}, "&#11005;":{entityName:"&parsl;"}, "&#64256;":{entityName:"&fflig;"}, "&#64257;":{entityName:"&filig;"}, "&#64258;":{entityName:"&fllig;"}, "&#64259;":{entityName:"&ffilig;"}, "&#64260;":{entityName:"&ffllig;"}, "&#119964;":{entityName:"&Ascr;"}, "&#119966;":{entityName:"&Cscr;"}, "&#119967;":{entityName:"&Dscr;"}, "&#119970;":{entityName:"&Gscr;"}, "&#119973;":{entityName:"&Jscr;"}, "&#119974;":{entityName:"&Kscr;"}, "&#119977;":{entityName:"&Nscr;"}, "&#119978;":{entityName:"&Oscr;"}, "&#119979;":{entityName:"&Pscr;"}, "&#119980;":{entityName:"&Qscr;"}, "&#119982;":{entityName:"&Sscr;"}, "&#119983;":{entityName:"&Tscr;"}, "&#119984;":{entityName:"&Uscr;"}, "&#119985;":{entityName:"&Vscr;"}, "&#119986;":{entityName:"&Wscr;"}, "&#119987;":{entityName:"&Xscr;"}, "&#119988;":{entityName:"&Yscr;"}, "&#119989;":{entityName:"&Zscr;"}, "&#119990;":{entityName:"&ascr;"}, "&#119991;":{entityName:"&bscr;"}, "&#119992;":{entityName:"&cscr;"}, "&#119993;":{entityName:"&dscr;"}, "&#119995;":{entityName:"&fscr;"}, "&#119997;":{entityName:"&hscr;"}, "&#119998;":{entityName:"&iscr;"}, "&#119999;":{entityName:"&jscr;"}, "&#120000;":{entityName:"&kscr;"}, "&#120001;":{entityName:"&lscr;"}, "&#120002;":{entityName:"&mscr;"}, "&#120003;":{entityName:"&nscr;"}, "&#120005;":{entityName:"&pscr;"}, "&#120006;":{entityName:"&qscr;"}, "&#120007;":{entityName:"&rscr;"}, "&#120008;":{entityName:"&sscr;"}, "&#120009;":{entityName:"&tscr;"}, "&#120010;":{entityName:"&uscr;"}, "&#120011;":{entityName:"&vscr;"}, "&#120012;":{entityName:"&wscr;"}, "&#120013;":{entityName:"&xscr;"}, "&#120014;":{entityName:"&yscr;"}, "&#120015;":{entityName:"&zscr;"}, "&#120068;":{entityName:"&Afr;"}, "&#120069;":{entityName:"&Bfr;"}, "&#120071;":{entityName:"&Dfr;"}, "&#120072;":{entityName:"&Efr;"}, "&#120073;":{entityName:"&Ffr;"}, "&#120074;":{entityName:"&Gfr;"}, "&#120077;":{entityName:"&Jfr;"}, "&#120078;":{entityName:"&Kfr;"}, "&#120079;":{entityName:"&Lfr;"}, "&#120080;":{entityName:"&Mfr;"}, "&#120081;":{entityName:"&Nfr;"}, "&#120082;":{entityName:"&Ofr;"}, "&#120083;":{entityName:"&Pfr;"}, "&#120084;":{entityName:"&Qfr;"}, "&#120086;":{entityName:"&Sfr;"}, "&#120087;":{entityName:"&Tfr;"}, "&#120088;":{entityName:"&Ufr;"}, "&#120089;":{entityName:"&Vfr;"}, "&#120090;":{entityName:"&Wfr;"}, "&#120091;":{entityName:"&Xfr;"}, "&#120092;":{entityName:"&Yfr;"}, "&#120094;":{entityName:"&afr;"}, "&#120095;":{entityName:"&bfr;"}, "&#120096;":{entityName:"&cfr;"}, "&#120097;":{entityName:"&dfr;"}, "&#120098;":{entityName:"&efr;"}, "&#120099;":{entityName:"&ffr;"}, "&#120100;":{entityName:"&gfr;"}, "&#120101;":{entityName:"&hfr;"}, "&#120102;":{entityName:"&ifr;"}, "&#120103;":{entityName:"&jfr;"}, "&#120104;":{entityName:"&kfr;"}, "&#120105;":{entityName:"&lfr;"}, "&#120106;":{entityName:"&mfr;"}, "&#120107;":{entityName:"&nfr;"}, "&#120108;":{entityName:"&ofr;"}, "&#120109;":{entityName:"&pfr;"}, "&#120110;":{entityName:"&qfr;"}, "&#120111;":{entityName:"&rfr;"}, "&#120112;":{entityName:"&sfr;"}, "&#120113;":{entityName:"&tfr;"}, "&#120114;":{entityName:"&ufr;"}, "&#120115;":{entityName:"&vfr;"}, "&#120116;":{entityName:"&wfr;"}, "&#120117;":{entityName:"&xfr;"}, "&#120118;":{entityName:"&yfr;"}, "&#120119;":{entityName:"&zfr;"}, "&#120120;":{entityName:"&Aopf;"}, "&#120121;":{entityName:"&Bopf;"}, "&#120123;":{entityName:"&Dopf;"}, "&#120124;":{entityName:"&Eopf;"}, "&#120125;":{entityName:"&Fopf;"}, "&#120126;":{entityName:"&Gopf;"}, "&#120128;":{entityName:"&Iopf;"}, "&#120129;":{entityName:"&Jopf;"}, "&#120130;":{entityName:"&Kopf;"}, "&#120131;":{entityName:"&Lopf;"}, "&#120132;":{entityName:"&Mopf;"}, "&#120134;":{entityName:"&Oopf;"}, "&#120138;":{entityName:"&Sopf;"}, "&#120139;":{entityName:"&Topf;"}, "&#120140;":{entityName:"&Uopf;"}, "&#120141;":{entityName:"&Vopf;"}, "&#120142;":{entityName:"&Wopf;"}, "&#120143;":{entityName:"&Xopf;"}, "&#120144;":{entityName:"&Yopf;"}, "&#120146;":{entityName:"&aopf;"}, "&#120147;":{entityName:"&bopf;"}, "&#120148;":{entityName:"&copf;"}, "&#120149;":{entityName:"&dopf;"}, "&#120150;":{entityName:"&eopf;"}, "&#120151;":{entityName:"&fopf;"}, "&#120152;":{entityName:"&gopf;"}, "&#120153;":{entityName:"&hopf;"}, "&#120154;":{entityName:"&iopf;"}, "&#120155;":{entityName:"&jopf;"}, "&#120156;":{entityName:"&kopf;"}, "&#120157;":{entityName:"&lopf;"}, "&#120158;":{entityName:"&mopf;"}, "&#120159;":{entityName:"&nopf;"}, "&#120160;":{entityName:"&oopf;"}, "&#120161;":{entityName:"&popf;"}, "&#120162;":{entityName:"&qopf;"}, "&#120163;":{entityName:"&ropf;"}, "&#120164;":{entityName:"&sopf;"}, "&#120165;":{entityName:"&topf;"}, "&#120166;":{entityName:"&uopf;"}, "&#120167;":{entityName:"&vopf;"}, "&#120168;":{entityName:"&wopf;"}, "&#120169;":{entityName:"&xopf;"}, "&#120170;":{entityName:"&yopf;"}, "&#120171;":{entityName:"&zopf;"}, "&#x00009;":{entityName:"&Tab;"}, "&#x0000A;":{entityName:"&NewLine;"}, "&#x00021;":{entityName:"&excl;"}, "&#x00022;":{entityName:"&quot;"}, "&#x00023;":{entityName:"&num;"}, "&#x00024;":{entityName:"&dollar;"}, "&#x00025;":{entityName:"&percnt;"}, "&#x00026;":{entityName:"&amp;"}, "&#x00027;":{entityName:"&apos;"}, "&#x00028;":{entityName:"&lpar;"}, "&#x00029;":{entityName:"&rpar;"}, "&#x0002A;":{entityName:"&ast;"}, "&#x0002B;":{entityName:"&plus;"}, "&#x0002C;":{entityName:"&comma;"}, "&#x0002E;":{entityName:"&period;"}, "&#x0002F;":{entityName:"&sol;"}, "&#x0003A;":{entityName:"&colon;"}, "&#x0003B;":{entityName:"&semi;"}, "&#x0003C;":{entityName:"&lt;"}, "&#x0003D;":{entityName:"&equals;"}, "&#x0003E;":{entityName:"&gt;"}, "&#x0003F;":{entityName:"&quest;"}, "&#x00040;":{entityName:"&commat;"}, "&#x0005B;":{entityName:"&lsqb;"}, "&#x0005C;":{entityName:"&bsol;"}, "&#x0005D;":{entityName:"&rsqb;"}, "&#x0005E;":{entityName:"&Hat;"}, "&#x0005F;":{entityName:"&lowbar;"}, "&#x00060;":{entityName:"&grave;"}, "&#x0007B;":{entityName:"&lcub;"}, "&#x0007C;":{entityName:"&verbar;"}, "&#x0007D;":{entityName:"&rcub;"}, "&#x000A0;":{entityName:"&nbsp;"}, "&#x000A1;":{entityName:"&iexcl;"}, "&#x000A2;":{entityName:"&cent;"}, "&#x000A3;":{entityName:"&pound;"}, "&#x000A4;":{entityName:"&curren;"}, "&#x000A5;":{entityName:"&yen;"}, "&#x000A6;":{entityName:"&brvbar;"}, "&#x000A7;":{entityName:"&sect;"}, "&#x000A8;":{entityName:"&Dot;"}, "&#x000A9;":{entityName:"&copy;"}, "&#x000AA;":{entityName:"&ordf;"}, "&#x000AB;":{entityName:"&laquo;"}, "&#x000AC;":{entityName:"&not;"}, "&#x000AD;":{entityName:"&shy;"}, "&#x000AE;":{entityName:"&reg;"}, "&#x000AF;":{entityName:"&macr;"}, "&#x000B0;":{entityName:"&deg;"}, "&#x000B1;":{entityName:"&plusmn;"}, "&#x000B2;":{entityName:"&sup2;"}, "&#x000B3;":{entityName:"&sup3;"}, "&#x000B4;":{entityName:"&acute;"}, "&#x000B5;":{entityName:"&micro;"}, "&#x000B6;":{entityName:"&para;"}, "&#x000B7;":{entityName:"&middot;"}, "&#x000B8;":{entityName:"&cedil;"}, "&#x000B9;":{entityName:"&sup1;"}, "&#x000BA;":{entityName:"&ordm;"}, "&#x000BB;":{entityName:"&raquo;"}, "&#x000BC;":{entityName:"&frac14;"}, "&#x000BD;":{entityName:"&frac12;"}, "&#x000BE;":{entityName:"&frac34;"}, "&#x000BF;":{entityName:"&iquest;"}, "&#x000C0;":{entityName:"&Agrave;"}, "&#x000C1;":{entityName:"&Aacute;"}, "&#x000C2;":{entityName:"&Acirc;"}, "&#x000C3;":{entityName:"&Atilde;"}, "&#x000C4;":{entityName:"&Auml;"}, "&#x000C5;":{entityName:"&Aring;"}, "&#x000C6;":{entityName:"&AElig;"}, "&#x000C7;":{entityName:"&Ccedil;"}, "&#x000C8;":{entityName:"&Egrave;"}, "&#x000C9;":{entityName:"&Eacute;"}, "&#x000CA;":{entityName:"&Ecirc;"}, "&#x000CB;":{entityName:"&Euml;"}, "&#x000CC;":{entityName:"&Igrave;"}, "&#x000CD;":{entityName:"&Iacute;"}, "&#x000CE;":{entityName:"&Icirc;"}, "&#x000CF;":{entityName:"&Iuml;"}, "&#x000D0;":{entityName:"&ETH;"}, "&#x000D1;":{entityName:"&Ntilde;"}, "&#x000D2;":{entityName:"&Ograve;"}, "&#x000D3;":{entityName:"&Oacute;"}, "&#x000D4;":{entityName:"&Ocirc;"}, "&#x000D5;":{entityName:"&Otilde;"}, "&#x000D6;":{entityName:"&Ouml;"}, "&#x000D7;":{entityName:"&times;"}, "&#x000D8;":{entityName:"&Oslash;"}, "&#x000D9;":{entityName:"&Ugrave;"}, "&#x000DA;":{entityName:"&Uacute;"}, "&#x000DB;":{entityName:"&Ucirc;"}, "&#x000DC;":{entityName:"&Uuml;"}, "&#x000DD;":{entityName:"&Yacute;"}, "&#x000DE;":{entityName:"&THORN;"}, "&#x000DF;":{entityName:"&szlig;"}, "&#x000E0;":{entityName:"&agrave;"}, "&#x000E1;":{entityName:"&aacute;"}, "&#x000E2;":{entityName:"&acirc;"}, "&#x000E3;":{entityName:"&atilde;"}, "&#x000E4;":{entityName:"&auml;"}, "&#x000E5;":{entityName:"&aring;"}, "&#x000E6;":{entityName:"&aelig;"}, "&#x000E7;":{entityName:"&ccedil;"}, "&#x000E8;":{entityName:"&egrave;"}, "&#x000E9;":{entityName:"&eacute;"}, "&#x000EA;":{entityName:"&ecirc;"}, "&#x000EB;":{entityName:"&euml;"}, "&#x000EC;":{entityName:"&igrave;"}, "&#x000ED;":{entityName:"&iacute;"}, "&#x000EE;":{entityName:"&icirc;"}, "&#x000EF;":{entityName:"&iuml;"}, "&#x000F0;":{entityName:"&eth;"}, "&#x000F1;":{entityName:"&ntilde;"}, "&#x000F2;":{entityName:"&ograve;"}, "&#x000F3;":{entityName:"&oacute;"}, "&#x000F4;":{entityName:"&ocirc;"}, "&#x000F5;":{entityName:"&otilde;"}, "&#x000F6;":{entityName:"&ouml;"}, "&#x000F7;":{entityName:"&divide;"}, "&#x000F8;":{entityName:"&oslash;"}, "&#x000F9;":{entityName:"&ugrave;"}, "&#x000FA;":{entityName:"&uacute;"}, "&#x000FB;":{entityName:"&ucirc;"}, "&#x000FC;":{entityName:"&uuml;"}, "&#x000FD;":{entityName:"&yacute;"}, "&#x000FE;":{entityName:"&thorn;"}, "&#x000FF;":{entityName:"&yuml;"}, "&#x00100;":{entityName:"&Amacr;"}, "&#x00101;":{entityName:"&amacr;"}, "&#x00102;":{entityName:"&Abreve;"}, "&#x00103;":{entityName:"&abreve;"}, "&#x00104;":{entityName:"&Aogon;"}, "&#x00105;":{entityName:"&aogon;"}, "&#x00106;":{entityName:"&Cacute;"}, "&#x00107;":{entityName:"&cacute;"}, "&#x00108;":{entityName:"&Ccirc;"}, "&#x00109;":{entityName:"&ccirc;"}, "&#x0010A;":{entityName:"&Cdot;"}, "&#x0010B;":{entityName:"&cdot;"}, "&#x0010C;":{entityName:"&Ccaron;"}, "&#x0010D;":{entityName:"&ccaron;"}, "&#x0010E;":{entityName:"&Dcaron;"}, "&#x0010F;":{entityName:"&dcaron;"}, "&#x00110;":{entityName:"&Dstrok;"}, "&#x00111;":{entityName:"&dstrok;"}, "&#x00112;":{entityName:"&Emacr;"}, "&#x00113;":{entityName:"&emacr;"}, "&#x00116;":{entityName:"&Edot;"}, "&#x00117;":{entityName:"&edot;"}, "&#x00118;":{entityName:"&Eogon;"}, "&#x00119;":{entityName:"&eogon;"}, "&#x0011A;":{entityName:"&Ecaron;"}, "&#x0011B;":{entityName:"&ecaron;"}, "&#x0011C;":{entityName:"&Gcirc;"}, "&#x0011D;":{entityName:"&gcirc;"}, "&#x0011E;":{entityName:"&Gbreve;"}, "&#x0011F;":{entityName:"&gbreve;"}, "&#x00120;":{entityName:"&Gdot;"}, "&#x00121;":{entityName:"&gdot;"}, "&#x00122;":{entityName:"&Gcedil;"}, "&#x00124;":{entityName:"&Hcirc;"}, "&#x00125;":{entityName:"&hcirc;"}, "&#x00126;":{entityName:"&Hstrok;"}, "&#x00127;":{entityName:"&hstrok;"}, "&#x00128;":{entityName:"&Itilde;"}, "&#x00129;":{entityName:"&itilde;"}, "&#x0012A;":{entityName:"&Imacr;"}, "&#x0012B;":{entityName:"&imacr;"}, "&#x0012E;":{entityName:"&Iogon;"}, "&#x0012F;":{entityName:"&iogon;"}, "&#x00130;":{entityName:"&Idot;"}, "&#x00131;":{entityName:"&imath;"}, "&#x00132;":{entityName:"&IJlig;"}, "&#x00133;":{entityName:"&ijlig;"}, "&#x00134;":{entityName:"&Jcirc;"}, "&#x00135;":{entityName:"&jcirc;"}, "&#x00136;":{entityName:"&Kcedil;"}, "&#x00137;":{entityName:"&kcedil;"}, "&#x00138;":{entityName:"&kgreen;"}, "&#x00139;":{entityName:"&Lacute;"}, "&#x0013A;":{entityName:"&lacute;"}, "&#x0013B;":{entityName:"&Lcedil;"}, "&#x0013C;":{entityName:"&lcedil;"}, "&#x0013D;":{entityName:"&Lcaron;"}, "&#x0013E;":{entityName:"&lcaron;"}, "&#x0013F;":{entityName:"&Lmidot;"}, "&#x00140;":{entityName:"&lmidot;"}, "&#x00141;":{entityName:"&Lstrok;"}, "&#x00142;":{entityName:"&lstrok;"}, "&#x00143;":{entityName:"&Nacute;"}, "&#x00144;":{entityName:"&nacute;"}, "&#x00145;":{entityName:"&Ncedil;"}, "&#x00146;":{entityName:"&ncedil;"}, "&#x00147;":{entityName:"&Ncaron;"}, "&#x00148;":{entityName:"&ncaron;"}, "&#x00149;":{entityName:"&napos;"}, "&#x0014A;":{entityName:"&ENG;"}, "&#x0014B;":{entityName:"&eng;"}, "&#x0014C;":{entityName:"&Omacr;"}, "&#x0014D;":{entityName:"&omacr;"}, "&#x00150;":{entityName:"&Odblac;"}, "&#x00151;":{entityName:"&odblac;"}, "&#x00152;":{entityName:"&OElig;"}, "&#x00153;":{entityName:"&oelig;"}, "&#x00154;":{entityName:"&Racute;"}, "&#x00155;":{entityName:"&racute;"}, "&#x00156;":{entityName:"&Rcedil;"}, "&#x00157;":{entityName:"&rcedil;"}, "&#x00158;":{entityName:"&Rcaron;"}, "&#x00159;":{entityName:"&rcaron;"}, "&#x0015A;":{entityName:"&Sacute;"}, "&#x0015B;":{entityName:"&sacute;"}, "&#x0015C;":{entityName:"&Scirc;"}, "&#x0015D;":{entityName:"&scirc;"}, "&#x0015E;":{entityName:"&Scedil;"}, "&#x0015F;":{entityName:"&scedil;"}, "&#x00160;":{entityName:"&Scaron;"}, "&#x00161;":{entityName:"&scaron;"}, "&#x00162;":{entityName:"&Tcedil;"}, "&#x00163;":{entityName:"&tcedil;"}, "&#x00164;":{entityName:"&Tcaron;"}, "&#x00165;":{entityName:"&tcaron;"}, "&#x00166;":{entityName:"&Tstrok;"}, "&#x00167;":{entityName:"&tstrok;"}, "&#x00168;":{entityName:"&Utilde;"}, "&#x00169;":{entityName:"&utilde;"}, "&#x0016A;":{entityName:"&Umacr;"}, "&#x0016B;":{entityName:"&umacr;"}, "&#x0016C;":{entityName:"&Ubreve;"}, "&#x0016D;":{entityName:"&ubreve;"}, "&#x0016E;":{entityName:"&Uring;"}, "&#x0016F;":{entityName:"&uring;"}, "&#x00170;":{entityName:"&Udblac;"}, "&#x00171;":{entityName:"&udblac;"}, "&#x00172;":{entityName:"&Uogon;"}, "&#x00173;":{entityName:"&uogon;"}, "&#x00174;":{entityName:"&Wcirc;"}, "&#x00175;":{entityName:"&wcirc;"}, "&#x00176;":{entityName:"&Ycirc;"}, "&#x00177;":{entityName:"&ycirc;"}, "&#x00178;":{entityName:"&Yuml;"}, "&#x00179;":{entityName:"&Zacute;"}, "&#x0017A;":{entityName:"&zacute;"}, "&#x0017B;":{entityName:"&Zdot;"}, "&#x0017C;":{entityName:"&zdot;"}, "&#x0017D;":{entityName:"&Zcaron;"}, "&#x0017E;":{entityName:"&zcaron;"}, "&#x00192;":{entityName:"&fnof;"}, "&#x001B5;":{entityName:"&imped;"}, "&#x001F5;":{entityName:"&gacute;"}, "&#x00237;":{entityName:"&jmath;"}, "&#x002C6;":{entityName:"&circ;"}, "&#x002C7;":{entityName:"&caron;"}, "&#x002D8;":{entityName:"&breve;"}, "&#x002D9;":{entityName:"&dot;"}, "&#x002DA;":{entityName:"&ring;"}, "&#x002DB;":{entityName:"&ogon;"}, "&#x002DC;":{entityName:"&tilde;"}, "&#x002DD;":{entityName:"&dblac;"}, "&#x00311;":{entityName:"&DownBreve;"}, "&#x00332;":{entityName:"&UnderBar;"}, "&#x00391;":{entityName:"&Alpha;"}, "&#x00392;":{entityName:"&Beta;"}, "&#x00393;":{entityName:"&Gamma;"}, "&#x00394;":{entityName:"&Delta;"}, "&#x00395;":{entityName:"&Epsilon;"}, "&#x00396;":{entityName:"&Zeta;"}, "&#x00397;":{entityName:"&Eta;"}, "&#x00398;":{entityName:"&Theta;"}, "&#x00399;":{entityName:"&Iota;"}, "&#x0039A;":{entityName:"&Kappa;"}, "&#x0039B;":{entityName:"&Lambda;"}, "&#x0039C;":{entityName:"&Mu;"}, "&#x0039D;":{entityName:"&Nu;"}, "&#x0039E;":{entityName:"&Xi;"}, "&#x0039F;":{entityName:"&Omicron;"}, "&#x003A0;":{entityName:"&Pi;"}, "&#x003A1;":{entityName:"&Rho;"}, "&#x003A3;":{entityName:"&Sigma;"}, "&#x003A4;":{entityName:"&Tau;"}, "&#x003A5;":{entityName:"&Upsilon;"}, "&#x003A6;":{entityName:"&Phi;"}, "&#x003A7;":{entityName:"&Chi;"}, "&#x003A8;":{entityName:"&Psi;"}, "&#x003A9;":{entityName:"&Omega;"}, "&#x003B1;":{entityName:"&alpha;"}, "&#x003B2;":{entityName:"&beta;"}, "&#x003B3;":{entityName:"&gamma;"}, "&#x003B4;":{entityName:"&delta;"}, "&#x003B5;":{entityName:"&epsiv;"}, "&#x003B6;":{entityName:"&zeta;"}, "&#x003B7;":{entityName:"&eta;"}, "&#x003B8;":{entityName:"&theta;"}, "&#x003B9;":{entityName:"&iota;"}, "&#x003BA;":{entityName:"&kappa;"}, "&#x003BB;":{entityName:"&lambda;"}, "&#x003BC;":{entityName:"&mu;"}, "&#x003BD;":{entityName:"&nu;"}, "&#x003BE;":{entityName:"&xi;"}, "&#x003BF;":{entityName:"&omicron;"}, "&#x003C0;":{entityName:"&pi;"}, "&#x003C1;":{entityName:"&rho;"}, "&#x003C2;":{entityName:"&sigmav;"}, "&#x003C3;":{entityName:"&sigma;"}, "&#x003C4;":{entityName:"&tau;"}, "&#x003C5;":{entityName:"&upsi;"}, "&#x003C6;":{entityName:"&phi;"}, "&#x003C7;":{entityName:"&chi;"}, "&#x003C8;":{entityName:"&psi;"}, "&#x003C9;":{entityName:"&omega;"}, "&#x003D1;":{entityName:"&thetav;"}, "&#x003D2;":{entityName:"&Upsi;"}, "&#x003D5;":{entityName:"&straightphi;"}, "&#x003D6;":{entityName:"&piv;"}, "&#x003DC;":{entityName:"&Gammad;"}, "&#x003DD;":{entityName:"&gammad;"}, "&#x003F0;":{entityName:"&kappav;"}, "&#x003F1;":{entityName:"&rhov;"}, "&#x003F5;":{entityName:"&epsi;"}, "&#x003F6;":{entityName:"&bepsi;"}, "&#x00401;":{entityName:"&IOcy;"}, "&#x00402;":{entityName:"&DJcy;"}, "&#x00403;":{entityName:"&GJcy;"}, "&#x00404;":{entityName:"&Jukcy;"}, "&#x00405;":{entityName:"&DScy;"}, "&#x00406;":{entityName:"&Iukcy;"}, "&#x00407;":{entityName:"&YIcy;"}, "&#x00408;":{entityName:"&Jsercy;"}, "&#x00409;":{entityName:"&LJcy;"}, "&#x0040A;":{entityName:"&NJcy;"}, "&#x0040B;":{entityName:"&TSHcy;"}, "&#x0040C;":{entityName:"&KJcy;"}, "&#x0040E;":{entityName:"&Ubrcy;"}, "&#x0040F;":{entityName:"&DZcy;"}, "&#x00410;":{entityName:"&Acy;"}, "&#x00411;":{entityName:"&Bcy;"}, "&#x00412;":{entityName:"&Vcy;"}, "&#x00413;":{entityName:"&Gcy;"}, "&#x00414;":{entityName:"&Dcy;"}, "&#x00415;":{entityName:"&IEcy;"}, "&#x00416;":{entityName:"&ZHcy;"}, "&#x00417;":{entityName:"&Zcy;"}, "&#x00418;":{entityName:"&Icy;"}, "&#x00419;":{entityName:"&Jcy;"}, "&#x0041A;":{entityName:"&Kcy;"}, "&#x0041B;":{entityName:"&Lcy;"}, "&#x0041C;":{entityName:"&Mcy;"}, "&#x0041D;":{entityName:"&Ncy;"}, "&#x0041E;":{entityName:"&Ocy;"}, "&#x0041F;":{entityName:"&Pcy;"}, "&#x00420;":{entityName:"&Rcy;"}, "&#x00421;":{entityName:"&Scy;"}, "&#x00422;":{entityName:"&Tcy;"}, "&#x00423;":{entityName:"&Ucy;"}, "&#x00424;":{entityName:"&Fcy;"}, "&#x00425;":{entityName:"&KHcy;"}, "&#x00426;":{entityName:"&TScy;"}, "&#x00427;":{entityName:"&CHcy;"}, "&#x00428;":{entityName:"&SHcy;"}, "&#x00429;":{entityName:"&SHCHcy;"}, "&#x0042A;":{entityName:"&HARDcy;"}, "&#x0042B;":{entityName:"&Ycy;"}, "&#x0042C;":{entityName:"&SOFTcy;"}, "&#x0042D;":{entityName:"&Ecy;"}, "&#x0042E;":{entityName:"&YUcy;"}, "&#x0042F;":{entityName:"&YAcy;"}, "&#x00430;":{entityName:"&acy;"}, "&#x00431;":{entityName:"&bcy;"}, "&#x00432;":{entityName:"&vcy;"}, "&#x00433;":{entityName:"&gcy;"}, "&#x00434;":{entityName:"&dcy;"}, "&#x00435;":{entityName:"&iecy;"}, "&#x00436;":{entityName:"&zhcy;"}, "&#x00437;":{entityName:"&zcy;"}, "&#x00438;":{entityName:"&icy;"}, "&#x00439;":{entityName:"&jcy;"}, "&#x0043A;":{entityName:"&kcy;"}, "&#x0043B;":{entityName:"&lcy;"}, "&#x0043C;":{entityName:"&mcy;"}, "&#x0043D;":{entityName:"&ncy;"}, "&#x0043E;":{entityName:"&ocy;"}, "&#x0043F;":{entityName:"&pcy;"}, "&#x00440;":{entityName:"&rcy;"}, "&#x00441;":{entityName:"&scy;"}, "&#x00442;":{entityName:"&tcy;"}, "&#x00443;":{entityName:"&ucy;"}, "&#x00444;":{entityName:"&fcy;"}, "&#x00445;":{entityName:"&khcy;"}, "&#x00446;":{entityName:"&tscy;"}, "&#x00447;":{entityName:"&chcy;"}, "&#x00448;":{entityName:"&shcy;"}, "&#x00449;":{entityName:"&shchcy;"}, "&#x0044A;":{entityName:"&hardcy;"}, "&#x0044B;":{entityName:"&ycy;"}, "&#x0044C;":{entityName:"&softcy;"}, "&#x0044D;":{entityName:"&ecy;"}, "&#x0044E;":{entityName:"&yucy;"}, "&#x0044F;":{entityName:"&yacy;"}, "&#x00451;":{entityName:"&iocy;"}, "&#x00452;":{entityName:"&djcy;"}, "&#x00453;":{entityName:"&gjcy;"}, "&#x00454;":{entityName:"&jukcy;"}, "&#x00455;":{entityName:"&dscy;"}, "&#x00456;":{entityName:"&iukcy;"}, "&#x00457;":{entityName:"&yicy;"}, "&#x00458;":{entityName:"&jsercy;"}, "&#x00459;":{entityName:"&ljcy;"}, "&#x0045A;":{entityName:"&njcy;"}, "&#x0045B;":{entityName:"&tshcy;"}, "&#x0045C;":{entityName:"&kjcy;"}, "&#x0045E;":{entityName:"&ubrcy;"}, "&#x0045F;":{entityName:"&dzcy;"}, "&#x02002;":{entityName:"&ensp;"}, "&#x02003;":{entityName:"&emsp;"}, "&#x02004;":{entityName:"&emsp13;"}, "&#x02005;":{entityName:"&emsp14;"}, "&#x02007;":{entityName:"&numsp;"}, "&#x02008;":{entityName:"&puncsp;"}, "&#x02009;":{entityName:"&thinsp;"}, "&#x0200A;":{entityName:"&hairsp;"}, "&#x0200B;":{entityName:"&ZeroWidthSpace;"}, "&#x0200C;":{entityName:"&zwnj;"}, "&#x0200D;":{entityName:"&zwj;"}, "&#x0200E;":{entityName:"&lrm;"}, "&#x0200F;":{entityName:"&rlm;"}, "&#x02010;":{entityName:"&hyphen;"}, "&#x02013;":{entityName:"&ndash;"}, "&#x02014;":{entityName:"&mdash;"}, "&#x02015;":{entityName:"&horbar;"}, "&#x02016;":{entityName:"&Verbar;"}, "&#x02018;":{entityName:"&lsquo;"}, "&#x02019;":{entityName:"&rsquo;"}, "&#x0201A;":{entityName:"&lsquor;"}, "&#x0201C;":{entityName:"&ldquo;"}, "&#x0201D;":{entityName:"&rdquo;"}, "&#x0201E;":{entityName:"&ldquor;"}, "&#x02020;":{entityName:"&dagger;"}, "&#x02021;":{entityName:"&Dagger;"}, "&#x02022;":{entityName:"&bull;"}, "&#x02025;":{entityName:"&nldr;"}, "&#x02026;":{entityName:"&hellip;"}, "&#x02030;":{entityName:"&permil;"}, "&#x02031;":{entityName:"&pertenk;"}, "&#x02032;":{entityName:"&prime;"}, "&#x02033;":{entityName:"&Prime;"}, "&#x02034;":{entityName:"&tprime;"}, "&#x02035;":{entityName:"&bprime;"}, "&#x02039;":{entityName:"&lsaquo;"}, "&#x0203A;":{entityName:"&rsaquo;"}, "&#x0203E;":{entityName:"&oline;"}, "&#x02041;":{entityName:"&caret;"}, "&#x02043;":{entityName:"&hybull;"}, "&#x02044;":{entityName:"&frasl;"}, "&#x0204F;":{entityName:"&bsemi;"}, "&#x02057;":{entityName:"&qprime;"}, "&#x0205F;":{entityName:"&MediumSpace;"}, "&#x02060;":{entityName:"&NoBreak;"}, "&#x02061;":{entityName:"&ApplyFunction;"}, "&#x02062;":{entityName:"&InvisibleTimes;"}, "&#x02063;":{entityName:"&InvisibleComma;"}, "&#x020AC;":{entityName:"&euro;"}, "&#x020DB;":{entityName:"&tdot;"}, "&#x020DC;":{entityName:"&DotDot;"}, "&#x02102;":{entityName:"&Copf;"}, "&#x02105;":{entityName:"&incare;"}, "&#x0210A;":{entityName:"&gscr;"}, "&#x0210B;":{entityName:"&hamilt;"}, "&#x0210C;":{entityName:"&Hfr;"}, "&#x0210D;":{entityName:"&quaternions;"}, "&#x0210E;":{entityName:"&planckh;"}, "&#x0210F;":{entityName:"&planck;"}, "&#x02110;":{entityName:"&Iscr;"}, "&#x02111;":{entityName:"&image;"}, "&#x02112;":{entityName:"&Lscr;"}, "&#x02113;":{entityName:"&ell;"}, "&#x02115;":{entityName:"&Nopf;"}, "&#x02116;":{entityName:"&numero;"}, "&#x02117;":{entityName:"&copysr;"}, "&#x02118;":{entityName:"&weierp;"}, "&#x02119;":{entityName:"&Popf;"}, "&#x0211A;":{entityName:"&rationals;"}, "&#x0211B;":{entityName:"&Rscr;"}, "&#x0211C;":{entityName:"&real;"}, "&#x0211D;":{entityName:"&reals;"}, "&#x0211E;":{entityName:"&rx;"}, "&#x02122;":{entityName:"&trade;"}, "&#x02124;":{entityName:"&integers;"}, "&#x02126;":{entityName:"&ohm;"}, "&#x02127;":{entityName:"&mho;"}, "&#x02128;":{entityName:"&Zfr;"}, "&#x02129;":{entityName:"&iiota;"}, "&#x0212B;":{entityName:"&angst;"}, "&#x0212C;":{entityName:"&bernou;"}, "&#x0212D;":{entityName:"&Cfr;"}, "&#x0212F;":{entityName:"&escr;"}, "&#x02130;":{entityName:"&Escr;"}, "&#x02131;":{entityName:"&Fscr;"}, "&#x02133;":{entityName:"&phmmat;"}, "&#x02134;":{entityName:"&order;"}, "&#x02135;":{entityName:"&alefsym;"}, "&#x02136;":{entityName:"&beth;"}, "&#x02137;":{entityName:"&gimel;"}, "&#x02138;":{entityName:"&daleth;"}, "&#x02145;":{entityName:"&CapitalDifferentialD;"}, "&#x02146;":{entityName:"&DifferentialD;"}, "&#x02147;":{entityName:"&ExponentialE;"}, "&#x02148;":{entityName:"&ImaginaryI;"}, "&#x02153;":{entityName:"&frac13;"}, "&#x02154;":{entityName:"&frac23;"}, "&#x02155;":{entityName:"&frac15;"}, "&#x02156;":{entityName:"&frac25;"}, "&#x02157;":{entityName:"&frac35;"}, "&#x02158;":{entityName:"&frac45;"}, "&#x02159;":{entityName:"&frac16;"}, "&#x0215A;":{entityName:"&frac56;"}, "&#x0215B;":{entityName:"&frac18;"}, "&#x0215C;":{entityName:"&frac38;"}, "&#x0215D;":{entityName:"&frac58;"}, "&#x0215E;":{entityName:"&frac78;"}, "&#x02190;":{entityName:"&larr;"}, "&#x02191;":{entityName:"&uarr;"}, "&#x02192;":{entityName:"&rarr;"}, "&#x02193;":{entityName:"&darr;"}, "&#x02194;":{entityName:"&harr;"}, "&#x02195;":{entityName:"&varr;"}, "&#x02196;":{entityName:"&nwarr;"}, "&#x02197;":{entityName:"&nearr;"}, "&#x02198;":{entityName:"&searr;"}, "&#x02199;":{entityName:"&swarr;"}, "&#x0219A;":{entityName:"&nlarr;"}, "&#x0219B;":{entityName:"&nrarr;"}, "&#x0219D;":{entityName:"&rarrw;"}, "&#x0219E;":{entityName:"&Larr;"}, "&#x0219F;":{entityName:"&Uarr;"}, "&#x021A0;":{entityName:"&Rarr;"}, "&#x021A1;":{entityName:"&Darr;"}, "&#x021A2;":{entityName:"&larrtl;"}, "&#x021A3;":{entityName:"&rarrtl;"}, "&#x021A4;":{entityName:"&LeftTeeArrow;"}, "&#x021A5;":{entityName:"&UpTeeArrow;"}, "&#x021A6;":{entityName:"&map;"}, "&#x021A7;":{entityName:"&DownTeeArrow;"}, "&#x021A9;":{entityName:"&larrhk;"}, "&#x021AA;":{entityName:"&rarrhk;"}, "&#x021AB;":{entityName:"&larrlp;"}, "&#x021AC;":{entityName:"&rarrlp;"}, "&#x021AD;":{entityName:"&harrw;"}, "&#x021AE;":{entityName:"&nharr;"}, "&#x021B0;":{entityName:"&lsh;"}, "&#x021B1;":{entityName:"&rsh;"}, "&#x021B2;":{entityName:"&ldsh;"}, "&#x021B3;":{entityName:"&rdsh;"}, "&#x021B5;":{entityName:"&crarr;"}, "&#x021B6;":{entityName:"&cularr;"}, "&#x021B7;":{entityName:"&curarr;"}, "&#x021BA;":{entityName:"&olarr;"}, "&#x021BB;":{entityName:"&orarr;"}, "&#x021BC;":{entityName:"&lharu;"}, "&#x021BD;":{entityName:"&lhard;"}, "&#x021BE;":{entityName:"&uharr;"}, "&#x021BF;":{entityName:"&uharl;"}, "&#x021C0;":{entityName:"&rharu;"}, "&#x021C1;":{entityName:"&rhard;"}, "&#x021C2;":{entityName:"&dharr;"}, "&#x021C3;":{entityName:"&dharl;"}, "&#x021C4;":{entityName:"&rlarr;"}, "&#x021C5;":{entityName:"&udarr;"}, "&#x021C6;":{entityName:"&lrarr;"}, "&#x021C7;":{entityName:"&llarr;"}, "&#x021C8;":{entityName:"&uuarr;"}, "&#x021C9;":{entityName:"&rrarr;"}, "&#x021CA;":{entityName:"&ddarr;"}, "&#x021CB;":{entityName:"&lrhar;"}, "&#x021CC;":{entityName:"&rlhar;"}, "&#x021CD;":{entityName:"&nlArr;"}, "&#x021CE;":{entityName:"&nhArr;"}, "&#x021CF;":{entityName:"&nrArr;"}, "&#x021D0;":{entityName:"&lArr;"}, "&#x021D1;":{entityName:"&uArr;"}, "&#x021D2;":{entityName:"&rArr;"}, "&#x021D3;":{entityName:"&dArr;"}, "&#x021D4;":{entityName:"&hArr;"}, "&#x021D5;":{entityName:"&vArr;"}, "&#x021D6;":{entityName:"&nwArr;"}, "&#x021D7;":{entityName:"&neArr;"}, "&#x021D8;":{entityName:"&seArr;"}, "&#x021D9;":{entityName:"&swArr;"}, "&#x021DA;":{entityName:"&lAarr;"}, "&#x021DB;":{entityName:"&rAarr;"}, "&#x021DD;":{entityName:"&zigrarr;"}, "&#x021E4;":{entityName:"&larrb;"}, "&#x021E5;":{entityName:"&rarrb;"}, "&#x021F5;":{entityName:"&duarr;"}, "&#x021FD;":{entityName:"&loarr;"}, "&#x021FE;":{entityName:"&roarr;"}, "&#x021FF;":{entityName:"&hoarr;"}, "&#x02200;":{entityName:"&forall;"}, "&#x02201;":{entityName:"&comp;"}, "&#x02202;":{entityName:"&part;"}, "&#x02203;":{entityName:"&exist;"}, "&#x02204;":{entityName:"&nexist;"}, "&#x02205;":{entityName:"&empty;"}, "&#x02207;":{entityName:"&nabla;"}, "&#x02208;":{entityName:"&isin;"}, "&#x02209;":{entityName:"&notin;"}, "&#x0220B;":{entityName:"&niv;"}, "&#x0220C;":{entityName:"&notni;"}, "&#x0220F;":{entityName:"&prod;"}, "&#x02210;":{entityName:"&coprod;"}, "&#x02211;":{entityName:"&sum;"}, "&#x02212;":{entityName:"&minus;"}, "&#x02213;":{entityName:"&mnplus;"}, "&#x02214;":{entityName:"&plusdo;"}, "&#x02216;":{entityName:"&setmn;"}, "&#x02217;":{entityName:"&lowast;"}, "&#x02218;":{entityName:"&compfn;"}, "&#x0221A;":{entityName:"&radic;"}, "&#x0221D;":{entityName:"&prop;"}, "&#x0221E;":{entityName:"&infin;"}, "&#x0221F;":{entityName:"&angrt;"}, "&#x02220;":{entityName:"&ang;"}, "&#x02221;":{entityName:"&angmsd;"}, "&#x02222;":{entityName:"&angsph;"}, "&#x02223;":{entityName:"&mid;"}, "&#x02224;":{entityName:"&nmid;"}, "&#x02225;":{entityName:"&par;"}, "&#x02226;":{entityName:"&npar;"}, "&#x02227;":{entityName:"&and;"}, "&#x02228;":{entityName:"&or;"}, "&#x02229;":{entityName:"&cap;"}, "&#x0222A;":{entityName:"&cup;"}, "&#x0222B;":{entityName:"&int;"}, "&#x0222C;":{entityName:"&Int;"}, "&#x0222D;":{entityName:"&tint;"}, "&#x0222E;":{entityName:"&conint;"}, "&#x0222F;":{entityName:"&Conint;"}, "&#x02230;":{entityName:"&Cconint;"}, "&#x02231;":{entityName:"&cwint;"}, "&#x02232;":{entityName:"&cwconint;"}, "&#x02233;":{entityName:"&awconint;"}, "&#x02234;":{entityName:"&there4;"}, "&#x02235;":{entityName:"&becaus;"}, "&#x02236;":{entityName:"&ratio;"}, "&#x02237;":{entityName:"&Colon;"}, "&#x02238;":{entityName:"&minusd;"}, "&#x0223A;":{entityName:"&mDDot;"}, "&#x0223B;":{entityName:"&homtht;"}, "&#x0223C;":{entityName:"&sim;"}, "&#x0223D;":{entityName:"&bsim;"}, "&#x0223E;":{entityName:"&ac;"}, "&#x0223F;":{entityName:"&acd;"}, "&#x02240;":{entityName:"&wreath;"}, "&#x02241;":{entityName:"&nsim;"}, "&#x02242;":{entityName:"&esim;"}, "&#x02243;":{entityName:"&sime;"}, "&#x02244;":{entityName:"&nsime;"}, "&#x02245;":{entityName:"&cong;"}, "&#x02246;":{entityName:"&simne;"}, "&#x02247;":{entityName:"&ncong;"}, "&#x02248;":{entityName:"&asymp;"}, "&#x02249;":{entityName:"&nap;"}, "&#x0224A;":{entityName:"&ape;"}, "&#x0224B;":{entityName:"&apid;"}, "&#x0224C;":{entityName:"&bcong;"}, "&#x0224D;":{entityName:"&asympeq;"}, "&#x0224E;":{entityName:"&bump;"}, "&#x0224F;":{entityName:"&bumpe;"}, "&#x02250;":{entityName:"&esdot;"}, "&#x02251;":{entityName:"&eDot;"}, "&#x02252;":{entityName:"&efDot;"}, "&#x02253;":{entityName:"&erDot;"}, "&#x02254;":{entityName:"&colone;"}, "&#x02255;":{entityName:"&ecolon;"}, "&#x02256;":{entityName:"&ecir;"}, "&#x02257;":{entityName:"&cire;"}, "&#x02259;":{entityName:"&wedgeq;"}, "&#x0225A;":{entityName:"&veeeq;"}, "&#x0225C;":{entityName:"&trie;"}, "&#x0225F;":{entityName:"&equest;"}, "&#x02260;":{entityName:"&ne;"}, "&#x02261;":{entityName:"&equiv;"}, "&#x02262;":{entityName:"&nequiv;"}, "&#x02264;":{entityName:"&le;"}, "&#x02265;":{entityName:"&ge;"}, "&#x02266;":{entityName:"&lE;"}, "&#x02267;":{entityName:"&gE;"}, "&#x02268;":{entityName:"&lnE;"}, "&#x02269;":{entityName:"&gnE;"}, "&#x0226A;":{entityName:"&Lt;"}, "&#x0226B;":{entityName:"&Gt;"}, "&#x0226C;":{entityName:"&twixt;"}, "&#x0226D;":{entityName:"&NotCupCap;"}, "&#x0226E;":{entityName:"&nlt;"}, "&#x0226F;":{entityName:"&ngt;"}, "&#x02270;":{entityName:"&nle;"}, "&#x02271;":{entityName:"&nge;"}, "&#x02272;":{entityName:"&lsim;"}, "&#x02273;":{entityName:"&gsim;"}, "&#x02274;":{entityName:"&nlsim;"}, "&#x02275;":{entityName:"&ngsim;"}, "&#x02276;":{entityName:"&lg;"}, "&#x02277;":{entityName:"&gl;"}, "&#x02278;":{entityName:"&ntlg;"}, "&#x02279;":{entityName:"&ntgl;"}, "&#x0227A;":{entityName:"&pr;"}, "&#x0227B;":{entityName:"&sc;"}, "&#x0227C;":{entityName:"&prcue;"}, "&#x0227D;":{entityName:"&sccue;"}, "&#x0227E;":{entityName:"&prsim;"}, "&#x0227F;":{entityName:"&scsim;"}, "&#x02280;":{entityName:"&npr;"}, "&#x02281;":{entityName:"&nsc;"}, "&#x02282;":{entityName:"&sub;"}, "&#x02283;":{entityName:"&sup;"}, "&#x02284;":{entityName:"&nsub;"}, "&#x02285;":{entityName:"&nsup;"}, "&#x02286;":{entityName:"&sube;"}, "&#x02287;":{entityName:"&supe;"}, "&#x02288;":{entityName:"&nsube;"}, "&#x02289;":{entityName:"&nsupe;"}, "&#x0228A;":{entityName:"&subne;"}, "&#x0228B;":{entityName:"&supne;"}, "&#x0228D;":{entityName:"&cupdot;"}, "&#x0228E;":{entityName:"&uplus;"}, "&#x0228F;":{entityName:"&sqsub;"}, "&#x02290;":{entityName:"&sqsup;"}, "&#x02291;":{entityName:"&sqsube;"}, "&#x02292;":{entityName:"&sqsupe;"}, "&#x02293;":{entityName:"&sqcap;"}, "&#x02294;":{entityName:"&sqcup;"}, "&#x02295;":{entityName:"&oplus;"}, "&#x02296;":{entityName:"&ominus;"}, "&#x02297;":{entityName:"&otimes;"}, "&#x02298;":{entityName:"&osol;"}, "&#x02299;":{entityName:"&odot;"}, "&#x0229A;":{entityName:"&ocir;"}, "&#x0229B;":{entityName:"&oast;"}, "&#x0229D;":{entityName:"&odash;"}, "&#x0229E;":{entityName:"&plusb;"}, "&#x0229F;":{entityName:"&minusb;"}, "&#x022A0;":{entityName:"&timesb;"}, "&#x022A1;":{entityName:"&sdotb;"}, "&#x022A2;":{entityName:"&vdash;"}, "&#x022A3;":{entityName:"&dashv;"}, "&#x022A4;":{entityName:"&top;"}, "&#x022A5;":{entityName:"&bottom;"}, "&#x022A7;":{entityName:"&models;"}, "&#x022A8;":{entityName:"&vDash;"}, "&#x022A9;":{entityName:"&Vdash;"}, "&#x022AA;":{entityName:"&Vvdash;"}, "&#x022AB;":{entityName:"&VDash;"}, "&#x022AC;":{entityName:"&nvdash;"}, "&#x022AD;":{entityName:"&nvDash;"}, "&#x022AE;":{entityName:"&nVdash;"}, "&#x022AF;":{entityName:"&nVDash;"}, "&#x022B0;":{entityName:"&prurel;"}, "&#x022B2;":{entityName:"&vltri;"}, "&#x022B3;":{entityName:"&vrtri;"}, "&#x022B4;":{entityName:"&ltrie;"}, "&#x022B5;":{entityName:"&rtrie;"}, "&#x022B6;":{entityName:"&origof;"}, "&#x022B7;":{entityName:"&imof;"}, "&#x022B8;":{entityName:"&mumap;"}, "&#x022B9;":{entityName:"&hercon;"}, "&#x022BA;":{entityName:"&intcal;"}, "&#x022BB;":{entityName:"&veebar;"}, "&#x022BD;":{entityName:"&barvee;"}, "&#x022BE;":{entityName:"&angrtvb;"}, "&#x022BF;":{entityName:"&lrtri;"}, "&#x022C0;":{entityName:"&xwedge;"}, "&#x022C1;":{entityName:"&xvee;"}, "&#x022C2;":{entityName:"&xcap;"}, "&#x022C3;":{entityName:"&xcup;"}, "&#x022C4;":{entityName:"&diam;"}, "&#x022C5;":{entityName:"&sdot;"}, "&#x022C6;":{entityName:"&sstarf;"}, "&#x022C7;":{entityName:"&divonx;"}, "&#x022C8;":{entityName:"&bowtie;"}, "&#x022C9;":{entityName:"&ltimes;"}, "&#x022CA;":{entityName:"&rtimes;"}, "&#x022CB;":{entityName:"&lthree;"}, "&#x022CC;":{entityName:"&rthree;"}, "&#x022CD;":{entityName:"&bsime;"}, "&#x022CE;":{entityName:"&cuvee;"}, "&#x022CF;":{entityName:"&cuwed;"}, "&#x022D0;":{entityName:"&Sub;"}, "&#x022D1;":{entityName:"&Sup;"}, "&#x022D2;":{entityName:"&Cap;"}, "&#x022D3;":{entityName:"&Cup;"}, "&#x022D4;":{entityName:"&fork;"}, "&#x022D5;":{entityName:"&epar;"}, "&#x022D6;":{entityName:"&ltdot;"}, "&#x022D7;":{entityName:"&gtdot;"}, "&#x022D8;":{entityName:"&Ll;"}, "&#x022D9;":{entityName:"&Gg;"}, "&#x022DA;":{entityName:"&leg;"}, "&#x022DB;":{entityName:"&gel;"}, "&#x022DE;":{entityName:"&cuepr;"}, "&#x022DF;":{entityName:"&cuesc;"}, "&#x022E0;":{entityName:"&nprcue;"}, "&#x022E1;":{entityName:"&nsccue;"}, "&#x022E2;":{entityName:"&nsqsube;"}, "&#x022E3;":{entityName:"&nsqsupe;"}, "&#x022E6;":{entityName:"&lnsim;"}, "&#x022E7;":{entityName:"&gnsim;"}, "&#x022E8;":{entityName:"&prnsim;"}, "&#x022E9;":{entityName:"&scnsim;"}, "&#x022EA;":{entityName:"&nltri;"}, "&#x022EB;":{entityName:"&nrtri;"}, "&#x022EC;":{entityName:"&nltrie;"}, "&#x022ED;":{entityName:"&nrtrie;"}, "&#x022EE;":{entityName:"&vellip;"}, "&#x022EF;":{entityName:"&ctdot;"}, "&#x022F0;":{entityName:"&utdot;"}, "&#x022F1;":{entityName:"&dtdot;"}, "&#x022F2;":{entityName:"&disin;"}, "&#x022F3;":{entityName:"&isinsv;"}, "&#x022F4;":{entityName:"&isins;"}, "&#x022F5;":{entityName:"&isindot;"}, "&#x022F6;":{entityName:"&notinvc;"}, "&#x022F7;":{entityName:"&notinvb;"}, "&#x022F9;":{entityName:"&isinE;"}, "&#x022FA;":{entityName:"&nisd;"}, "&#x022FB;":{entityName:"&xnis;"}, "&#x022FC;":{entityName:"&nis;"}, "&#x022FD;":{entityName:"&notnivc;"}, "&#x022FE;":{entityName:"&notnivb;"}, "&#x02305;":{entityName:"&barwed;"}, "&#x02306;":{entityName:"&Barwed;"}, "&#x02308;":{entityName:"&lceil;"}, "&#x02309;":{entityName:"&rceil;"}, "&#x0230A;":{entityName:"&lfloor;"}, "&#x0230B;":{entityName:"&rfloor;"}, "&#x0230C;":{entityName:"&drcrop;"}, "&#x0230D;":{entityName:"&dlcrop;"}, "&#x0230E;":{entityName:"&urcrop;"}, "&#x0230F;":{entityName:"&ulcrop;"}, "&#x02310;":{entityName:"&bnot;"}, "&#x02312;":{entityName:"&profline;"}, "&#x02313;":{entityName:"&profsurf;"}, "&#x02315;":{entityName:"&telrec;"}, "&#x02316;":{entityName:"&target;"}, "&#x0231C;":{entityName:"&ulcorn;"}, "&#x0231D;":{entityName:"&urcorn;"}, "&#x0231E;":{entityName:"&dlcorn;"}, "&#x0231F;":{entityName:"&drcorn;"}, "&#x02322;":{entityName:"&frown;"}, "&#x02323;":{entityName:"&smile;"}, "&#x0232D;":{entityName:"&cylcty;"}, "&#x0232E;":{entityName:"&profalar;"}, "&#x02336;":{entityName:"&topbot;"}, "&#x0233D;":{entityName:"&ovbar;"}, "&#x0233F;":{entityName:"&solbar;"}, "&#x0237C;":{entityName:"&angzarr;"}, "&#x023B0;":{entityName:"&lmoust;"}, "&#x023B1;":{entityName:"&rmoust;"}, "&#x023B4;":{entityName:"&tbrk;"}, "&#x023B5;":{entityName:"&bbrk;"}, "&#x023B6;":{entityName:"&bbrktbrk;"}, "&#x023DC;":{entityName:"&OverParenthesis;"}, "&#x023DD;":{entityName:"&UnderParenthesis;"}, "&#x023DE;":{entityName:"&OverBrace;"}, "&#x023DF;":{entityName:"&UnderBrace;"}, "&#x023E2;":{entityName:"&trpezium;"}, "&#x023E7;":{entityName:"&elinters;"}, "&#x02423;":{entityName:"&blank;"}, "&#x024C8;":{entityName:"&oS;"}, "&#x02500;":{entityName:"&boxh;"}, "&#x02502;":{entityName:"&boxv;"}, "&#x0250C;":{entityName:"&boxdr;"}, "&#x02510;":{entityName:"&boxdl;"}, "&#x02514;":{entityName:"&boxur;"}, "&#x02518;":{entityName:"&boxul;"}, "&#x0251C;":{entityName:"&boxvr;"}, "&#x02524;":{entityName:"&boxvl;"}, "&#x0252C;":{entityName:"&boxhd;"}, "&#x02534;":{entityName:"&boxhu;"}, "&#x0253C;":{entityName:"&boxvh;"}, "&#x02550;":{entityName:"&boxH;"}, "&#x02551;":{entityName:"&boxV;"}, "&#x02552;":{entityName:"&boxdR;"}, "&#x02553;":{entityName:"&boxDr;"}, "&#x02554;":{entityName:"&boxDR;"}, "&#x02555;":{entityName:"&boxdL;"}, "&#x02556;":{entityName:"&boxDl;"}, "&#x02557;":{entityName:"&boxDL;"}, "&#x02558;":{entityName:"&boxuR;"}, "&#x02559;":{entityName:"&boxUr;"}, "&#x0255A;":{entityName:"&boxUR;"}, "&#x0255B;":{entityName:"&boxuL;"}, "&#x0255C;":{entityName:"&boxUl;"}, "&#x0255D;":{entityName:"&boxUL;"}, "&#x0255E;":{entityName:"&boxvR;"}, "&#x0255F;":{entityName:"&boxVr;"}, "&#x02560;":{entityName:"&boxVR;"}, "&#x02561;":{entityName:"&boxvL;"}, "&#x02562;":{entityName:"&boxVl;"}, "&#x02563;":{entityName:"&boxVL;"}, "&#x02564;":{entityName:"&boxHd;"}, "&#x02565;":{entityName:"&boxhD;"}, "&#x02566;":{entityName:"&boxHD;"}, "&#x02567;":{entityName:"&boxHu;"}, "&#x02568;":{entityName:"&boxhU;"}, "&#x02569;":{entityName:"&boxHU;"}, "&#x0256A;":{entityName:"&boxvH;"}, "&#x0256B;":{entityName:"&boxVh;"}, "&#x0256C;":{entityName:"&boxVH;"}, "&#x02580;":{entityName:"&uhblk;"}, "&#x02584;":{entityName:"&lhblk;"}, "&#x02588;":{entityName:"&block;"}, "&#x02591;":{entityName:"&blk14;"}, "&#x02592;":{entityName:"&blk12;"}, "&#x02593;":{entityName:"&blk34;"}, "&#x025A1;":{entityName:"&squ;"}, "&#x025AA;":{entityName:"&squf;"}, "&#x025AB;":{entityName:"&EmptyVerySmallSquare;"}, "&#x025AD;":{entityName:"&rect;"}, "&#x025AE;":{entityName:"&marker;"}, "&#x025B1;":{entityName:"&fltns;"}, "&#x025B3;":{entityName:"&xutri;"}, "&#x025B4;":{entityName:"&utrif;"}, "&#x025B5;":{entityName:"&utri;"}, "&#x025B8;":{entityName:"&rtrif;"}, "&#x025B9;":{entityName:"&rtri;"}, "&#x025BD;":{entityName:"&xdtri;"}, "&#x025BE;":{entityName:"&dtrif;"}, "&#x025BF;":{entityName:"&dtri;"}, "&#x025C2;":{entityName:"&ltrif;"}, "&#x025C3;":{entityName:"&ltri;"}, "&#x025CA;":{entityName:"&loz;"}, "&#x025CB;":{entityName:"&cir;"}, "&#x025EC;":{entityName:"&tridot;"}, "&#x025EF;":{entityName:"&xcirc;"}, "&#x025F8;":{entityName:"&ultri;"}, "&#x025F9;":{entityName:"&urtri;"}, "&#x025FA;":{entityName:"&lltri;"}, "&#x025FB;":{entityName:"&EmptySmallSquare;"}, "&#x025FC;":{entityName:"&FilledSmallSquare;"}, "&#x02605;":{entityName:"&starf;"}, "&#x02606;":{entityName:"&star;"}, "&#x0260E;":{entityName:"&phone;"}, "&#x02640;":{entityName:"&female;"}, "&#x02642;":{entityName:"&male;"}, "&#x02660;":{entityName:"&spades;"}, "&#x02663;":{entityName:"&clubs;"}, "&#x02665;":{entityName:"&hearts;"}, "&#x02666;":{entityName:"&diams;"}, "&#x0266A;":{entityName:"&sung;"}, "&#x0266D;":{entityName:"&flat;"}, "&#x0266E;":{entityName:"&natur;"}, "&#x0266F;":{entityName:"&sharp;"}, "&#x02713;":{entityName:"&check;"}, "&#x02717;":{entityName:"&cross;"}, "&#x02720;":{entityName:"&malt;"}, "&#x02736;":{entityName:"&sext;"}, "&#x02758;":{entityName:"&VerticalSeparator;"}, "&#x02772;":{entityName:"&lbbrk;"}, "&#x02773;":{entityName:"&rbbrk;"}, "&#x027E6;":{entityName:"&lobrk;"}, "&#x027E7;":{entityName:"&robrk;"}, "&#x027E8;":{entityName:"&lang;"}, "&#x027E9;":{entityName:"&rang;"}, "&#x027EA;":{entityName:"&Lang;"}, "&#x027EB;":{entityName:"&Rang;"}, "&#x027EC;":{entityName:"&loang;"}, "&#x027ED;":{entityName:"&roang;"}, "&#x027F5;":{entityName:"&xlarr;"}, "&#x027F6;":{entityName:"&xrarr;"}, "&#x027F7;":{entityName:"&xharr;"}, "&#x027F8;":{entityName:"&xlArr;"}, "&#x027F9;":{entityName:"&xrArr;"}, "&#x027FA;":{entityName:"&xhArr;"}, "&#x027FC;":{entityName:"&xmap;"}, "&#x027FF;":{entityName:"&dzigrarr;"}, "&#x02902;":{entityName:"&nvlArr;"}, "&#x02903;":{entityName:"&nvrArr;"}, "&#x02904;":{entityName:"&nvHarr;"}, "&#x02905;":{entityName:"&Map;"}, "&#x0290C;":{entityName:"&lbarr;"}, "&#x0290D;":{entityName:"&rbarr;"}, "&#x0290E;":{entityName:"&lBarr;"}, "&#x0290F;":{entityName:"&rBarr;"}, "&#x02910;":{entityName:"&RBarr;"}, "&#x02911;":{entityName:"&DDotrahd;"}, "&#x02912;":{entityName:"&UpArrowBar;"}, "&#x02913;":{entityName:"&DownArrowBar;"}, "&#x02916;":{entityName:"&Rarrtl;"}, "&#x02919;":{entityName:"&latail;"}, "&#x0291A;":{entityName:"&ratail;"}, "&#x0291B;":{entityName:"&lAtail;"}, "&#x0291C;":{entityName:"&rAtail;"}, "&#x0291D;":{entityName:"&larrfs;"}, "&#x0291E;":{entityName:"&rarrfs;"}, "&#x0291F;":{entityName:"&larrbfs;"}, "&#x02920;":{entityName:"&rarrbfs;"}, "&#x02923;":{entityName:"&nwarhk;"}, "&#x02924;":{entityName:"&nearhk;"}, "&#x02925;":{entityName:"&searhk;"}, "&#x02926;":{entityName:"&swarhk;"}, "&#x02927;":{entityName:"&nwnear;"}, "&#x02928;":{entityName:"&nesear;"}, "&#x02929;":{entityName:"&seswar;"}, "&#x0292A;":{entityName:"&swnwar;"}, "&#x02933;":{entityName:"&rarrc;"}, "&#x02935;":{entityName:"&cudarrr;"}, "&#x02936;":{entityName:"&ldca;"}, "&#x02937;":{entityName:"&rdca;"}, "&#x02938;":{entityName:"&cudarrl;"}, "&#x02939;":{entityName:"&larrpl;"}, "&#x0293C;":{entityName:"&curarrm;"}, "&#x0293D;":{entityName:"&cularrp;"}, "&#x02945;":{entityName:"&rarrpl;"}, "&#x02948;":{entityName:"&harrcir;"}, "&#x02949;":{entityName:"&Uarrocir;"}, "&#x0294A;":{entityName:"&lurdshar;"}, "&#x0294B;":{entityName:"&ldrushar;"}, "&#x0294E;":{entityName:"&LeftRightVector;"}, "&#x0294F;":{entityName:"&RightUpDownVector;"}, "&#x02950;":{entityName:"&DownLeftRightVector;"}, "&#x02951;":{entityName:"&LeftUpDownVector;"}, "&#x02952;":{entityName:"&LeftVectorBar;"}, "&#x02953;":{entityName:"&RightVectorBar;"}, "&#x02954;":{entityName:"&RightUpVectorBar;"}, "&#x02955;":{entityName:"&RightDownVectorBar;"}, "&#x02956;":{entityName:"&DownLeftVectorBar;"}, "&#x02957;":{entityName:"&DownRightVectorBar;"}, "&#x02958;":{entityName:"&LeftUpVectorBar;"}, "&#x02959;":{entityName:"&LeftDownVectorBar;"}, "&#x0295A;":{entityName:"&LeftTeeVector;"}, "&#x0295B;":{entityName:"&RightTeeVector;"}, "&#x0295C;":{entityName:"&RightUpTeeVector;"}, "&#x0295D;":{entityName:"&RightDownTeeVector;"}, "&#x0295E;":{entityName:"&DownLeftTeeVector;"}, "&#x0295F;":{entityName:"&DownRightTeeVector;"}, "&#x02960;":{entityName:"&LeftUpTeeVector;"}, "&#x02961;":{entityName:"&LeftDownTeeVector;"}, "&#x02962;":{entityName:"&lHar;"}, "&#x02963;":{entityName:"&uHar;"}, "&#x02964;":{entityName:"&rHar;"}, "&#x02965;":{entityName:"&dHar;"}, "&#x02966;":{entityName:"&luruhar;"}, "&#x02967;":{entityName:"&ldrdhar;"}, "&#x02968;":{entityName:"&ruluhar;"}, "&#x02969;":{entityName:"&rdldhar;"}, "&#x0296A;":{entityName:"&lharul;"}, "&#x0296B;":{entityName:"&llhard;"}, "&#x0296C;":{entityName:"&rharul;"}, "&#x0296D;":{entityName:"&lrhard;"}, "&#x0296E;":{entityName:"&udhar;"}, "&#x0296F;":{entityName:"&duhar;"}, "&#x02970;":{entityName:"&RoundImplies;"}, "&#x02971;":{entityName:"&erarr;"}, "&#x02972;":{entityName:"&simrarr;"}, "&#x02973;":{entityName:"&larrsim;"}, "&#x02974;":{entityName:"&rarrsim;"}, "&#x02975;":{entityName:"&rarrap;"}, "&#x02976;":{entityName:"&ltlarr;"}, "&#x02978;":{entityName:"&gtrarr;"}, "&#x02979;":{entityName:"&subrarr;"}, "&#x0297B;":{entityName:"&suplarr;"}, "&#x0297C;":{entityName:"&lfisht;"}, "&#x0297D;":{entityName:"&rfisht;"}, "&#x0297E;":{entityName:"&ufisht;"}, "&#x0297F;":{entityName:"&dfisht;"}, "&#x02985;":{entityName:"&lopar;"}, "&#x02986;":{entityName:"&ropar;"}, "&#x0298B;":{entityName:"&lbrke;"}, "&#x0298C;":{entityName:"&rbrke;"}, "&#x0298D;":{entityName:"&lbrkslu;"}, "&#x0298E;":{entityName:"&rbrksld;"}, "&#x0298F;":{entityName:"&lbrksld;"}, "&#x02990;":{entityName:"&rbrkslu;"}, "&#x02991;":{entityName:"&langd;"}, "&#x02992;":{entityName:"&rangd;"}, "&#x02993;":{entityName:"&lparlt;"}, "&#x02994;":{entityName:"&rpargt;"}, "&#x02995;":{entityName:"&gtlPar;"}, "&#x02996;":{entityName:"&ltrPar;"}, "&#x0299A;":{entityName:"&vzigzag;"}, "&#x0299C;":{entityName:"&vangrt;"}, "&#x0299D;":{entityName:"&angrtvbd;"}, "&#x029A4;":{entityName:"&ange;"}, "&#x029A5;":{entityName:"&range;"}, "&#x029A6;":{entityName:"&dwangle;"}, "&#x029A7;":{entityName:"&uwangle;"}, "&#x029A8;":{entityName:"&angmsdaa;"}, "&#x029A9;":{entityName:"&angmsdab;"}, "&#x029AA;":{entityName:"&angmsdac;"}, "&#x029AB;":{entityName:"&angmsdad;"}, "&#x029AC;":{entityName:"&angmsdae;"}, "&#x029AD;":{entityName:"&angmsdaf;"}, "&#x029AE;":{entityName:"&angmsdag;"}, "&#x029AF;":{entityName:"&angmsdah;"}, "&#x029B0;":{entityName:"&bemptyv;"}, "&#x029B1;":{entityName:"&demptyv;"}, "&#x029B2;":{entityName:"&cemptyv;"}, "&#x029B3;":{entityName:"&raemptyv;"}, "&#x029B4;":{entityName:"&laemptyv;"}, "&#x029B5;":{entityName:"&ohbar;"}, "&#x029B6;":{entityName:"&omid;"}, "&#x029B7;":{entityName:"&opar;"}, "&#x029B9;":{entityName:"&operp;"}, "&#x029BB;":{entityName:"&olcross;"}, "&#x029BC;":{entityName:"&odsold;"}, "&#x029BE;":{entityName:"&olcir;"}, "&#x029BF;":{entityName:"&ofcir;"}, "&#x029C0;":{entityName:"&olt;"}, "&#x029C1;":{entityName:"&ogt;"}, "&#x029C2;":{entityName:"&cirscir;"}, "&#x029C3;":{entityName:"&cirE;"}, "&#x029C4;":{entityName:"&solb;"}, "&#x029C5;":{entityName:"&bsolb;"}, "&#x029C9;":{entityName:"&boxbox;"}, "&#x029CD;":{entityName:"&trisb;"}, "&#x029CE;":{entityName:"&rtriltri;"}, "&#x029CF;":{entityName:"&LeftTriangleBar;"}, "&#x029D0;":{entityName:"&RightTriangleBar;"}, "&#x029DA;":{entityName:"&race;"}, "&#x029DC;":{entityName:"&iinfin;"}, "&#x029DD;":{entityName:"&infintie;"}, "&#x029DE;":{entityName:"&nvinfin;"}, "&#x029E3;":{entityName:"&eparsl;"}, "&#x029E4;":{entityName:"&smeparsl;"}, "&#x029E5;":{entityName:"&eqvparsl;"}, "&#x029EB;":{entityName:"&lozf;"}, "&#x029F4;":{entityName:"&RuleDelayed;"}, "&#x029F6;":{entityName:"&dsol;"}, "&#x02A00;":{entityName:"&xodot;"}, "&#x02A01;":{entityName:"&xoplus;"}, "&#x02A02;":{entityName:"&xotime;"}, "&#x02A04;":{entityName:"&xuplus;"}, "&#x02A06;":{entityName:"&xsqcup;"}, "&#x02A0C;":{entityName:"&qint;"}, "&#x02A0D;":{entityName:"&fpartint;"}, "&#x02A10;":{entityName:"&cirfnint;"}, "&#x02A11;":{entityName:"&awint;"}, "&#x02A12;":{entityName:"&rppolint;"}, "&#x02A13;":{entityName:"&scpolint;"}, "&#x02A14;":{entityName:"&npolint;"}, "&#x02A15;":{entityName:"&pointint;"}, "&#x02A16;":{entityName:"&quatint;"}, "&#x02A17;":{entityName:"&intlarhk;"}, "&#x02A22;":{entityName:"&pluscir;"}, "&#x02A23;":{entityName:"&plusacir;"}, "&#x02A24;":{entityName:"&simplus;"}, "&#x02A25;":{entityName:"&plusdu;"}, "&#x02A26;":{entityName:"&plussim;"}, "&#x02A27;":{entityName:"&plustwo;"}, "&#x02A29;":{entityName:"&mcomma;"}, "&#x02A2A;":{entityName:"&minusdu;"}, "&#x02A2D;":{entityName:"&loplus;"}, "&#x02A2E;":{entityName:"&roplus;"}, "&#x02A2F;":{entityName:"&Cross;"}, "&#x02A30;":{entityName:"&timesd;"}, "&#x02A31;":{entityName:"&timesbar;"}, "&#x02A33;":{entityName:"&smashp;"}, "&#x02A34;":{entityName:"&lotimes;"}, "&#x02A35;":{entityName:"&rotimes;"}, "&#x02A36;":{entityName:"&otimesas;"}, "&#x02A37;":{entityName:"&Otimes;"}, "&#x02A38;":{entityName:"&odiv;"}, "&#x02A39;":{entityName:"&triplus;"}, "&#x02A3A;":{entityName:"&triminus;"}, "&#x02A3B;":{entityName:"&tritime;"}, "&#x02A3C;":{entityName:"&iprod;"}, "&#x02A3F;":{entityName:"&amalg;"}, "&#x02A40;":{entityName:"&capdot;"}, "&#x02A42;":{entityName:"&ncup;"}, "&#x02A43;":{entityName:"&ncap;"}, "&#x02A44;":{entityName:"&capand;"}, "&#x02A45;":{entityName:"&cupor;"}, "&#x02A46;":{entityName:"&cupcap;"}, "&#x02A47;":{entityName:"&capcup;"}, "&#x02A48;":{entityName:"&cupbrcap;"}, "&#x02A49;":{entityName:"&capbrcup;"}, "&#x02A4A;":{entityName:"&cupcup;"}, "&#x02A4B;":{entityName:"&capcap;"}, "&#x02A4C;":{entityName:"&ccups;"}, "&#x02A4D;":{entityName:"&ccaps;"}, "&#x02A50;":{entityName:"&ccupssm;"}, "&#x02A53;":{entityName:"&And;"}, "&#x02A54;":{entityName:"&Or;"}, "&#x02A55;":{entityName:"&andand;"}, "&#x02A56;":{entityName:"&oror;"}, "&#x02A57;":{entityName:"&orslope;"}, "&#x02A58;":{entityName:"&andslope;"}, "&#x02A5A;":{entityName:"&andv;"}, "&#x02A5B;":{entityName:"&orv;"}, "&#x02A5C;":{entityName:"&andd;"}, "&#x02A5D;":{entityName:"&ord;"}, "&#x02A5F;":{entityName:"&wedbar;"}, "&#x02A66;":{entityName:"&sdote;"}, "&#x02A6A;":{entityName:"&simdot;"}, "&#x02A6D;":{entityName:"&congdot;"}, "&#x02A6E;":{entityName:"&easter;"}, "&#x02A6F;":{entityName:"&apacir;"}, "&#x02A70;":{entityName:"&apE;"}, "&#x02A71;":{entityName:"&eplus;"}, "&#x02A72;":{entityName:"&pluse;"}, "&#x02A73;":{entityName:"&Esim;"}, "&#x02A74;":{entityName:"&Colone;"}, "&#x02A75;":{entityName:"&Equal;"}, "&#x02A77;":{entityName:"&eDDot;"}, "&#x02A78;":{entityName:"&equivDD;"}, "&#x02A79;":{entityName:"&ltcir;"}, "&#x02A7A;":{entityName:"&gtcir;"}, "&#x02A7B;":{entityName:"&ltquest;"}, "&#x02A7C;":{entityName:"&gtquest;"}, "&#x02A7D;":{entityName:"&les;"}, "&#x02A7E;":{entityName:"&ges;"}, "&#x02A7F;":{entityName:"&lesdot;"}, "&#x02A80;":{entityName:"&gesdot;"}, "&#x02A81;":{entityName:"&lesdoto;"}, "&#x02A82;":{entityName:"&gesdoto;"}, "&#x02A83;":{entityName:"&lesdotor;"}, "&#x02A84;":{entityName:"&gesdotol;"}, "&#x02A85;":{entityName:"&lap;"}, "&#x02A86;":{entityName:"&gap;"}, "&#x02A87;":{entityName:"&lne;"}, "&#x02A88;":{entityName:"&gne;"}, "&#x02A89;":{entityName:"&lnap;"}, "&#x02A8A;":{entityName:"&gnap;"}, "&#x02A8B;":{entityName:"&lEg;"}, "&#x02A8C;":{entityName:"&gEl;"}, "&#x02A8D;":{entityName:"&lsime;"}, "&#x02A8E;":{entityName:"&gsime;"}, "&#x02A8F;":{entityName:"&lsimg;"}, "&#x02A90;":{entityName:"&gsiml;"}, "&#x02A91;":{entityName:"&lgE;"}, "&#x02A92;":{entityName:"&glE;"}, "&#x02A93;":{entityName:"&lesges;"}, "&#x02A94;":{entityName:"&gesles;"}, "&#x02A95;":{entityName:"&els;"}, "&#x02A96;":{entityName:"&egs;"}, "&#x02A97;":{entityName:"&elsdot;"}, "&#x02A98;":{entityName:"&egsdot;"}, "&#x02A99;":{entityName:"&el;"}, "&#x02A9A;":{entityName:"&eg;"}, "&#x02A9D;":{entityName:"&siml;"}, "&#x02A9E;":{entityName:"&simg;"}, "&#x02A9F;":{entityName:"&simlE;"}, "&#x02AA0;":{entityName:"&simgE;"}, "&#x02AA1;":{entityName:"&LessLess;"}, "&#x02AA2;":{entityName:"&GreaterGreater;"}, "&#x02AA4;":{entityName:"&glj;"}, "&#x02AA5;":{entityName:"&gla;"}, "&#x02AA6;":{entityName:"&ltcc;"}, "&#x02AA7;":{entityName:"&gtcc;"}, "&#x02AA8;":{entityName:"&lescc;"}, "&#x02AA9;":{entityName:"&gescc;"}, "&#x02AAA;":{entityName:"&smt;"}, "&#x02AAB;":{entityName:"&lat;"}, "&#x02AAC;":{entityName:"&smte;"}, "&#x02AAD;":{entityName:"&late;"}, "&#x02AAE;":{entityName:"&bumpE;"}, "&#x02AAF;":{entityName:"&pre;"}, "&#x02AB0;":{entityName:"&sce;"}, "&#x02AB3;":{entityName:"&prE;"}, "&#x02AB4;":{entityName:"&scE;"}, "&#x02AB5;":{entityName:"&prnE;"}, "&#x02AB6;":{entityName:"&scnE;"}, "&#x02AB7;":{entityName:"&prap;"}, "&#x02AB8;":{entityName:"&scap;"}, "&#x02AB9;":{entityName:"&prnap;"}, "&#x02ABA;":{entityName:"&scnap;"}, "&#x02ABB;":{entityName:"&Pr;"}, "&#x02ABC;":{entityName:"&Sc;"}, "&#x02ABD;":{entityName:"&subdot;"}, "&#x02ABE;":{entityName:"&supdot;"}, "&#x02ABF;":{entityName:"&subplus;"}, "&#x02AC0;":{entityName:"&supplus;"}, "&#x02AC1;":{entityName:"&submult;"}, "&#x02AC2;":{entityName:"&supmult;"}, "&#x02AC3;":{entityName:"&subedot;"}, "&#x02AC4;":{entityName:"&supedot;"}, "&#x02AC5;":{entityName:"&subE;"}, "&#x02AC6;":{entityName:"&supE;"}, "&#x02AC7;":{entityName:"&subsim;"}, "&#x02AC8;":{entityName:"&supsim;"}, "&#x02ACB;":{entityName:"&subnE;"}, "&#x02ACC;":{entityName:"&supnE;"}, "&#x02ACF;":{entityName:"&csub;"}, "&#x02AD0;":{entityName:"&csup;"}, "&#x02AD1;":{entityName:"&csube;"}, "&#x02AD2;":{entityName:"&csupe;"}, "&#x02AD3;":{entityName:"&subsup;"}, "&#x02AD4;":{entityName:"&supsub;"}, "&#x02AD5;":{entityName:"&subsub;"}, "&#x02AD6;":{entityName:"&supsup;"}, "&#x02AD7;":{entityName:"&suphsub;"}, "&#x02AD8;":{entityName:"&supdsub;"}, "&#x02AD9;":{entityName:"&forkv;"}, "&#x02ADA;":{entityName:"&topfork;"}, "&#x02ADB;":{entityName:"&mlcp;"}, "&#x02AE4;":{entityName:"&Dashv;"}, "&#x02AE6;":{entityName:"&Vdashl;"}, "&#x02AE7;":{entityName:"&Barv;"}, "&#x02AE8;":{entityName:"&vBar;"}, "&#x02AE9;":{entityName:"&vBarv;"}, "&#x02AEB;":{entityName:"&Vbar;"}, "&#x02AEC;":{entityName:"&Not;"}, "&#x02AED;":{entityName:"&bNot;"}, "&#x02AEE;":{entityName:"&rnmid;"}, "&#x02AEF;":{entityName:"&cirmid;"}, "&#x02AF0;":{entityName:"&midcir;"}, "&#x02AF1;":{entityName:"&topcir;"}, "&#x02AF2;":{entityName:"&nhpar;"}, "&#x02AF3;":{entityName:"&parsim;"}, "&#x02AFD;":{entityName:"&parsl;"}, "&#x0FB00;":{entityName:"&fflig;"}, "&#x0FB01;":{entityName:"&filig;"}, "&#x0FB02;":{entityName:"&fllig;"}, "&#x0FB03;":{entityName:"&ffilig;"}, "&#x0FB04;":{entityName:"&ffllig;"}, "&#x1D49C;":{entityName:"&Ascr;"}, "&#x1D49E;":{entityName:"&Cscr;"}, "&#x1D49F;":{entityName:"&Dscr;"}, "&#x1D4A2;":{entityName:"&Gscr;"}, "&#x1D4A5;":{entityName:"&Jscr;"}, "&#x1D4A6;":{entityName:"&Kscr;"}, "&#x1D4A9;":{entityName:"&Nscr;"}, "&#x1D4AA;":{entityName:"&Oscr;"}, "&#x1D4AB;":{entityName:"&Pscr;"}, "&#x1D4AC;":{entityName:"&Qscr;"}, "&#x1D4AE;":{entityName:"&Sscr;"}, "&#x1D4AF;":{entityName:"&Tscr;"}, "&#x1D4B0;":{entityName:"&Uscr;"}, "&#x1D4B1;":{entityName:"&Vscr;"}, "&#x1D4B2;":{entityName:"&Wscr;"}, "&#x1D4B3;":{entityName:"&Xscr;"}, "&#x1D4B4;":{entityName:"&Yscr;"}, "&#x1D4B5;":{entityName:"&Zscr;"}, "&#x1D4B6;":{entityName:"&ascr;"}, "&#x1D4B7;":{entityName:"&bscr;"}, "&#x1D4B8;":{entityName:"&cscr;"}, "&#x1D4B9;":{entityName:"&dscr;"}, "&#x1D4BB;":{entityName:"&fscr;"}, "&#x1D4BD;":{entityName:"&hscr;"}, "&#x1D4BE;":{entityName:"&iscr;"}, "&#x1D4BF;":{entityName:"&jscr;"}, "&#x1D4C0;":{entityName:"&kscr;"}, "&#x1D4C1;":{entityName:"&lscr;"}, "&#x1D4C2;":{entityName:"&mscr;"}, "&#x1D4C3;":{entityName:"&nscr;"}, "&#x1D4C5;":{entityName:"&pscr;"}, "&#x1D4C6;":{entityName:"&qscr;"}, "&#x1D4C7;":{entityName:"&rscr;"}, "&#x1D4C8;":{entityName:"&sscr;"}, "&#x1D4C9;":{entityName:"&tscr;"}, "&#x1D4CA;":{entityName:"&uscr;"}, "&#x1D4CB;":{entityName:"&vscr;"}, "&#x1D4CC;":{entityName:"&wscr;"}, "&#x1D4CD;":{entityName:"&xscr;"}, "&#x1D4CE;":{entityName:"&yscr;"}, "&#x1D4CF;":{entityName:"&zscr;"}, "&#x1D504;":{entityName:"&Afr;"}, "&#x1D505;":{entityName:"&Bfr;"}, "&#x1D507;":{entityName:"&Dfr;"}, "&#x1D508;":{entityName:"&Efr;"}, "&#x1D509;":{entityName:"&Ffr;"}, "&#x1D50A;":{entityName:"&Gfr;"}, "&#x1D50D;":{entityName:"&Jfr;"}, "&#x1D50E;":{entityName:"&Kfr;"}, "&#x1D50F;":{entityName:"&Lfr;"}, "&#x1D510;":{entityName:"&Mfr;"}, "&#x1D511;":{entityName:"&Nfr;"}, "&#x1D512;":{entityName:"&Ofr;"}, "&#x1D513;":{entityName:"&Pfr;"}, "&#x1D514;":{entityName:"&Qfr;"}, "&#x1D516;":{entityName:"&Sfr;"}, "&#x1D517;":{entityName:"&Tfr;"}, "&#x1D518;":{entityName:"&Ufr;"}, "&#x1D519;":{entityName:"&Vfr;"}, "&#x1D51A;":{entityName:"&Wfr;"}, "&#x1D51B;":{entityName:"&Xfr;"}, "&#x1D51C;":{entityName:"&Yfr;"}, "&#x1D51E;":{entityName:"&afr;"}, "&#x1D51F;":{entityName:"&bfr;"}, "&#x1D520;":{entityName:"&cfr;"}, "&#x1D521;":{entityName:"&dfr;"}, "&#x1D522;":{entityName:"&efr;"}, "&#x1D523;":{entityName:"&ffr;"}, "&#x1D524;":{entityName:"&gfr;"}, "&#x1D525;":{entityName:"&hfr;"}, "&#x1D526;":{entityName:"&ifr;"}, "&#x1D527;":{entityName:"&jfr;"}, "&#x1D528;":{entityName:"&kfr;"}, "&#x1D529;":{entityName:"&lfr;"}, "&#x1D52A;":{entityName:"&mfr;"}, "&#x1D52B;":{entityName:"&nfr;"}, "&#x1D52C;":{entityName:"&ofr;"}, "&#x1D52D;":{entityName:"&pfr;"}, "&#x1D52E;":{entityName:"&qfr;"}, "&#x1D52F;":{entityName:"&rfr;"}, "&#x1D530;":{entityName:"&sfr;"}, "&#x1D531;":{entityName:"&tfr;"}, "&#x1D532;":{entityName:"&ufr;"}, "&#x1D533;":{entityName:"&vfr;"}, "&#x1D534;":{entityName:"&wfr;"}, "&#x1D535;":{entityName:"&xfr;"}, "&#x1D536;":{entityName:"&yfr;"}, "&#x1D537;":{entityName:"&zfr;"}, "&#x1D538;":{entityName:"&Aopf;"}, "&#x1D539;":{entityName:"&Bopf;"}, "&#x1D53B;":{entityName:"&Dopf;"}, "&#x1D53C;":{entityName:"&Eopf;"}, "&#x1D53D;":{entityName:"&Fopf;"}, "&#x1D53E;":{entityName:"&Gopf;"}, "&#x1D540;":{entityName:"&Iopf;"}, "&#x1D541;":{entityName:"&Jopf;"}, "&#x1D542;":{entityName:"&Kopf;"}, "&#x1D543;":{entityName:"&Lopf;"}, "&#x1D544;":{entityName:"&Mopf;"}, "&#x1D546;":{entityName:"&Oopf;"}, "&#x1D54A;":{entityName:"&Sopf;"}, "&#x1D54B;":{entityName:"&Topf;"}, "&#x1D54C;":{entityName:"&Uopf;"}, "&#x1D54D;":{entityName:"&Vopf;"}, "&#x1D54E;":{entityName:"&Wopf;"}, "&#x1D54F;":{entityName:"&Xopf;"}, "&#x1D550;":{entityName:"&Yopf;"}, "&#x1D552;":{entityName:"&aopf;"}, "&#x1D553;":{entityName:"&bopf;"}, "&#x1D554;":{entityName:"&copf;"}, "&#x1D555;":{entityName:"&dopf;"}, "&#x1D556;":{entityName:"&eopf;"}, "&#x1D557;":{entityName:"&fopf;"}, "&#x1D558;":{entityName:"&gopf;"}, "&#x1D559;":{entityName:"&hopf;"}, "&#x1D55A;":{entityName:"&iopf;"}, "&#x1D55B;":{entityName:"&jopf;"}, "&#x1D55C;":{entityName:"&kopf;"}, "&#x1D55D;":{entityName:"&lopf;"}, "&#x1D55E;":{entityName:"&mopf;"}, "&#x1D55F;":{entityName:"&nopf;"}, "&#x1D560;":{entityName:"&oopf;"}, "&#x1D561;":{entityName:"&popf;"}, "&#x1D562;":{entityName:"&qopf;"}, "&#x1D563;":{entityName:"&ropf;"}, "&#x1D564;":{entityName:"&sopf;"}, "&#x1D565;":{entityName:"&topf;"}, "&#x1D566;":{entityName:"&uopf;"}, "&#x1D567;":{entityName:"&vopf;"}, "&#x1D568;":{entityName:"&wopf;"}, "&#x1D569;":{entityName:"&xopf;"}, "&#x1D56A;":{entityName:"&yopf;"}, "&#x1D56B;":{entityName:"&zopf;"}};module.exports = hexDecEntities;
//# sourceMappingURL=hexDecHTMLEntities.js.map
},{}],13:[function(require,module,exports){
"use strict";var htmlEntityTypes={"&Aacute;":{codepoints:[193], characters:"\\u00C1"}, "&Aacute":{codepoints:[193], characters:"\\u00C1"}, "&aacute;":{codepoints:[225], characters:"\\u00E1"}, "&aacute":{codepoints:[225], characters:"\\u00E1"}, "&Abreve;":{codepoints:[258], characters:"\\u0102"}, "&abreve;":{codepoints:[259], characters:"\\u0103"}, "&ac;":{codepoints:[8766], characters:"\\u223E"}, "&acd;":{codepoints:[8767], characters:"\\u223F"}, "&acE;":{codepoints:[8766, 819], characters:"\\u223E\\u0333"}, "&Acirc;":{codepoints:[194], characters:"\\u00C2"}, "&Acirc":{codepoints:[194], characters:"\\u00C2"}, "&acirc;":{codepoints:[226], characters:"\\u00E2"}, "&acirc":{codepoints:[226], characters:"\\u00E2"}, "&acute;":{codepoints:[180], characters:"\\u00B4"}, "&acute":{codepoints:[180], characters:"\\u00B4"}, "&Acy;":{codepoints:[1040], characters:"\\u0410"}, "&acy;":{codepoints:[1072], characters:"\\u0430"}, "&AElig;":{codepoints:[198], characters:"\\u00C6"}, "&AElig":{codepoints:[198], characters:"\\u00C6"}, "&aelig;":{codepoints:[230], characters:"\\u00E6"}, "&aelig":{codepoints:[230], characters:"\\u00E6"}, "&af;":{codepoints:[8289], characters:"\\u2061"}, "&Afr;":{codepoints:[120068], characters:"\\uD835\\uDD04"}, "&afr;":{codepoints:[120094], characters:"\\uD835\\uDD1E"}, "&Agrave;":{codepoints:[192], characters:"\\u00C0"}, "&Agrave":{codepoints:[192], characters:"\\u00C0"}, "&agrave;":{codepoints:[224], characters:"\\u00E0"}, "&agrave":{codepoints:[224], characters:"\\u00E0"}, "&alefsym;":{codepoints:[8501], characters:"\\u2135"}, "&aleph;":{codepoints:[8501], characters:"\\u2135"}, "&Alpha;":{codepoints:[913], characters:"\\u0391"}, "&alpha;":{codepoints:[945], characters:"\\u03B1"}, "&Amacr;":{codepoints:[256], characters:"\\u0100"}, "&amacr;":{codepoints:[257], characters:"\\u0101"}, "&amalg;":{codepoints:[10815], characters:"\\u2A3F"}, "&amp;":{codepoints:[38], characters:"\\u0026"}, "&amp":{codepoints:[38], characters:"\\u0026"}, "&AMP;":{codepoints:[38], characters:"\\u0026"}, "&AMP":{codepoints:[38], characters:"\\u0026"}, "&andand;":{codepoints:[10837], characters:"\\u2A55"}, "&And;":{codepoints:[10835], characters:"\\u2A53"}, "&and;":{codepoints:[8743], characters:"\\u2227"}, "&andd;":{codepoints:[10844], characters:"\\u2A5C"}, "&andslope;":{codepoints:[10840], characters:"\\u2A58"}, "&andv;":{codepoints:[10842], characters:"\\u2A5A"}, "&ang;":{codepoints:[8736], characters:"\\u2220"}, "&ange;":{codepoints:[10660], characters:"\\u29A4"}, "&angle;":{codepoints:[8736], characters:"\\u2220"}, "&angmsdaa;":{codepoints:[10664], characters:"\\u29A8"}, "&angmsdab;":{codepoints:[10665], characters:"\\u29A9"}, "&angmsdac;":{codepoints:[10666], characters:"\\u29AA"}, "&angmsdad;":{codepoints:[10667], characters:"\\u29AB"}, "&angmsdae;":{codepoints:[10668], characters:"\\u29AC"}, "&angmsdaf;":{codepoints:[10669], characters:"\\u29AD"}, "&angmsdag;":{codepoints:[10670], characters:"\\u29AE"}, "&angmsdah;":{codepoints:[10671], characters:"\\u29AF"}, "&angmsd;":{codepoints:[8737], characters:"\\u2221"}, "&angrt;":{codepoints:[8735], characters:"\\u221F"}, "&angrtvb;":{codepoints:[8894], characters:"\\u22BE"}, "&angrtvbd;":{codepoints:[10653], characters:"\\u299D"}, "&angsph;":{codepoints:[8738], characters:"\\u2222"}, "&angst;":{codepoints:[197], characters:"\\u00C5"}, "&angzarr;":{codepoints:[9084], characters:"\\u237C"}, "&Aogon;":{codepoints:[260], characters:"\\u0104"}, "&aogon;":{codepoints:[261], characters:"\\u0105"}, "&Aopf;":{codepoints:[120120], characters:"\\uD835\\uDD38"}, "&aopf;":{codepoints:[120146], characters:"\\uD835\\uDD52"}, "&apacir;":{codepoints:[10863], characters:"\\u2A6F"}, "&ap;":{codepoints:[8776], characters:"\\u2248"}, "&apE;":{codepoints:[10864], characters:"\\u2A70"}, "&ape;":{codepoints:[8778], characters:"\\u224A"}, "&apid;":{codepoints:[8779], characters:"\\u224B"}, "&apos;":{codepoints:[39], characters:"\\u0027"}, "&ApplyFunction;":{codepoints:[8289], characters:"\\u2061"}, "&approx;":{codepoints:[8776], characters:"\\u2248"}, "&approxeq;":{codepoints:[8778], characters:"\\u224A"}, "&Aring;":{codepoints:[197], characters:"\\u00C5"}, "&Aring":{codepoints:[197], characters:"\\u00C5"}, "&aring;":{codepoints:[229], characters:"\\u00E5"}, "&aring":{codepoints:[229], characters:"\\u00E5"}, "&Ascr;":{codepoints:[119964], characters:"\\uD835\\uDC9C"}, "&ascr;":{codepoints:[119990], characters:"\\uD835\\uDCB6"}, "&Assign;":{codepoints:[8788], characters:"\\u2254"}, "&ast;":{codepoints:[42], characters:"\\u002A"}, "&asymp;":{codepoints:[8776], characters:"\\u2248"}, "&asympeq;":{codepoints:[8781], characters:"\\u224D"}, "&Atilde;":{codepoints:[195], characters:"\\u00C3"}, "&Atilde":{codepoints:[195], characters:"\\u00C3"}, "&atilde;":{codepoints:[227], characters:"\\u00E3"}, "&atilde":{codepoints:[227], characters:"\\u00E3"}, "&Auml;":{codepoints:[196], characters:"\\u00C4"}, "&Auml":{codepoints:[196], characters:"\\u00C4"}, "&auml;":{codepoints:[228], characters:"\\u00E4"}, "&auml":{codepoints:[228], characters:"\\u00E4"}, "&awconint;":{codepoints:[8755], characters:"\\u2233"}, "&awint;":{codepoints:[10769], characters:"\\u2A11"}, "&backcong;":{codepoints:[8780], characters:"\\u224C"}, "&backepsilon;":{codepoints:[1014], characters:"\\u03F6"}, "&backprime;":{codepoints:[8245], characters:"\\u2035"}, "&backsim;":{codepoints:[8765], characters:"\\u223D"}, "&backsimeq;":{codepoints:[8909], characters:"\\u22CD"}, "&Backslash;":{codepoints:[8726], characters:"\\u2216"}, "&Barv;":{codepoints:[10983], characters:"\\u2AE7"}, "&barvee;":{codepoints:[8893], characters:"\\u22BD"}, "&barwed;":{codepoints:[8965], characters:"\\u2305"}, "&Barwed;":{codepoints:[8966], characters:"\\u2306"}, "&barwedge;":{codepoints:[8965], characters:"\\u2305"}, "&bbrk;":{codepoints:[9141], characters:"\\u23B5"}, "&bbrktbrk;":{codepoints:[9142], characters:"\\u23B6"}, "&bcong;":{codepoints:[8780], characters:"\\u224C"}, "&Bcy;":{codepoints:[1041], characters:"\\u0411"}, "&bcy;":{codepoints:[1073], characters:"\\u0431"}, "&bdquo;":{codepoints:[8222], characters:"\\u201E"}, "&becaus;":{codepoints:[8757], characters:"\\u2235"}, "&because;":{codepoints:[8757], characters:"\\u2235"}, "&Because;":{codepoints:[8757], characters:"\\u2235"}, "&bemptyv;":{codepoints:[10672], characters:"\\u29B0"}, "&bepsi;":{codepoints:[1014], characters:"\\u03F6"}, "&bernou;":{codepoints:[8492], characters:"\\u212C"}, "&Bernoullis;":{codepoints:[8492], characters:"\\u212C"}, "&Beta;":{codepoints:[914], characters:"\\u0392"}, "&beta;":{codepoints:[946], characters:"\\u03B2"}, "&beth;":{codepoints:[8502], characters:"\\u2136"}, "&between;":{codepoints:[8812], characters:"\\u226C"}, "&Bfr;":{codepoints:[120069], characters:"\\uD835\\uDD05"}, "&bfr;":{codepoints:[120095], characters:"\\uD835\\uDD1F"}, "&bigcap;":{codepoints:[8898], characters:"\\u22C2"}, "&bigcirc;":{codepoints:[9711], characters:"\\u25EF"}, "&bigcup;":{codepoints:[8899], characters:"\\u22C3"}, "&bigodot;":{codepoints:[10752], characters:"\\u2A00"}, "&bigoplus;":{codepoints:[10753], characters:"\\u2A01"}, "&bigotimes;":{codepoints:[10754], characters:"\\u2A02"}, "&bigsqcup;":{codepoints:[10758], characters:"\\u2A06"}, "&bigstar;":{codepoints:[9733], characters:"\\u2605"}, "&bigtriangledown;":{codepoints:[9661], characters:"\\u25BD"}, "&bigtriangleup;":{codepoints:[9651], characters:"\\u25B3"}, "&biguplus;":{codepoints:[10756], characters:"\\u2A04"}, "&bigvee;":{codepoints:[8897], characters:"\\u22C1"}, "&bigwedge;":{codepoints:[8896], characters:"\\u22C0"}, "&bkarow;":{codepoints:[10509], characters:"\\u290D"}, "&blacklozenge;":{codepoints:[10731], characters:"\\u29EB"}, "&blacksquare;":{codepoints:[9642], characters:"\\u25AA"}, "&blacktriangle;":{codepoints:[9652], characters:"\\u25B4"}, "&blacktriangledown;":{codepoints:[9662], characters:"\\u25BE"}, "&blacktriangleleft;":{codepoints:[9666], characters:"\\u25C2"}, "&blacktriangleright;":{codepoints:[9656], characters:"\\u25B8"}, "&blank;":{codepoints:[9251], characters:"\\u2423"}, "&blk12;":{codepoints:[9618], characters:"\\u2592"}, "&blk14;":{codepoints:[9617], characters:"\\u2591"}, "&blk34;":{codepoints:[9619], characters:"\\u2593"}, "&block;":{codepoints:[9608], characters:"\\u2588"}, "&bne;":{codepoints:[61, 8421], characters:"\\u003D\\u20E5"}, "&bnequiv;":{codepoints:[8801, 8421], characters:"\\u2261\\u20E5"}, "&bNot;":{codepoints:[10989], characters:"\\u2AED"}, "&bnot;":{codepoints:[8976], characters:"\\u2310"}, "&Bopf;":{codepoints:[120121], characters:"\\uD835\\uDD39"}, "&bopf;":{codepoints:[120147], characters:"\\uD835\\uDD53"}, "&bot;":{codepoints:[8869], characters:"\\u22A5"}, "&bottom;":{codepoints:[8869], characters:"\\u22A5"}, "&bowtie;":{codepoints:[8904], characters:"\\u22C8"}, "&boxbox;":{codepoints:[10697], characters:"\\u29C9"}, "&boxdl;":{codepoints:[9488], characters:"\\u2510"}, "&boxdL;":{codepoints:[9557], characters:"\\u2555"}, "&boxDl;":{codepoints:[9558], characters:"\\u2556"}, "&boxDL;":{codepoints:[9559], characters:"\\u2557"}, "&boxdr;":{codepoints:[9484], characters:"\\u250C"}, "&boxdR;":{codepoints:[9554], characters:"\\u2552"}, "&boxDr;":{codepoints:[9555], characters:"\\u2553"}, "&boxDR;":{codepoints:[9556], characters:"\\u2554"}, "&boxh;":{codepoints:[9472], characters:"\\u2500"}, "&boxH;":{codepoints:[9552], characters:"\\u2550"}, "&boxhd;":{codepoints:[9516], characters:"\\u252C"}, "&boxHd;":{codepoints:[9572], characters:"\\u2564"}, "&boxhD;":{codepoints:[9573], characters:"\\u2565"}, "&boxHD;":{codepoints:[9574], characters:"\\u2566"}, "&boxhu;":{codepoints:[9524], characters:"\\u2534"}, "&boxHu;":{codepoints:[9575], characters:"\\u2567"}, "&boxhU;":{codepoints:[9576], characters:"\\u2568"}, "&boxHU;":{codepoints:[9577], characters:"\\u2569"}, "&boxminus;":{codepoints:[8863], characters:"\\u229F"}, "&boxplus;":{codepoints:[8862], characters:"\\u229E"}, "&boxtimes;":{codepoints:[8864], characters:"\\u22A0"}, "&boxul;":{codepoints:[9496], characters:"\\u2518"}, "&boxuL;":{codepoints:[9563], characters:"\\u255B"}, "&boxUl;":{codepoints:[9564], characters:"\\u255C"}, "&boxUL;":{codepoints:[9565], characters:"\\u255D"}, "&boxur;":{codepoints:[9492], characters:"\\u2514"}, "&boxuR;":{codepoints:[9560], characters:"\\u2558"}, "&boxUr;":{codepoints:[9561], characters:"\\u2559"}, "&boxUR;":{codepoints:[9562], characters:"\\u255A"}, "&boxv;":{codepoints:[9474], characters:"\\u2502"}, "&boxV;":{codepoints:[9553], characters:"\\u2551"}, "&boxvh;":{codepoints:[9532], characters:"\\u253C"}, "&boxvH;":{codepoints:[9578], characters:"\\u256A"}, "&boxVh;":{codepoints:[9579], characters:"\\u256B"}, "&boxVH;":{codepoints:[9580], characters:"\\u256C"}, "&boxvl;":{codepoints:[9508], characters:"\\u2524"}, "&boxvL;":{codepoints:[9569], characters:"\\u2561"}, "&boxVl;":{codepoints:[9570], characters:"\\u2562"}, "&boxVL;":{codepoints:[9571], characters:"\\u2563"}, "&boxvr;":{codepoints:[9500], characters:"\\u251C"}, "&boxvR;":{codepoints:[9566], characters:"\\u255E"}, "&boxVr;":{codepoints:[9567], characters:"\\u255F"}, "&boxVR;":{codepoints:[9568], characters:"\\u2560"}, "&bprime;":{codepoints:[8245], characters:"\\u2035"}, "&breve;":{codepoints:[728], characters:"\\u02D8"}, "&Breve;":{codepoints:[728], characters:"\\u02D8"}, "&brvbar;":{codepoints:[166], characters:"\\u00A6"}, "&brvbar":{codepoints:[166], characters:"\\u00A6"}, "&bscr;":{codepoints:[119991], characters:"\\uD835\\uDCB7"}, "&Bscr;":{codepoints:[8492], characters:"\\u212C"}, "&bsemi;":{codepoints:[8271], characters:"\\u204F"}, "&bsim;":{codepoints:[8765], characters:"\\u223D"}, "&bsime;":{codepoints:[8909], characters:"\\u22CD"}, "&bsolb;":{codepoints:[10693], characters:"\\u29C5"}, "&bsol;":{codepoints:[92], characters:"\\u005C"}, "&bsolhsub;":{codepoints:[10184], characters:"\\u27C8"}, "&bull;":{codepoints:[8226], characters:"\\u2022"}, "&bullet;":{codepoints:[8226], characters:"\\u2022"}, "&bump;":{codepoints:[8782], characters:"\\u224E"}, "&bumpE;":{codepoints:[10926], characters:"\\u2AAE"}, "&bumpe;":{codepoints:[8783], characters:"\\u224F"}, "&Bumpeq;":{codepoints:[8782], characters:"\\u224E"}, "&bumpeq;":{codepoints:[8783], characters:"\\u224F"}, "&Cacute;":{codepoints:[262], characters:"\\u0106"}, "&cacute;":{codepoints:[263], characters:"\\u0107"}, "&capand;":{codepoints:[10820], characters:"\\u2A44"}, "&capbrcup;":{codepoints:[10825], characters:"\\u2A49"}, "&capcap;":{codepoints:[10827], characters:"\\u2A4B"}, "&cap;":{codepoints:[8745], characters:"\\u2229"}, "&Cap;":{codepoints:[8914], characters:"\\u22D2"}, "&capcup;":{codepoints:[10823], characters:"\\u2A47"}, "&capdot;":{codepoints:[10816], characters:"\\u2A40"}, "&CapitalDifferentialD;":{codepoints:[8517], characters:"\\u2145"}, "&caps;":{codepoints:[8745, 65024], characters:"\\u2229\\uFE00"}, "&caret;":{codepoints:[8257], characters:"\\u2041"}, "&caron;":{codepoints:[711], characters:"\\u02C7"}, "&Cayleys;":{codepoints:[8493], characters:"\\u212D"}, "&ccaps;":{codepoints:[10829], characters:"\\u2A4D"}, "&Ccaron;":{codepoints:[268], characters:"\\u010C"}, "&ccaron;":{codepoints:[269], characters:"\\u010D"}, "&Ccedil;":{codepoints:[199], characters:"\\u00C7"}, "&Ccedil":{codepoints:[199], characters:"\\u00C7"}, "&ccedil;":{codepoints:[231], characters:"\\u00E7"}, "&ccedil":{codepoints:[231], characters:"\\u00E7"}, "&Ccirc;":{codepoints:[264], characters:"\\u0108"}, "&ccirc;":{codepoints:[265], characters:"\\u0109"}, "&Cconint;":{codepoints:[8752], characters:"\\u2230"}, "&ccups;":{codepoints:[10828], characters:"\\u2A4C"}, "&ccupssm;":{codepoints:[10832], characters:"\\u2A50"}, "&Cdot;":{codepoints:[266], characters:"\\u010A"}, "&cdot;":{codepoints:[267], characters:"\\u010B"}, "&cedil;":{codepoints:[184], characters:"\\u00B8"}, "&cedil":{codepoints:[184], characters:"\\u00B8"}, "&Cedilla;":{codepoints:[184], characters:"\\u00B8"}, "&cemptyv;":{codepoints:[10674], characters:"\\u29B2"}, "&cent;":{codepoints:[162], characters:"\\u00A2"}, "&cent":{codepoints:[162], characters:"\\u00A2"}, "&centerdot;":{codepoints:[183], characters:"\\u00B7"}, "&CenterDot;":{codepoints:[183], characters:"\\u00B7"}, "&cfr;":{codepoints:[120096], characters:"\\uD835\\uDD20"}, "&Cfr;":{codepoints:[8493], characters:"\\u212D"}, "&CHcy;":{codepoints:[1063], characters:"\\u0427"}, "&chcy;":{codepoints:[1095], characters:"\\u0447"}, "&check;":{codepoints:[10003], characters:"\\u2713"}, "&checkmark;":{codepoints:[10003], characters:"\\u2713"}, "&Chi;":{codepoints:[935], characters:"\\u03A7"}, "&chi;":{codepoints:[967], characters:"\\u03C7"}, "&circ;":{codepoints:[710], characters:"\\u02C6"}, "&circeq;":{codepoints:[8791], characters:"\\u2257"}, "&circlearrowleft;":{codepoints:[8634], characters:"\\u21BA"}, "&circlearrowright;":{codepoints:[8635], characters:"\\u21BB"}, "&circledast;":{codepoints:[8859], characters:"\\u229B"}, "&circledcirc;":{codepoints:[8858], characters:"\\u229A"}, "&circleddash;":{codepoints:[8861], characters:"\\u229D"}, "&CircleDot;":{codepoints:[8857], characters:"\\u2299"}, "&circledR;":{codepoints:[174], characters:"\\u00AE"}, "&circledS;":{codepoints:[9416], characters:"\\u24C8"}, "&CircleMinus;":{codepoints:[8854], characters:"\\u2296"}, "&CirclePlus;":{codepoints:[8853], characters:"\\u2295"}, "&CircleTimes;":{codepoints:[8855], characters:"\\u2297"}, "&cir;":{codepoints:[9675], characters:"\\u25CB"}, "&cirE;":{codepoints:[10691], characters:"\\u29C3"}, "&cire;":{codepoints:[8791], characters:"\\u2257"}, "&cirfnint;":{codepoints:[10768], characters:"\\u2A10"}, "&cirmid;":{codepoints:[10991], characters:"\\u2AEF"}, "&cirscir;":{codepoints:[10690], characters:"\\u29C2"}, "&ClockwiseContourIntegral;":{codepoints:[8754], characters:"\\u2232"}, "&CloseCurlyDoubleQuote;":{codepoints:[8221], characters:"\\u201D"}, "&CloseCurlyQuote;":{codepoints:[8217], characters:"\\u2019"}, "&clubs;":{codepoints:[9827], characters:"\\u2663"}, "&clubsuit;":{codepoints:[9827], characters:"\\u2663"}, "&colon;":{codepoints:[58], characters:"\\u003A"}, "&Colon;":{codepoints:[8759], characters:"\\u2237"}, "&Colone;":{codepoints:[10868], characters:"\\u2A74"}, "&colone;":{codepoints:[8788], characters:"\\u2254"}, "&coloneq;":{codepoints:[8788], characters:"\\u2254"}, "&comma;":{codepoints:[44], characters:"\\u002C"}, "&commat;":{codepoints:[64], characters:"\\u0040"}, "&comp;":{codepoints:[8705], characters:"\\u2201"}, "&compfn;":{codepoints:[8728], characters:"\\u2218"}, "&complement;":{codepoints:[8705], characters:"\\u2201"}, "&complexes;":{codepoints:[8450], characters:"\\u2102"}, "&cong;":{codepoints:[8773], characters:"\\u2245"}, "&congdot;":{codepoints:[10861], characters:"\\u2A6D"}, "&Congruent;":{codepoints:[8801], characters:"\\u2261"}, "&conint;":{codepoints:[8750], characters:"\\u222E"}, "&Conint;":{codepoints:[8751], characters:"\\u222F"}, "&ContourIntegral;":{codepoints:[8750], characters:"\\u222E"}, "&copf;":{codepoints:[120148], characters:"\\uD835\\uDD54"}, "&Copf;":{codepoints:[8450], characters:"\\u2102"}, "&coprod;":{codepoints:[8720], characters:"\\u2210"}, "&Coproduct;":{codepoints:[8720], characters:"\\u2210"}, "&copy;":{codepoints:[169], characters:"\\u00A9"}, "&copy":{codepoints:[169], characters:"\\u00A9"}, "&COPY;":{codepoints:[169], characters:"\\u00A9"}, "&COPY":{codepoints:[169], characters:"\\u00A9"}, "&copysr;":{codepoints:[8471], characters:"\\u2117"}, "&CounterClockwiseContourIntegral;":{codepoints:[8755], characters:"\\u2233"}, "&crarr;":{codepoints:[8629], characters:"\\u21B5"}, "&cross;":{codepoints:[10007], characters:"\\u2717"}, "&Cross;":{codepoints:[10799], characters:"\\u2A2F"}, "&Cscr;":{codepoints:[119966], characters:"\\uD835\\uDC9E"}, "&cscr;":{codepoints:[119992], characters:"\\uD835\\uDCB8"}, "&csub;":{codepoints:[10959], characters:"\\u2ACF"}, "&csube;":{codepoints:[10961], characters:"\\u2AD1"}, "&csup;":{codepoints:[10960], characters:"\\u2AD0"}, "&csupe;":{codepoints:[10962], characters:"\\u2AD2"}, "&ctdot;":{codepoints:[8943], characters:"\\u22EF"}, "&cudarrl;":{codepoints:[10552], characters:"\\u2938"}, "&cudarrr;":{codepoints:[10549], characters:"\\u2935"}, "&cuepr;":{codepoints:[8926], characters:"\\u22DE"}, "&cuesc;":{codepoints:[8927], characters:"\\u22DF"}, "&cularr;":{codepoints:[8630], characters:"\\u21B6"}, "&cularrp;":{codepoints:[10557], characters:"\\u293D"}, "&cupbrcap;":{codepoints:[10824], characters:"\\u2A48"}, "&cupcap;":{codepoints:[10822], characters:"\\u2A46"}, "&CupCap;":{codepoints:[8781], characters:"\\u224D"}, "&cup;":{codepoints:[8746], characters:"\\u222A"}, "&Cup;":{codepoints:[8915], characters:"\\u22D3"}, "&cupcup;":{codepoints:[10826], characters:"\\u2A4A"}, "&cupdot;":{codepoints:[8845], characters:"\\u228D"}, "&cupor;":{codepoints:[10821], characters:"\\u2A45"}, "&cups;":{codepoints:[8746, 65024], characters:"\\u222A\\uFE00"}, "&curarr;":{codepoints:[8631], characters:"\\u21B7"}, "&curarrm;":{codepoints:[10556], characters:"\\u293C"}, "&curlyeqprec;":{codepoints:[8926], characters:"\\u22DE"}, "&curlyeqsucc;":{codepoints:[8927], characters:"\\u22DF"}, "&curlyvee;":{codepoints:[8910], characters:"\\u22CE"}, "&curlywedge;":{codepoints:[8911], characters:"\\u22CF"}, "&curren;":{codepoints:[164], characters:"\\u00A4"}, "&curren":{codepoints:[164], characters:"\\u00A4"}, "&curvearrowleft;":{codepoints:[8630], characters:"\\u21B6"}, "&curvearrowright;":{codepoints:[8631], characters:"\\u21B7"}, "&cuvee;":{codepoints:[8910], characters:"\\u22CE"}, "&cuwed;":{codepoints:[8911], characters:"\\u22CF"}, "&cwconint;":{codepoints:[8754], characters:"\\u2232"}, "&cwint;":{codepoints:[8753], characters:"\\u2231"}, "&cylcty;":{codepoints:[9005], characters:"\\u232D"}, "&dagger;":{codepoints:[8224], characters:"\\u2020"}, "&Dagger;":{codepoints:[8225], characters:"\\u2021"}, "&daleth;":{codepoints:[8504], characters:"\\u2138"}, "&darr;":{codepoints:[8595], characters:"\\u2193"}, "&Darr;":{codepoints:[8609], characters:"\\u21A1"}, "&dArr;":{codepoints:[8659], characters:"\\u21D3"}, "&dash;":{codepoints:[8208], characters:"\\u2010"}, "&Dashv;":{codepoints:[10980], characters:"\\u2AE4"}, "&dashv;":{codepoints:[8867], characters:"\\u22A3"}, "&dbkarow;":{codepoints:[10511], characters:"\\u290F"}, "&dblac;":{codepoints:[733], characters:"\\u02DD"}, "&Dcaron;":{codepoints:[270], characters:"\\u010E"}, "&dcaron;":{codepoints:[271], characters:"\\u010F"}, "&Dcy;":{codepoints:[1044], characters:"\\u0414"}, "&dcy;":{codepoints:[1076], characters:"\\u0434"}, "&ddagger;":{codepoints:[8225], characters:"\\u2021"}, "&ddarr;":{codepoints:[8650], characters:"\\u21CA"}, "&DD;":{codepoints:[8517], characters:"\\u2145"}, "&dd;":{codepoints:[8518], characters:"\\u2146"}, "&DDotrahd;":{codepoints:[10513], characters:"\\u2911"}, "&ddotseq;":{codepoints:[10871], characters:"\\u2A77"}, "&deg;":{codepoints:[176], characters:"\\u00B0"}, "&deg":{codepoints:[176], characters:"\\u00B0"}, "&Del;":{codepoints:[8711], characters:"\\u2207"}, "&Delta;":{codepoints:[916], characters:"\\u0394"}, "&delta;":{codepoints:[948], characters:"\\u03B4"}, "&demptyv;":{codepoints:[10673], characters:"\\u29B1"}, "&dfisht;":{codepoints:[10623], characters:"\\u297F"}, "&Dfr;":{codepoints:[120071], characters:"\\uD835\\uDD07"}, "&dfr;":{codepoints:[120097], characters:"\\uD835\\uDD21"}, "&dHar;":{codepoints:[10597], characters:"\\u2965"}, "&dharl;":{codepoints:[8643], characters:"\\u21C3"}, "&dharr;":{codepoints:[8642], characters:"\\u21C2"}, "&DiacriticalAcute;":{codepoints:[180], characters:"\\u00B4"}, "&DiacriticalDot;":{codepoints:[729], characters:"\\u02D9"}, "&DiacriticalDoubleAcute;":{codepoints:[733], characters:"\\u02DD"}, "&DiacriticalGrave;":{codepoints:[96], characters:"\\u0060"}, "&DiacriticalTilde;":{codepoints:[732], characters:"\\u02DC"}, "&diam;":{codepoints:[8900], characters:"\\u22C4"}, "&diamond;":{codepoints:[8900], characters:"\\u22C4"}, "&Diamond;":{codepoints:[8900], characters:"\\u22C4"}, "&diamondsuit;":{codepoints:[9830], characters:"\\u2666"}, "&diams;":{codepoints:[9830], characters:"\\u2666"}, "&die;":{codepoints:[168], characters:"\\u00A8"}, "&DifferentialD;":{codepoints:[8518], characters:"\\u2146"}, "&digamma;":{codepoints:[989], characters:"\\u03DD"}, "&disin;":{codepoints:[8946], characters:"\\u22F2"}, "&div;":{codepoints:[247], characters:"\\u00F7"}, "&divide;":{codepoints:[247], characters:"\\u00F7"}, "&divide":{codepoints:[247], characters:"\\u00F7"}, "&divideontimes;":{codepoints:[8903], characters:"\\u22C7"}, "&divonx;":{codepoints:[8903], characters:"\\u22C7"}, "&DJcy;":{codepoints:[1026], characters:"\\u0402"}, "&djcy;":{codepoints:[1106], characters:"\\u0452"}, "&dlcorn;":{codepoints:[8990], characters:"\\u231E"}, "&dlcrop;":{codepoints:[8973], characters:"\\u230D"}, "&dollar;":{codepoints:[36], characters:"\\u0024"}, "&Dopf;":{codepoints:[120123], characters:"\\uD835\\uDD3B"}, "&dopf;":{codepoints:[120149], characters:"\\uD835\\uDD55"}, "&Dot;":{codepoints:[168], characters:"\\u00A8"}, "&dot;":{codepoints:[729], characters:"\\u02D9"}, "&DotDot;":{codepoints:[8412], characters:"\\u20DC"}, "&doteq;":{codepoints:[8784], characters:"\\u2250"}, "&doteqdot;":{codepoints:[8785], characters:"\\u2251"}, "&DotEqual;":{codepoints:[8784], characters:"\\u2250"}, "&dotminus;":{codepoints:[8760], characters:"\\u2238"}, "&dotplus;":{codepoints:[8724], characters:"\\u2214"}, "&dotsquare;":{codepoints:[8865], characters:"\\u22A1"}, "&doublebarwedge;":{codepoints:[8966], characters:"\\u2306"}, "&DoubleContourIntegral;":{codepoints:[8751], characters:"\\u222F"}, "&DoubleDot;":{codepoints:[168], characters:"\\u00A8"}, "&DoubleDownArrow;":{codepoints:[8659], characters:"\\u21D3"}, "&DoubleLeftArrow;":{codepoints:[8656], characters:"\\u21D0"}, "&DoubleLeftRightArrow;":{codepoints:[8660], characters:"\\u21D4"}, "&DoubleLeftTee;":{codepoints:[10980], characters:"\\u2AE4"}, "&DoubleLongLeftArrow;":{codepoints:[10232], characters:"\\u27F8"}, "&DoubleLongLeftRightArrow;":{codepoints:[10234], characters:"\\u27FA"}, "&DoubleLongRightArrow;":{codepoints:[10233], characters:"\\u27F9"}, "&DoubleRightArrow;":{codepoints:[8658], characters:"\\u21D2"}, "&DoubleRightTee;":{codepoints:[8872], characters:"\\u22A8"}, "&DoubleUpArrow;":{codepoints:[8657], characters:"\\u21D1"}, "&DoubleUpDownArrow;":{codepoints:[8661], characters:"\\u21D5"}, "&DoubleVerticalBar;":{codepoints:[8741], characters:"\\u2225"}, "&DownArrowBar;":{codepoints:[10515], characters:"\\u2913"}, "&downarrow;":{codepoints:[8595], characters:"\\u2193"}, "&DownArrow;":{codepoints:[8595], characters:"\\u2193"}, "&Downarrow;":{codepoints:[8659], characters:"\\u21D3"}, "&DownArrowUpArrow;":{codepoints:[8693], characters:"\\u21F5"}, "&DownBreve;":{codepoints:[785], characters:"\\u0311"}, "&downdownarrows;":{codepoints:[8650], characters:"\\u21CA"}, "&downharpoonleft;":{codepoints:[8643], characters:"\\u21C3"}, "&downharpoonright;":{codepoints:[8642], characters:"\\u21C2"}, "&DownLeftRightVector;":{codepoints:[10576], characters:"\\u2950"}, "&DownLeftTeeVector;":{codepoints:[10590], characters:"\\u295E"}, "&DownLeftVectorBar;":{codepoints:[10582], characters:"\\u2956"}, "&DownLeftVector;":{codepoints:[8637], characters:"\\u21BD"}, "&DownRightTeeVector;":{codepoints:[10591], characters:"\\u295F"}, "&DownRightVectorBar;":{codepoints:[10583], characters:"\\u2957"}, "&DownRightVector;":{codepoints:[8641], characters:"\\u21C1"}, "&DownTeeArrow;":{codepoints:[8615], characters:"\\u21A7"}, "&DownTee;":{codepoints:[8868], characters:"\\u22A4"}, "&drbkarow;":{codepoints:[10512], characters:"\\u2910"}, "&drcorn;":{codepoints:[8991], characters:"\\u231F"}, "&drcrop;":{codepoints:[8972], characters:"\\u230C"}, "&Dscr;":{codepoints:[119967], characters:"\\uD835\\uDC9F"}, "&dscr;":{codepoints:[119993], characters:"\\uD835\\uDCB9"}, "&DScy;":{codepoints:[1029], characters:"\\u0405"}, "&dscy;":{codepoints:[1109], characters:"\\u0455"}, "&dsol;":{codepoints:[10742], characters:"\\u29F6"}, "&Dstrok;":{codepoints:[272], characters:"\\u0110"}, "&dstrok;":{codepoints:[273], characters:"\\u0111"}, "&dtdot;":{codepoints:[8945], characters:"\\u22F1"}, "&dtri;":{codepoints:[9663], characters:"\\u25BF"}, "&dtrif;":{codepoints:[9662], characters:"\\u25BE"}, "&duarr;":{codepoints:[8693], characters:"\\u21F5"}, "&duhar;":{codepoints:[10607], characters:"\\u296F"}, "&dwangle;":{codepoints:[10662], characters:"\\u29A6"}, "&DZcy;":{codepoints:[1039], characters:"\\u040F"}, "&dzcy;":{codepoints:[1119], characters:"\\u045F"}, "&dzigrarr;":{codepoints:[10239], characters:"\\u27FF"}, "&Eacute;":{codepoints:[201], characters:"\\u00C9"}, "&Eacute":{codepoints:[201], characters:"\\u00C9"}, "&eacute;":{codepoints:[233], characters:"\\u00E9"}, "&eacute":{codepoints:[233], characters:"\\u00E9"}, "&easter;":{codepoints:[10862], characters:"\\u2A6E"}, "&Ecaron;":{codepoints:[282], characters:"\\u011A"}, "&ecaron;":{codepoints:[283], characters:"\\u011B"}, "&Ecirc;":{codepoints:[202], characters:"\\u00CA"}, "&Ecirc":{codepoints:[202], characters:"\\u00CA"}, "&ecirc;":{codepoints:[234], characters:"\\u00EA"}, "&ecirc":{codepoints:[234], characters:"\\u00EA"}, "&ecir;":{codepoints:[8790], characters:"\\u2256"}, "&ecolon;":{codepoints:[8789], characters:"\\u2255"}, "&Ecy;":{codepoints:[1069], characters:"\\u042D"}, "&ecy;":{codepoints:[1101], characters:"\\u044D"}, "&eDDot;":{codepoints:[10871], characters:"\\u2A77"}, "&Edot;":{codepoints:[278], characters:"\\u0116"}, "&edot;":{codepoints:[279], characters:"\\u0117"}, "&eDot;":{codepoints:[8785], characters:"\\u2251"}, "&ee;":{codepoints:[8519], characters:"\\u2147"}, "&efDot;":{codepoints:[8786], characters:"\\u2252"}, "&Efr;":{codepoints:[120072], characters:"\\uD835\\uDD08"}, "&efr;":{codepoints:[120098], characters:"\\uD835\\uDD22"}, "&eg;":{codepoints:[10906], characters:"\\u2A9A"}, "&Egrave;":{codepoints:[200], characters:"\\u00C8"}, "&Egrave":{codepoints:[200], characters:"\\u00C8"}, "&egrave;":{codepoints:[232], characters:"\\u00E8"}, "&egrave":{codepoints:[232], characters:"\\u00E8"}, "&egs;":{codepoints:[10902], characters:"\\u2A96"}, "&egsdot;":{codepoints:[10904], characters:"\\u2A98"}, "&el;":{codepoints:[10905], characters:"\\u2A99"}, "&Element;":{codepoints:[8712], characters:"\\u2208"}, "&elinters;":{codepoints:[9191], characters:"\\u23E7"}, "&ell;":{codepoints:[8467], characters:"\\u2113"}, "&els;":{codepoints:[10901], characters:"\\u2A95"}, "&elsdot;":{codepoints:[10903], characters:"\\u2A97"}, "&Emacr;":{codepoints:[274], characters:"\\u0112"}, "&emacr;":{codepoints:[275], characters:"\\u0113"}, "&empty;":{codepoints:[8709], characters:"\\u2205"}, "&emptyset;":{codepoints:[8709], characters:"\\u2205"}, "&EmptySmallSquare;":{codepoints:[9723], characters:"\\u25FB"}, "&emptyv;":{codepoints:[8709], characters:"\\u2205"}, "&EmptyVerySmallSquare;":{codepoints:[9643], characters:"\\u25AB"}, "&emsp13;":{codepoints:[8196], characters:"\\u2004"}, "&emsp14;":{codepoints:[8197], characters:"\\u2005"}, "&emsp;":{codepoints:[8195], characters:"\\u2003"}, "&ENG;":{codepoints:[330], characters:"\\u014A"}, "&eng;":{codepoints:[331], characters:"\\u014B"}, "&ensp;":{codepoints:[8194], characters:"\\u2002"}, "&Eogon;":{codepoints:[280], characters:"\\u0118"}, "&eogon;":{codepoints:[281], characters:"\\u0119"}, "&Eopf;":{codepoints:[120124], characters:"\\uD835\\uDD3C"}, "&eopf;":{codepoints:[120150], characters:"\\uD835\\uDD56"}, "&epar;":{codepoints:[8917], characters:"\\u22D5"}, "&eparsl;":{codepoints:[10723], characters:"\\u29E3"}, "&eplus;":{codepoints:[10865], characters:"\\u2A71"}, "&epsi;":{codepoints:[949], characters:"\\u03B5"}, "&Epsilon;":{codepoints:[917], characters:"\\u0395"}, "&epsilon;":{codepoints:[949], characters:"\\u03B5"}, "&epsiv;":{codepoints:[1013], characters:"\\u03F5"}, "&eqcirc;":{codepoints:[8790], characters:"\\u2256"}, "&eqcolon;":{codepoints:[8789], characters:"\\u2255"}, "&eqsim;":{codepoints:[8770], characters:"\\u2242"}, "&eqslantgtr;":{codepoints:[10902], characters:"\\u2A96"}, "&eqslantless;":{codepoints:[10901], characters:"\\u2A95"}, "&Equal;":{codepoints:[10869], characters:"\\u2A75"}, "&equals;":{codepoints:[61], characters:"\\u003D"}, "&EqualTilde;":{codepoints:[8770], characters:"\\u2242"}, "&equest;":{codepoints:[8799], characters:"\\u225F"}, "&Equilibrium;":{codepoints:[8652], characters:"\\u21CC"}, "&equiv;":{codepoints:[8801], characters:"\\u2261"}, "&equivDD;":{codepoints:[10872], characters:"\\u2A78"}, "&eqvparsl;":{codepoints:[10725], characters:"\\u29E5"}, "&erarr;":{codepoints:[10609], characters:"\\u2971"}, "&erDot;":{codepoints:[8787], characters:"\\u2253"}, "&escr;":{codepoints:[8495], characters:"\\u212F"}, "&Escr;":{codepoints:[8496], characters:"\\u2130"}, "&esdot;":{codepoints:[8784], characters:"\\u2250"}, "&Esim;":{codepoints:[10867], characters:"\\u2A73"}, "&esim;":{codepoints:[8770], characters:"\\u2242"}, "&Eta;":{codepoints:[919], characters:"\\u0397"}, "&eta;":{codepoints:[951], characters:"\\u03B7"}, "&ETH;":{codepoints:[208], characters:"\\u00D0"}, "&ETH":{codepoints:[208], characters:"\\u00D0"}, "&eth;":{codepoints:[240], characters:"\\u00F0"}, "&eth":{codepoints:[240], characters:"\\u00F0"}, "&Euml;":{codepoints:[203], characters:"\\u00CB"}, "&Euml":{codepoints:[203], characters:"\\u00CB"}, "&euml;":{codepoints:[235], characters:"\\u00EB"}, "&euml":{codepoints:[235], characters:"\\u00EB"}, "&euro;":{codepoints:[8364], characters:"\\u20AC"}, "&excl;":{codepoints:[33], characters:"\\u0021"}, "&exist;":{codepoints:[8707], characters:"\\u2203"}, "&Exists;":{codepoints:[8707], characters:"\\u2203"}, "&expectation;":{codepoints:[8496], characters:"\\u2130"}, "&exponentiale;":{codepoints:[8519], characters:"\\u2147"}, "&ExponentialE;":{codepoints:[8519], characters:"\\u2147"}, "&fallingdotseq;":{codepoints:[8786], characters:"\\u2252"}, "&Fcy;":{codepoints:[1060], characters:"\\u0424"}, "&fcy;":{codepoints:[1092], characters:"\\u0444"}, "&female;":{codepoints:[9792], characters:"\\u2640"}, "&ffilig;":{codepoints:[64259], characters:"\\uFB03"}, "&fflig;":{codepoints:[64256], characters:"\\uFB00"}, "&ffllig;":{codepoints:[64260], characters:"\\uFB04"}, "&Ffr;":{codepoints:[120073], characters:"\\uD835\\uDD09"}, "&ffr;":{codepoints:[120099], characters:"\\uD835\\uDD23"}, "&filig;":{codepoints:[64257], characters:"\\uFB01"}, "&FilledSmallSquare;":{codepoints:[9724], characters:"\\u25FC"}, "&FilledVerySmallSquare;":{codepoints:[9642], characters:"\\u25AA"}, "&fjlig;":{codepoints:[102, 106], characters:"\\u0066\\u006A"}, "&flat;":{codepoints:[9837], characters:"\\u266D"}, "&fllig;":{codepoints:[64258], characters:"\\uFB02"}, "&fltns;":{codepoints:[9649], characters:"\\u25B1"}, "&fnof;":{codepoints:[402], characters:"\\u0192"}, "&Fopf;":{codepoints:[120125], characters:"\\uD835\\uDD3D"}, "&fopf;":{codepoints:[120151], characters:"\\uD835\\uDD57"}, "&forall;":{codepoints:[8704], characters:"\\u2200"}, "&ForAll;":{codepoints:[8704], characters:"\\u2200"}, "&fork;":{codepoints:[8916], characters:"\\u22D4"}, "&forkv;":{codepoints:[10969], characters:"\\u2AD9"}, "&Fouriertrf;":{codepoints:[8497], characters:"\\u2131"}, "&fpartint;":{codepoints:[10765], characters:"\\u2A0D"}, "&frac12;":{codepoints:[189], characters:"\\u00BD"}, "&frac12":{codepoints:[189], characters:"\\u00BD"}, "&frac13;":{codepoints:[8531], characters:"\\u2153"}, "&frac14;":{codepoints:[188], characters:"\\u00BC"}, "&frac14":{codepoints:[188], characters:"\\u00BC"}, "&frac15;":{codepoints:[8533], characters:"\\u2155"}, "&frac16;":{codepoints:[8537], characters:"\\u2159"}, "&frac18;":{codepoints:[8539], characters:"\\u215B"}, "&frac23;":{codepoints:[8532], characters:"\\u2154"}, "&frac25;":{codepoints:[8534], characters:"\\u2156"}, "&frac34;":{codepoints:[190], characters:"\\u00BE"}, "&frac34":{codepoints:[190], characters:"\\u00BE"}, "&frac35;":{codepoints:[8535], characters:"\\u2157"}, "&frac38;":{codepoints:[8540], characters:"\\u215C"}, "&frac45;":{codepoints:[8536], characters:"\\u2158"}, "&frac56;":{codepoints:[8538], characters:"\\u215A"}, "&frac58;":{codepoints:[8541], characters:"\\u215D"}, "&frac78;":{codepoints:[8542], characters:"\\u215E"}, "&frasl;":{codepoints:[8260], characters:"\\u2044"}, "&frown;":{codepoints:[8994], characters:"\\u2322"}, "&fscr;":{codepoints:[119995], characters:"\\uD835\\uDCBB"}, "&Fscr;":{codepoints:[8497], characters:"\\u2131"}, "&gacute;":{codepoints:[501], characters:"\\u01F5"}, "&Gamma;":{codepoints:[915], characters:"\\u0393"}, "&gamma;":{codepoints:[947], characters:"\\u03B3"}, "&Gammad;":{codepoints:[988], characters:"\\u03DC"}, "&gammad;":{codepoints:[989], characters:"\\u03DD"}, "&gap;":{codepoints:[10886], characters:"\\u2A86"}, "&Gbreve;":{codepoints:[286], characters:"\\u011E"}, "&gbreve;":{codepoints:[287], characters:"\\u011F"}, "&Gcedil;":{codepoints:[290], characters:"\\u0122"}, "&Gcirc;":{codepoints:[284], characters:"\\u011C"}, "&gcirc;":{codepoints:[285], characters:"\\u011D"}, "&Gcy;":{codepoints:[1043], characters:"\\u0413"}, "&gcy;":{codepoints:[1075], characters:"\\u0433"}, "&Gdot;":{codepoints:[288], characters:"\\u0120"}, "&gdot;":{codepoints:[289], characters:"\\u0121"}, "&ge;":{codepoints:[8805], characters:"\\u2265"}, "&gE;":{codepoints:[8807], characters:"\\u2267"}, "&gEl;":{codepoints:[10892], characters:"\\u2A8C"}, "&gel;":{codepoints:[8923], characters:"\\u22DB"}, "&geq;":{codepoints:[8805], characters:"\\u2265"}, "&geqq;":{codepoints:[8807], characters:"\\u2267"}, "&geqslant;":{codepoints:[10878], characters:"\\u2A7E"}, "&gescc;":{codepoints:[10921], characters:"\\u2AA9"}, "&ges;":{codepoints:[10878], characters:"\\u2A7E"}, "&gesdot;":{codepoints:[10880], characters:"\\u2A80"}, "&gesdoto;":{codepoints:[10882], characters:"\\u2A82"}, "&gesdotol;":{codepoints:[10884], characters:"\\u2A84"}, "&gesl;":{codepoints:[8923, 65024], characters:"\\u22DB\\uFE00"}, "&gesles;":{codepoints:[10900], characters:"\\u2A94"}, "&Gfr;":{codepoints:[120074], characters:"\\uD835\\uDD0A"}, "&gfr;":{codepoints:[120100], characters:"\\uD835\\uDD24"}, "&gg;":{codepoints:[8811], characters:"\\u226B"}, "&Gg;":{codepoints:[8921], characters:"\\u22D9"}, "&ggg;":{codepoints:[8921], characters:"\\u22D9"}, "&gimel;":{codepoints:[8503], characters:"\\u2137"}, "&GJcy;":{codepoints:[1027], characters:"\\u0403"}, "&gjcy;":{codepoints:[1107], characters:"\\u0453"}, "&gla;":{codepoints:[10917], characters:"\\u2AA5"}, "&gl;":{codepoints:[8823], characters:"\\u2277"}, "&glE;":{codepoints:[10898], characters:"\\u2A92"}, "&glj;":{codepoints:[10916], characters:"\\u2AA4"}, "&gnap;":{codepoints:[10890], characters:"\\u2A8A"}, "&gnapprox;":{codepoints:[10890], characters:"\\u2A8A"}, "&gne;":{codepoints:[10888], characters:"\\u2A88"}, "&gnE;":{codepoints:[8809], characters:"\\u2269"}, "&gneq;":{codepoints:[10888], characters:"\\u2A88"}, "&gneqq;":{codepoints:[8809], characters:"\\u2269"}, "&gnsim;":{codepoints:[8935], characters:"\\u22E7"}, "&Gopf;":{codepoints:[120126], characters:"\\uD835\\uDD3E"}, "&gopf;":{codepoints:[120152], characters:"\\uD835\\uDD58"}, "&grave;":{codepoints:[96], characters:"\\u0060"}, "&GreaterEqual;":{codepoints:[8805], characters:"\\u2265"}, "&GreaterEqualLess;":{codepoints:[8923], characters:"\\u22DB"}, "&GreaterFullEqual;":{codepoints:[8807], characters:"\\u2267"}, "&GreaterGreater;":{codepoints:[10914], characters:"\\u2AA2"}, "&GreaterLess;":{codepoints:[8823], characters:"\\u2277"}, "&GreaterSlantEqual;":{codepoints:[10878], characters:"\\u2A7E"}, "&GreaterTilde;":{codepoints:[8819], characters:"\\u2273"}, "&Gscr;":{codepoints:[119970], characters:"\\uD835\\uDCA2"}, "&gscr;":{codepoints:[8458], characters:"\\u210A"}, "&gsim;":{codepoints:[8819], characters:"\\u2273"}, "&gsime;":{codepoints:[10894], characters:"\\u2A8E"}, "&gsiml;":{codepoints:[10896], characters:"\\u2A90"}, "&gtcc;":{codepoints:[10919], characters:"\\u2AA7"}, "&gtcir;":{codepoints:[10874], characters:"\\u2A7A"}, "&gt;":{codepoints:[62], characters:"\\u003E"}, "&gt":{codepoints:[62], characters:"\\u003E"}, "&GT;":{codepoints:[62], characters:"\\u003E"}, "&GT":{codepoints:[62], characters:"\\u003E"}, "&Gt;":{codepoints:[8811], characters:"\\u226B"}, "&gtdot;":{codepoints:[8919], characters:"\\u22D7"}, "&gtlPar;":{codepoints:[10645], characters:"\\u2995"}, "&gtquest;":{codepoints:[10876], characters:"\\u2A7C"}, "&gtrapprox;":{codepoints:[10886], characters:"\\u2A86"}, "&gtrarr;":{codepoints:[10616], characters:"\\u2978"}, "&gtrdot;":{codepoints:[8919], characters:"\\u22D7"}, "&gtreqless;":{codepoints:[8923], characters:"\\u22DB"}, "&gtreqqless;":{codepoints:[10892], characters:"\\u2A8C"}, "&gtrless;":{codepoints:[8823], characters:"\\u2277"}, "&gtrsim;":{codepoints:[8819], characters:"\\u2273"}, "&gvertneqq;":{codepoints:[8809, 65024], characters:"\\u2269\\uFE00"}, "&gvnE;":{codepoints:[8809, 65024], characters:"\\u2269\\uFE00"}, "&Hacek;":{codepoints:[711], characters:"\\u02C7"}, "&hairsp;":{codepoints:[8202], characters:"\\u200A"}, "&half;":{codepoints:[189], characters:"\\u00BD"}, "&hamilt;":{codepoints:[8459], characters:"\\u210B"}, "&HARDcy;":{codepoints:[1066], characters:"\\u042A"}, "&hardcy;":{codepoints:[1098], characters:"\\u044A"}, "&harrcir;":{codepoints:[10568], characters:"\\u2948"}, "&harr;":{codepoints:[8596], characters:"\\u2194"}, "&hArr;":{codepoints:[8660], characters:"\\u21D4"}, "&harrw;":{codepoints:[8621], characters:"\\u21AD"}, "&Hat;":{codepoints:[94], characters:"\\u005E"}, "&hbar;":{codepoints:[8463], characters:"\\u210F"}, "&Hcirc;":{codepoints:[292], characters:"\\u0124"}, "&hcirc;":{codepoints:[293], characters:"\\u0125"}, "&hearts;":{codepoints:[9829], characters:"\\u2665"}, "&heartsuit;":{codepoints:[9829], characters:"\\u2665"}, "&hellip;":{codepoints:[8230], characters:"\\u2026"}, "&hercon;":{codepoints:[8889], characters:"\\u22B9"}, "&hfr;":{codepoints:[120101], characters:"\\uD835\\uDD25"}, "&Hfr;":{codepoints:[8460], characters:"\\u210C"}, "&HilbertSpace;":{codepoints:[8459], characters:"\\u210B"}, "&hksearow;":{codepoints:[10533], characters:"\\u2925"}, "&hkswarow;":{codepoints:[10534], characters:"\\u2926"}, "&hoarr;":{codepoints:[8703], characters:"\\u21FF"}, "&homtht;":{codepoints:[8763], characters:"\\u223B"}, "&hookleftarrow;":{codepoints:[8617], characters:"\\u21A9"}, "&hookrightarrow;":{codepoints:[8618], characters:"\\u21AA"}, "&hopf;":{codepoints:[120153], characters:"\\uD835\\uDD59"}, "&Hopf;":{codepoints:[8461], characters:"\\u210D"}, "&horbar;":{codepoints:[8213], characters:"\\u2015"}, "&HorizontalLine;":{codepoints:[9472], characters:"\\u2500"}, "&hscr;":{codepoints:[119997], characters:"\\uD835\\uDCBD"}, "&Hscr;":{codepoints:[8459], characters:"\\u210B"}, "&hslash;":{codepoints:[8463], characters:"\\u210F"}, "&Hstrok;":{codepoints:[294], characters:"\\u0126"}, "&hstrok;":{codepoints:[295], characters:"\\u0127"}, "&HumpDownHump;":{codepoints:[8782], characters:"\\u224E"}, "&HumpEqual;":{codepoints:[8783], characters:"\\u224F"}, "&hybull;":{codepoints:[8259], characters:"\\u2043"}, "&hyphen;":{codepoints:[8208], characters:"\\u2010"}, "&Iacute;":{codepoints:[205], characters:"\\u00CD"}, "&Iacute":{codepoints:[205], characters:"\\u00CD"}, "&iacute;":{codepoints:[237], characters:"\\u00ED"}, "&iacute":{codepoints:[237], characters:"\\u00ED"}, "&ic;":{codepoints:[8291], characters:"\\u2063"}, "&Icirc;":{codepoints:[206], characters:"\\u00CE"}, "&Icirc":{codepoints:[206], characters:"\\u00CE"}, "&icirc;":{codepoints:[238], characters:"\\u00EE"}, "&icirc":{codepoints:[238], characters:"\\u00EE"}, "&Icy;":{codepoints:[1048], characters:"\\u0418"}, "&icy;":{codepoints:[1080], characters:"\\u0438"}, "&Idot;":{codepoints:[304], characters:"\\u0130"}, "&IEcy;":{codepoints:[1045], characters:"\\u0415"}, "&iecy;":{codepoints:[1077], characters:"\\u0435"}, "&iexcl;":{codepoints:[161], characters:"\\u00A1"}, "&iexcl":{codepoints:[161], characters:"\\u00A1"}, "&iff;":{codepoints:[8660], characters:"\\u21D4"}, "&ifr;":{codepoints:[120102], characters:"\\uD835\\uDD26"}, "&Ifr;":{codepoints:[8465], characters:"\\u2111"}, "&Igrave;":{codepoints:[204], characters:"\\u00CC"}, "&Igrave":{codepoints:[204], characters:"\\u00CC"}, "&igrave;":{codepoints:[236], characters:"\\u00EC"}, "&igrave":{codepoints:[236], characters:"\\u00EC"}, "&ii;":{codepoints:[8520], characters:"\\u2148"}, "&iiiint;":{codepoints:[10764], characters:"\\u2A0C"}, "&iiint;":{codepoints:[8749], characters:"\\u222D"}, "&iinfin;":{codepoints:[10716], characters:"\\u29DC"}, "&iiota;":{codepoints:[8489], characters:"\\u2129"}, "&IJlig;":{codepoints:[306], characters:"\\u0132"}, "&ijlig;":{codepoints:[307], characters:"\\u0133"}, "&Imacr;":{codepoints:[298], characters:"\\u012A"}, "&imacr;":{codepoints:[299], characters:"\\u012B"}, "&image;":{codepoints:[8465], characters:"\\u2111"}, "&ImaginaryI;":{codepoints:[8520], characters:"\\u2148"}, "&imagline;":{codepoints:[8464], characters:"\\u2110"}, "&imagpart;":{codepoints:[8465], characters:"\\u2111"}, "&imath;":{codepoints:[305], characters:"\\u0131"}, "&Im;":{codepoints:[8465], characters:"\\u2111"}, "&imof;":{codepoints:[8887], characters:"\\u22B7"}, "&imped;":{codepoints:[437], characters:"\\u01B5"}, "&Implies;":{codepoints:[8658], characters:"\\u21D2"}, "&incare;":{codepoints:[8453], characters:"\\u2105"}, "&in;":{codepoints:[8712], characters:"\\u2208"}, "&infin;":{codepoints:[8734], characters:"\\u221E"}, "&infintie;":{codepoints:[10717], characters:"\\u29DD"}, "&inodot;":{codepoints:[305], characters:"\\u0131"}, "&intcal;":{codepoints:[8890], characters:"\\u22BA"}, "&int;":{codepoints:[8747], characters:"\\u222B"}, "&Int;":{codepoints:[8748], characters:"\\u222C"}, "&integers;":{codepoints:[8484], characters:"\\u2124"}, "&Integral;":{codepoints:[8747], characters:"\\u222B"}, "&intercal;":{codepoints:[8890], characters:"\\u22BA"}, "&Intersection;":{codepoints:[8898], characters:"\\u22C2"}, "&intlarhk;":{codepoints:[10775], characters:"\\u2A17"}, "&intprod;":{codepoints:[10812], characters:"\\u2A3C"}, "&InvisibleComma;":{codepoints:[8291], characters:"\\u2063"}, "&InvisibleTimes;":{codepoints:[8290], characters:"\\u2062"}, "&IOcy;":{codepoints:[1025], characters:"\\u0401"}, "&iocy;":{codepoints:[1105], characters:"\\u0451"}, "&Iogon;":{codepoints:[302], characters:"\\u012E"}, "&iogon;":{codepoints:[303], characters:"\\u012F"}, "&Iopf;":{codepoints:[120128], characters:"\\uD835\\uDD40"}, "&iopf;":{codepoints:[120154], characters:"\\uD835\\uDD5A"}, "&Iota;":{codepoints:[921], characters:"\\u0399"}, "&iota;":{codepoints:[953], characters:"\\u03B9"}, "&iprod;":{codepoints:[10812], characters:"\\u2A3C"}, "&iquest;":{codepoints:[191], characters:"\\u00BF"}, "&iquest":{codepoints:[191], characters:"\\u00BF"}, "&iscr;":{codepoints:[119998], characters:"\\uD835\\uDCBE"}, "&Iscr;":{codepoints:[8464], characters:"\\u2110"}, "&isin;":{codepoints:[8712], characters:"\\u2208"}, "&isindot;":{codepoints:[8949], characters:"\\u22F5"}, "&isinE;":{codepoints:[8953], characters:"\\u22F9"}, "&isins;":{codepoints:[8948], characters:"\\u22F4"}, "&isinsv;":{codepoints:[8947], characters:"\\u22F3"}, "&isinv;":{codepoints:[8712], characters:"\\u2208"}, "&it;":{codepoints:[8290], characters:"\\u2062"}, "&Itilde;":{codepoints:[296], characters:"\\u0128"}, "&itilde;":{codepoints:[297], characters:"\\u0129"}, "&Iukcy;":{codepoints:[1030], characters:"\\u0406"}, "&iukcy;":{codepoints:[1110], characters:"\\u0456"}, "&Iuml;":{codepoints:[207], characters:"\\u00CF"}, "&Iuml":{codepoints:[207], characters:"\\u00CF"}, "&iuml;":{codepoints:[239], characters:"\\u00EF"}, "&iuml":{codepoints:[239], characters:"\\u00EF"}, "&Jcirc;":{codepoints:[308], characters:"\\u0134"}, "&jcirc;":{codepoints:[309], characters:"\\u0135"}, "&Jcy;":{codepoints:[1049], characters:"\\u0419"}, "&jcy;":{codepoints:[1081], characters:"\\u0439"}, "&Jfr;":{codepoints:[120077], characters:"\\uD835\\uDD0D"}, "&jfr;":{codepoints:[120103], characters:"\\uD835\\uDD27"}, "&jmath;":{codepoints:[567], characters:"\\u0237"}, "&Jopf;":{codepoints:[120129], characters:"\\uD835\\uDD41"}, "&jopf;":{codepoints:[120155], characters:"\\uD835\\uDD5B"}, "&Jscr;":{codepoints:[119973], characters:"\\uD835\\uDCA5"}, "&jscr;":{codepoints:[119999], characters:"\\uD835\\uDCBF"}, "&Jsercy;":{codepoints:[1032], characters:"\\u0408"}, "&jsercy;":{codepoints:[1112], characters:"\\u0458"}, "&Jukcy;":{codepoints:[1028], characters:"\\u0404"}, "&jukcy;":{codepoints:[1108], characters:"\\u0454"}, "&Kappa;":{codepoints:[922], characters:"\\u039A"}, "&kappa;":{codepoints:[954], characters:"\\u03BA"}, "&kappav;":{codepoints:[1008], characters:"\\u03F0"}, "&Kcedil;":{codepoints:[310], characters:"\\u0136"}, "&kcedil;":{codepoints:[311], characters:"\\u0137"}, "&Kcy;":{codepoints:[1050], characters:"\\u041A"}, "&kcy;":{codepoints:[1082], characters:"\\u043A"}, "&Kfr;":{codepoints:[120078], characters:"\\uD835\\uDD0E"}, "&kfr;":{codepoints:[120104], characters:"\\uD835\\uDD28"}, "&kgreen;":{codepoints:[312], characters:"\\u0138"}, "&KHcy;":{codepoints:[1061], characters:"\\u0425"}, "&khcy;":{codepoints:[1093], characters:"\\u0445"}, "&KJcy;":{codepoints:[1036], characters:"\\u040C"}, "&kjcy;":{codepoints:[1116], characters:"\\u045C"}, "&Kopf;":{codepoints:[120130], characters:"\\uD835\\uDD42"}, "&kopf;":{codepoints:[120156], characters:"\\uD835\\uDD5C"}, "&Kscr;":{codepoints:[119974], characters:"\\uD835\\uDCA6"}, "&kscr;":{codepoints:[120000], characters:"\\uD835\\uDCC0"}, "&lAarr;":{codepoints:[8666], characters:"\\u21DA"}, "&Lacute;":{codepoints:[313], characters:"\\u0139"}, "&lacute;":{codepoints:[314], characters:"\\u013A"}, "&laemptyv;":{codepoints:[10676], characters:"\\u29B4"}, "&lagran;":{codepoints:[8466], characters:"\\u2112"}, "&Lambda;":{codepoints:[923], characters:"\\u039B"}, "&lambda;":{codepoints:[955], characters:"\\u03BB"}, "&lang;":{codepoints:[10216], characters:"\\u27E8"}, "&Lang;":{codepoints:[10218], characters:"\\u27EA"}, "&langd;":{codepoints:[10641], characters:"\\u2991"}, "&langle;":{codepoints:[10216], characters:"\\u27E8"}, "&lap;":{codepoints:[10885], characters:"\\u2A85"}, "&Laplacetrf;":{codepoints:[8466], characters:"\\u2112"}, "&laquo;":{codepoints:[171], characters:"\\u00AB"}, "&laquo":{codepoints:[171], characters:"\\u00AB"}, "&larrb;":{codepoints:[8676], characters:"\\u21E4"}, "&larrbfs;":{codepoints:[10527], characters:"\\u291F"}, "&larr;":{codepoints:[8592], characters:"\\u2190"}, "&Larr;":{codepoints:[8606], characters:"\\u219E"}, "&lArr;":{codepoints:[8656], characters:"\\u21D0"}, "&larrfs;":{codepoints:[10525], characters:"\\u291D"}, "&larrhk;":{codepoints:[8617], characters:"\\u21A9"}, "&larrlp;":{codepoints:[8619], characters:"\\u21AB"}, "&larrpl;":{codepoints:[10553], characters:"\\u2939"}, "&larrsim;":{codepoints:[10611], characters:"\\u2973"}, "&larrtl;":{codepoints:[8610], characters:"\\u21A2"}, "&latail;":{codepoints:[10521], characters:"\\u2919"}, "&lAtail;":{codepoints:[10523], characters:"\\u291B"}, "&lat;":{codepoints:[10923], characters:"\\u2AAB"}, "&late;":{codepoints:[10925], characters:"\\u2AAD"}, "&lates;":{codepoints:[10925, 65024], characters:"\\u2AAD\\uFE00"}, "&lbarr;":{codepoints:[10508], characters:"\\u290C"}, "&lBarr;":{codepoints:[10510], characters:"\\u290E"}, "&lbbrk;":{codepoints:[10098], characters:"\\u2772"}, "&lbrace;":{codepoints:[123], characters:"\\u007B"}, "&lbrack;":{codepoints:[91], characters:"\\u005B"}, "&lbrke;":{codepoints:[10635], characters:"\\u298B"}, "&lbrksld;":{codepoints:[10639], characters:"\\u298F"}, "&lbrkslu;":{codepoints:[10637], characters:"\\u298D"}, "&Lcaron;":{codepoints:[317], characters:"\\u013D"}, "&lcaron;":{codepoints:[318], characters:"\\u013E"}, "&Lcedil;":{codepoints:[315], characters:"\\u013B"}, "&lcedil;":{codepoints:[316], characters:"\\u013C"}, "&lceil;":{codepoints:[8968], characters:"\\u2308"}, "&lcub;":{codepoints:[123], characters:"\\u007B"}, "&Lcy;":{codepoints:[1051], characters:"\\u041B"}, "&lcy;":{codepoints:[1083], characters:"\\u043B"}, "&ldca;":{codepoints:[10550], characters:"\\u2936"}, "&ldquo;":{codepoints:[8220], characters:"\\u201C"}, "&ldquor;":{codepoints:[8222], characters:"\\u201E"}, "&ldrdhar;":{codepoints:[10599], characters:"\\u2967"}, "&ldrushar;":{codepoints:[10571], characters:"\\u294B"}, "&ldsh;":{codepoints:[8626], characters:"\\u21B2"}, "&le;":{codepoints:[8804], characters:"\\u2264"}, "&lE;":{codepoints:[8806], characters:"\\u2266"}, "&LeftAngleBracket;":{codepoints:[10216], characters:"\\u27E8"}, "&LeftArrowBar;":{codepoints:[8676], characters:"\\u21E4"}, "&leftarrow;":{codepoints:[8592], characters:"\\u2190"}, "&LeftArrow;":{codepoints:[8592], characters:"\\u2190"}, "&Leftarrow;":{codepoints:[8656], characters:"\\u21D0"}, "&LeftArrowRightArrow;":{codepoints:[8646], characters:"\\u21C6"}, "&leftarrowtail;":{codepoints:[8610], characters:"\\u21A2"}, "&LeftCeiling;":{codepoints:[8968], characters:"\\u2308"}, "&LeftDoubleBracket;":{codepoints:[10214], characters:"\\u27E6"}, "&LeftDownTeeVector;":{codepoints:[10593], characters:"\\u2961"}, "&LeftDownVectorBar;":{codepoints:[10585], characters:"\\u2959"}, "&LeftDownVector;":{codepoints:[8643], characters:"\\u21C3"}, "&LeftFloor;":{codepoints:[8970], characters:"\\u230A"}, "&leftharpoondown;":{codepoints:[8637], characters:"\\u21BD"}, "&leftharpoonup;":{codepoints:[8636], characters:"\\u21BC"}, "&leftleftarrows;":{codepoints:[8647], characters:"\\u21C7"}, "&leftrightarrow;":{codepoints:[8596], characters:"\\u2194"}, "&LeftRightArrow;":{codepoints:[8596], characters:"\\u2194"}, "&Leftrightarrow;":{codepoints:[8660], characters:"\\u21D4"}, "&leftrightarrows;":{codepoints:[8646], characters:"\\u21C6"}, "&leftrightharpoons;":{codepoints:[8651], characters:"\\u21CB"}, "&leftrightsquigarrow;":{codepoints:[8621], characters:"\\u21AD"}, "&LeftRightVector;":{codepoints:[10574], characters:"\\u294E"}, "&LeftTeeArrow;":{codepoints:[8612], characters:"\\u21A4"}, "&LeftTee;":{codepoints:[8867], characters:"\\u22A3"}, "&LeftTeeVector;":{codepoints:[10586], characters:"\\u295A"}, "&leftthreetimes;":{codepoints:[8907], characters:"\\u22CB"}, "&LeftTriangleBar;":{codepoints:[10703], characters:"\\u29CF"}, "&LeftTriangle;":{codepoints:[8882], characters:"\\u22B2"}, "&LeftTriangleEqual;":{codepoints:[8884], characters:"\\u22B4"}, "&LeftUpDownVector;":{codepoints:[10577], characters:"\\u2951"}, "&LeftUpTeeVector;":{codepoints:[10592], characters:"\\u2960"}, "&LeftUpVectorBar;":{codepoints:[10584], characters:"\\u2958"}, "&LeftUpVector;":{codepoints:[8639], characters:"\\u21BF"}, "&LeftVectorBar;":{codepoints:[10578], characters:"\\u2952"}, "&LeftVector;":{codepoints:[8636], characters:"\\u21BC"}, "&lEg;":{codepoints:[10891], characters:"\\u2A8B"}, "&leg;":{codepoints:[8922], characters:"\\u22DA"}, "&leq;":{codepoints:[8804], characters:"\\u2264"}, "&leqq;":{codepoints:[8806], characters:"\\u2266"}, "&leqslant;":{codepoints:[10877], characters:"\\u2A7D"}, "&lescc;":{codepoints:[10920], characters:"\\u2AA8"}, "&les;":{codepoints:[10877], characters:"\\u2A7D"}, "&lesdot;":{codepoints:[10879], characters:"\\u2A7F"}, "&lesdoto;":{codepoints:[10881], characters:"\\u2A81"}, "&lesdotor;":{codepoints:[10883], characters:"\\u2A83"}, "&lesg;":{codepoints:[8922, 65024], characters:"\\u22DA\\uFE00"}, "&lesges;":{codepoints:[10899], characters:"\\u2A93"}, "&lessapprox;":{codepoints:[10885], characters:"\\u2A85"}, "&lessdot;":{codepoints:[8918], characters:"\\u22D6"}, "&lesseqgtr;":{codepoints:[8922], characters:"\\u22DA"}, "&lesseqqgtr;":{codepoints:[10891], characters:"\\u2A8B"}, "&LessEqualGreater;":{codepoints:[8922], characters:"\\u22DA"}, "&LessFullEqual;":{codepoints:[8806], characters:"\\u2266"}, "&LessGreater;":{codepoints:[8822], characters:"\\u2276"}, "&lessgtr;":{codepoints:[8822], characters:"\\u2276"}, "&LessLess;":{codepoints:[10913], characters:"\\u2AA1"}, "&lesssim;":{codepoints:[8818], characters:"\\u2272"}, "&LessSlantEqual;":{codepoints:[10877], characters:"\\u2A7D"}, "&LessTilde;":{codepoints:[8818], characters:"\\u2272"}, "&lfisht;":{codepoints:[10620], characters:"\\u297C"}, "&lfloor;":{codepoints:[8970], characters:"\\u230A"}, "&Lfr;":{codepoints:[120079], characters:"\\uD835\\uDD0F"}, "&lfr;":{codepoints:[120105], characters:"\\uD835\\uDD29"}, "&lg;":{codepoints:[8822], characters:"\\u2276"}, "&lgE;":{codepoints:[10897], characters:"\\u2A91"}, "&lHar;":{codepoints:[10594], characters:"\\u2962"}, "&lhard;":{codepoints:[8637], characters:"\\u21BD"}, "&lharu;":{codepoints:[8636], characters:"\\u21BC"}, "&lharul;":{codepoints:[10602], characters:"\\u296A"}, "&lhblk;":{codepoints:[9604], characters:"\\u2584"}, "&LJcy;":{codepoints:[1033], characters:"\\u0409"}, "&ljcy;":{codepoints:[1113], characters:"\\u0459"}, "&llarr;":{codepoints:[8647], characters:"\\u21C7"}, "&ll;":{codepoints:[8810], characters:"\\u226A"}, "&Ll;":{codepoints:[8920], characters:"\\u22D8"}, "&llcorner;":{codepoints:[8990], characters:"\\u231E"}, "&Lleftarrow;":{codepoints:[8666], characters:"\\u21DA"}, "&llhard;":{codepoints:[10603], characters:"\\u296B"}, "&lltri;":{codepoints:[9722], characters:"\\u25FA"}, "&Lmidot;":{codepoints:[319], characters:"\\u013F"}, "&lmidot;":{codepoints:[320], characters:"\\u0140"}, "&lmoustache;":{codepoints:[9136], characters:"\\u23B0"}, "&lmoust;":{codepoints:[9136], characters:"\\u23B0"}, "&lnap;":{codepoints:[10889], characters:"\\u2A89"}, "&lnapprox;":{codepoints:[10889], characters:"\\u2A89"}, "&lne;":{codepoints:[10887], characters:"\\u2A87"}, "&lnE;":{codepoints:[8808], characters:"\\u2268"}, "&lneq;":{codepoints:[10887], characters:"\\u2A87"}, "&lneqq;":{codepoints:[8808], characters:"\\u2268"}, "&lnsim;":{codepoints:[8934], characters:"\\u22E6"}, "&loang;":{codepoints:[10220], characters:"\\u27EC"}, "&loarr;":{codepoints:[8701], characters:"\\u21FD"}, "&lobrk;":{codepoints:[10214], characters:"\\u27E6"}, "&longleftarrow;":{codepoints:[10229], characters:"\\u27F5"}, "&LongLeftArrow;":{codepoints:[10229], characters:"\\u27F5"}, "&Longleftarrow;":{codepoints:[10232], characters:"\\u27F8"}, "&longleftrightarrow;":{codepoints:[10231], characters:"\\u27F7"}, "&LongLeftRightArrow;":{codepoints:[10231], characters:"\\u27F7"}, "&Longleftrightarrow;":{codepoints:[10234], characters:"\\u27FA"}, "&longmapsto;":{codepoints:[10236], characters:"\\u27FC"}, "&longrightarrow;":{codepoints:[10230], characters:"\\u27F6"}, "&LongRightArrow;":{codepoints:[10230], characters:"\\u27F6"}, "&Longrightarrow;":{codepoints:[10233], characters:"\\u27F9"}, "&looparrowleft;":{codepoints:[8619], characters:"\\u21AB"}, "&looparrowright;":{codepoints:[8620], characters:"\\u21AC"}, "&lopar;":{codepoints:[10629], characters:"\\u2985"}, "&Lopf;":{codepoints:[120131], characters:"\\uD835\\uDD43"}, "&lopf;":{codepoints:[120157], characters:"\\uD835\\uDD5D"}, "&loplus;":{codepoints:[10797], characters:"\\u2A2D"}, "&lotimes;":{codepoints:[10804], characters:"\\u2A34"}, "&lowast;":{codepoints:[8727], characters:"\\u2217"}, "&lowbar;":{codepoints:[95], characters:"\\u005F"}, "&LowerLeftArrow;":{codepoints:[8601], characters:"\\u2199"}, "&LowerRightArrow;":{codepoints:[8600], characters:"\\u2198"}, "&loz;":{codepoints:[9674], characters:"\\u25CA"}, "&lozenge;":{codepoints:[9674], characters:"\\u25CA"}, "&lozf;":{codepoints:[10731], characters:"\\u29EB"}, "&lpar;":{codepoints:[40], characters:"\\u0028"}, "&lparlt;":{codepoints:[10643], characters:"\\u2993"}, "&lrarr;":{codepoints:[8646], characters:"\\u21C6"}, "&lrcorner;":{codepoints:[8991], characters:"\\u231F"}, "&lrhar;":{codepoints:[8651], characters:"\\u21CB"}, "&lrhard;":{codepoints:[10605], characters:"\\u296D"}, "&lrm;":{codepoints:[8206], characters:"\\u200E"}, "&lrtri;":{codepoints:[8895], characters:"\\u22BF"}, "&lsaquo;":{codepoints:[8249], characters:"\\u2039"}, "&lscr;":{codepoints:[120001], characters:"\\uD835\\uDCC1"}, "&Lscr;":{codepoints:[8466], characters:"\\u2112"}, "&lsh;":{codepoints:[8624], characters:"\\u21B0"}, "&Lsh;":{codepoints:[8624], characters:"\\u21B0"}, "&lsim;":{codepoints:[8818], characters:"\\u2272"}, "&lsime;":{codepoints:[10893], characters:"\\u2A8D"}, "&lsimg;":{codepoints:[10895], characters:"\\u2A8F"}, "&lsqb;":{codepoints:[91], characters:"\\u005B"}, "&lsquo;":{codepoints:[8216], characters:"\\u2018"}, "&lsquor;":{codepoints:[8218], characters:"\\u201A"}, "&Lstrok;":{codepoints:[321], characters:"\\u0141"}, "&lstrok;":{codepoints:[322], characters:"\\u0142"}, "&ltcc;":{codepoints:[10918], characters:"\\u2AA6"}, "&ltcir;":{codepoints:[10873], characters:"\\u2A79"}, "&lt;":{codepoints:[60], characters:"\\u003C"}, "&lt":{codepoints:[60], characters:"\\u003C"}, "&LT;":{codepoints:[60], characters:"\\u003C"}, "&LT":{codepoints:[60], characters:"\\u003C"}, "&Lt;":{codepoints:[8810], characters:"\\u226A"}, "&ltdot;":{codepoints:[8918], characters:"\\u22D6"}, "&lthree;":{codepoints:[8907], characters:"\\u22CB"}, "&ltimes;":{codepoints:[8905], characters:"\\u22C9"}, "&ltlarr;":{codepoints:[10614], characters:"\\u2976"}, "&ltquest;":{codepoints:[10875], characters:"\\u2A7B"}, "&ltri;":{codepoints:[9667], characters:"\\u25C3"}, "&ltrie;":{codepoints:[8884], characters:"\\u22B4"}, "&ltrif;":{codepoints:[9666], characters:"\\u25C2"}, "&ltrPar;":{codepoints:[10646], characters:"\\u2996"}, "&lurdshar;":{codepoints:[10570], characters:"\\u294A"}, "&luruhar;":{codepoints:[10598], characters:"\\u2966"}, "&lvertneqq;":{codepoints:[8808, 65024], characters:"\\u2268\\uFE00"}, "&lvnE;":{codepoints:[8808, 65024], characters:"\\u2268\\uFE00"}, "&macr;":{codepoints:[175], characters:"\\u00AF"}, "&macr":{codepoints:[175], characters:"\\u00AF"}, "&male;":{codepoints:[9794], characters:"\\u2642"}, "&malt;":{codepoints:[10016], characters:"\\u2720"}, "&maltese;":{codepoints:[10016], characters:"\\u2720"}, "&Map;":{codepoints:[10501], characters:"\\u2905"}, "&map;":{codepoints:[8614], characters:"\\u21A6"}, "&mapsto;":{codepoints:[8614], characters:"\\u21A6"}, "&mapstodown;":{codepoints:[8615], characters:"\\u21A7"}, "&mapstoleft;":{codepoints:[8612], characters:"\\u21A4"}, "&mapstoup;":{codepoints:[8613], characters:"\\u21A5"}, "&marker;":{codepoints:[9646], characters:"\\u25AE"}, "&mcomma;":{codepoints:[10793], characters:"\\u2A29"}, "&Mcy;":{codepoints:[1052], characters:"\\u041C"}, "&mcy;":{codepoints:[1084], characters:"\\u043C"}, "&mdash;":{codepoints:[8212], characters:"\\u2014"}, "&mDDot;":{codepoints:[8762], characters:"\\u223A"}, "&measuredangle;":{codepoints:[8737], characters:"\\u2221"}, "&MediumSpace;":{codepoints:[8287], characters:"\\u205F"}, "&Mellintrf;":{codepoints:[8499], characters:"\\u2133"}, "&Mfr;":{codepoints:[120080], characters:"\\uD835\\uDD10"}, "&mfr;":{codepoints:[120106], characters:"\\uD835\\uDD2A"}, "&mho;":{codepoints:[8487], characters:"\\u2127"}, "&micro;":{codepoints:[181], characters:"\\u00B5"}, "&micro":{codepoints:[181], characters:"\\u00B5"}, "&midast;":{codepoints:[42], characters:"\\u002A"}, "&midcir;":{codepoints:[10992], characters:"\\u2AF0"}, "&mid;":{codepoints:[8739], characters:"\\u2223"}, "&middot;":{codepoints:[183], characters:"\\u00B7"}, "&middot":{codepoints:[183], characters:"\\u00B7"}, "&minusb;":{codepoints:[8863], characters:"\\u229F"}, "&minus;":{codepoints:[8722], characters:"\\u2212"}, "&minusd;":{codepoints:[8760], characters:"\\u2238"}, "&minusdu;":{codepoints:[10794], characters:"\\u2A2A"}, "&MinusPlus;":{codepoints:[8723], characters:"\\u2213"}, "&mlcp;":{codepoints:[10971], characters:"\\u2ADB"}, "&mldr;":{codepoints:[8230], characters:"\\u2026"}, "&mnplus;":{codepoints:[8723], characters:"\\u2213"}, "&models;":{codepoints:[8871], characters:"\\u22A7"}, "&Mopf;":{codepoints:[120132], characters:"\\uD835\\uDD44"}, "&mopf;":{codepoints:[120158], characters:"\\uD835\\uDD5E"}, "&mp;":{codepoints:[8723], characters:"\\u2213"}, "&mscr;":{codepoints:[120002], characters:"\\uD835\\uDCC2"}, "&Mscr;":{codepoints:[8499], characters:"\\u2133"}, "&mstpos;":{codepoints:[8766], characters:"\\u223E"}, "&Mu;":{codepoints:[924], characters:"\\u039C"}, "&mu;":{codepoints:[956], characters:"\\u03BC"}, "&multimap;":{codepoints:[8888], characters:"\\u22B8"}, "&mumap;":{codepoints:[8888], characters:"\\u22B8"}, "&nabla;":{codepoints:[8711], characters:"\\u2207"}, "&Nacute;":{codepoints:[323], characters:"\\u0143"}, "&nacute;":{codepoints:[324], characters:"\\u0144"}, "&nang;":{codepoints:[8736, 8402], characters:"\\u2220\\u20D2"}, "&nap;":{codepoints:[8777], characters:"\\u2249"}, "&napE;":{codepoints:[10864, 824], characters:"\\u2A70\\u0338"}, "&napid;":{codepoints:[8779, 824], characters:"\\u224B\\u0338"}, "&napos;":{codepoints:[329], characters:"\\u0149"}, "&napprox;":{codepoints:[8777], characters:"\\u2249"}, "&natural;":{codepoints:[9838], characters:"\\u266E"}, "&naturals;":{codepoints:[8469], characters:"\\u2115"}, "&natur;":{codepoints:[9838], characters:"\\u266E"}, "&nbsp;":{codepoints:[160], characters:"\\u00A0"}, "&nbsp":{codepoints:[160], characters:"\\u00A0"}, "&nbump;":{codepoints:[8782, 824], characters:"\\u224E\\u0338"}, "&nbumpe;":{codepoints:[8783, 824], characters:"\\u224F\\u0338"}, "&ncap;":{codepoints:[10819], characters:"\\u2A43"}, "&Ncaron;":{codepoints:[327], characters:"\\u0147"}, "&ncaron;":{codepoints:[328], characters:"\\u0148"}, "&Ncedil;":{codepoints:[325], characters:"\\u0145"}, "&ncedil;":{codepoints:[326], characters:"\\u0146"}, "&ncong;":{codepoints:[8775], characters:"\\u2247"}, "&ncongdot;":{codepoints:[10861, 824], characters:"\\u2A6D\\u0338"}, "&ncup;":{codepoints:[10818], characters:"\\u2A42"}, "&Ncy;":{codepoints:[1053], characters:"\\u041D"}, "&ncy;":{codepoints:[1085], characters:"\\u043D"}, "&ndash;":{codepoints:[8211], characters:"\\u2013"}, "&nearhk;":{codepoints:[10532], characters:"\\u2924"}, "&nearr;":{codepoints:[8599], characters:"\\u2197"}, "&neArr;":{codepoints:[8663], characters:"\\u21D7"}, "&nearrow;":{codepoints:[8599], characters:"\\u2197"}, "&ne;":{codepoints:[8800], characters:"\\u2260"}, "&nedot;":{codepoints:[8784, 824], characters:"\\u2250\\u0338"}, "&NegativeMediumSpace;":{codepoints:[8203], characters:"\\u200B"}, "&NegativeThickSpace;":{codepoints:[8203], characters:"\\u200B"}, "&NegativeThinSpace;":{codepoints:[8203], characters:"\\u200B"}, "&NegativeVeryThinSpace;":{codepoints:[8203], characters:"\\u200B"}, "&nequiv;":{codepoints:[8802], characters:"\\u2262"}, "&nesear;":{codepoints:[10536], characters:"\\u2928"}, "&nesim;":{codepoints:[8770, 824], characters:"\\u2242\\u0338"}, "&NestedGreaterGreater;":{codepoints:[8811], characters:"\\u226B"}, "&NestedLessLess;":{codepoints:[8810], characters:"\\u226A"}, "&NewLine;":{codepoints:[10], characters:"\\u000A"}, "&nexist;":{codepoints:[8708], characters:"\\u2204"}, "&nexists;":{codepoints:[8708], characters:"\\u2204"}, "&Nfr;":{codepoints:[120081], characters:"\\uD835\\uDD11"}, "&nfr;":{codepoints:[120107], characters:"\\uD835\\uDD2B"}, "&ngE;":{codepoints:[8807, 824], characters:"\\u2267\\u0338"}, "&nge;":{codepoints:[8817], characters:"\\u2271"}, "&ngeq;":{codepoints:[8817], characters:"\\u2271"}, "&ngeqq;":{codepoints:[8807, 824], characters:"\\u2267\\u0338"}, "&ngeqslant;":{codepoints:[10878, 824], characters:"\\u2A7E\\u0338"}, "&nges;":{codepoints:[10878, 824], characters:"\\u2A7E\\u0338"}, "&nGg;":{codepoints:[8921, 824], characters:"\\u22D9\\u0338"}, "&ngsim;":{codepoints:[8821], characters:"\\u2275"}, "&nGt;":{codepoints:[8811, 8402], characters:"\\u226B\\u20D2"}, "&ngt;":{codepoints:[8815], characters:"\\u226F"}, "&ngtr;":{codepoints:[8815], characters:"\\u226F"}, "&nGtv;":{codepoints:[8811, 824], characters:"\\u226B\\u0338"}, "&nharr;":{codepoints:[8622], characters:"\\u21AE"}, "&nhArr;":{codepoints:[8654], characters:"\\u21CE"}, "&nhpar;":{codepoints:[10994], characters:"\\u2AF2"}, "&ni;":{codepoints:[8715], characters:"\\u220B"}, "&nis;":{codepoints:[8956], characters:"\\u22FC"}, "&nisd;":{codepoints:[8954], characters:"\\u22FA"}, "&niv;":{codepoints:[8715], characters:"\\u220B"}, "&NJcy;":{codepoints:[1034], characters:"\\u040A"}, "&njcy;":{codepoints:[1114], characters:"\\u045A"}, "&nlarr;":{codepoints:[8602], characters:"\\u219A"}, "&nlArr;":{codepoints:[8653], characters:"\\u21CD"}, "&nldr;":{codepoints:[8229], characters:"\\u2025"}, "&nlE;":{codepoints:[8806, 824], characters:"\\u2266\\u0338"}, "&nle;":{codepoints:[8816], characters:"\\u2270"}, "&nleftarrow;":{codepoints:[8602], characters:"\\u219A"}, "&nLeftarrow;":{codepoints:[8653], characters:"\\u21CD"}, "&nleftrightarrow;":{codepoints:[8622], characters:"\\u21AE"}, "&nLeftrightarrow;":{codepoints:[8654], characters:"\\u21CE"}, "&nleq;":{codepoints:[8816], characters:"\\u2270"}, "&nleqq;":{codepoints:[8806, 824], characters:"\\u2266\\u0338"}, "&nleqslant;":{codepoints:[10877, 824], characters:"\\u2A7D\\u0338"}, "&nles;":{codepoints:[10877, 824], characters:"\\u2A7D\\u0338"}, "&nless;":{codepoints:[8814], characters:"\\u226E"}, "&nLl;":{codepoints:[8920, 824], characters:"\\u22D8\\u0338"}, "&nlsim;":{codepoints:[8820], characters:"\\u2274"}, "&nLt;":{codepoints:[8810, 8402], characters:"\\u226A\\u20D2"}, "&nlt;":{codepoints:[8814], characters:"\\u226E"}, "&nltri;":{codepoints:[8938], characters:"\\u22EA"}, "&nltrie;":{codepoints:[8940], characters:"\\u22EC"}, "&nLtv;":{codepoints:[8810, 824], characters:"\\u226A\\u0338"}, "&nmid;":{codepoints:[8740], characters:"\\u2224"}, "&NoBreak;":{codepoints:[8288], characters:"\\u2060"}, "&NonBreakingSpace;":{codepoints:[160], characters:"\\u00A0"}, "&nopf;":{codepoints:[120159], characters:"\\uD835\\uDD5F"}, "&Nopf;":{codepoints:[8469], characters:"\\u2115"}, "&Not;":{codepoints:[10988], characters:"\\u2AEC"}, "&not;":{codepoints:[172], characters:"\\u00AC"}, "&not":{codepoints:[172], characters:"\\u00AC"}, "&NotCongruent;":{codepoints:[8802], characters:"\\u2262"}, "&NotCupCap;":{codepoints:[8813], characters:"\\u226D"}, "&NotDoubleVerticalBar;":{codepoints:[8742], characters:"\\u2226"}, "&NotElement;":{codepoints:[8713], characters:"\\u2209"}, "&NotEqual;":{codepoints:[8800], characters:"\\u2260"}, "&NotEqualTilde;":{codepoints:[8770, 824], characters:"\\u2242\\u0338"}, "&NotExists;":{codepoints:[8708], characters:"\\u2204"}, "&NotGreater;":{codepoints:[8815], characters:"\\u226F"}, "&NotGreaterEqual;":{codepoints:[8817], characters:"\\u2271"}, "&NotGreaterFullEqual;":{codepoints:[8807, 824], characters:"\\u2267\\u0338"}, "&NotGreaterGreater;":{codepoints:[8811, 824], characters:"\\u226B\\u0338"}, "&NotGreaterLess;":{codepoints:[8825], characters:"\\u2279"}, "&NotGreaterSlantEqual;":{codepoints:[10878, 824], characters:"\\u2A7E\\u0338"}, "&NotGreaterTilde;":{codepoints:[8821], characters:"\\u2275"}, "&NotHumpDownHump;":{codepoints:[8782, 824], characters:"\\u224E\\u0338"}, "&NotHumpEqual;":{codepoints:[8783, 824], characters:"\\u224F\\u0338"}, "&notin;":{codepoints:[8713], characters:"\\u2209"}, "&notindot;":{codepoints:[8949, 824], characters:"\\u22F5\\u0338"}, "&notinE;":{codepoints:[8953, 824], characters:"\\u22F9\\u0338"}, "&notinva;":{codepoints:[8713], characters:"\\u2209"}, "&notinvb;":{codepoints:[8951], characters:"\\u22F7"}, "&notinvc;":{codepoints:[8950], characters:"\\u22F6"}, "&NotLeftTriangleBar;":{codepoints:[10703, 824], characters:"\\u29CF\\u0338"}, "&NotLeftTriangle;":{codepoints:[8938], characters:"\\u22EA"}, "&NotLeftTriangleEqual;":{codepoints:[8940], characters:"\\u22EC"}, "&NotLess;":{codepoints:[8814], characters:"\\u226E"}, "&NotLessEqual;":{codepoints:[8816], characters:"\\u2270"}, "&NotLessGreater;":{codepoints:[8824], characters:"\\u2278"}, "&NotLessLess;":{codepoints:[8810, 824], characters:"\\u226A\\u0338"}, "&NotLessSlantEqual;":{codepoints:[10877, 824], characters:"\\u2A7D\\u0338"}, "&NotLessTilde;":{codepoints:[8820], characters:"\\u2274"}, "&NotNestedGreaterGreater;":{codepoints:[10914, 824], characters:"\\u2AA2\\u0338"}, "&NotNestedLessLess;":{codepoints:[10913, 824], characters:"\\u2AA1\\u0338"}, "&notni;":{codepoints:[8716], characters:"\\u220C"}, "&notniva;":{codepoints:[8716], characters:"\\u220C"}, "&notnivb;":{codepoints:[8958], characters:"\\u22FE"}, "&notnivc;":{codepoints:[8957], characters:"\\u22FD"}, "&NotPrecedes;":{codepoints:[8832], characters:"\\u2280"}, "&NotPrecedesEqual;":{codepoints:[10927, 824], characters:"\\u2AAF\\u0338"}, "&NotPrecedesSlantEqual;":{codepoints:[8928], characters:"\\u22E0"}, "&NotReverseElement;":{codepoints:[8716], characters:"\\u220C"}, "&NotRightTriangleBar;":{codepoints:[10704, 824], characters:"\\u29D0\\u0338"}, "&NotRightTriangle;":{codepoints:[8939], characters:"\\u22EB"}, "&NotRightTriangleEqual;":{codepoints:[8941], characters:"\\u22ED"}, "&NotSquareSubset;":{codepoints:[8847, 824], characters:"\\u228F\\u0338"}, "&NotSquareSubsetEqual;":{codepoints:[8930], characters:"\\u22E2"}, "&NotSquareSuperset;":{codepoints:[8848, 824], characters:"\\u2290\\u0338"}, "&NotSquareSupersetEqual;":{codepoints:[8931], characters:"\\u22E3"}, "&NotSubset;":{codepoints:[8834, 8402], characters:"\\u2282\\u20D2"}, "&NotSubsetEqual;":{codepoints:[8840], characters:"\\u2288"}, "&NotSucceeds;":{codepoints:[8833], characters:"\\u2281"}, "&NotSucceedsEqual;":{codepoints:[10928, 824], characters:"\\u2AB0\\u0338"}, "&NotSucceedsSlantEqual;":{codepoints:[8929], characters:"\\u22E1"}, "&NotSucceedsTilde;":{codepoints:[8831, 824], characters:"\\u227F\\u0338"}, "&NotSuperset;":{codepoints:[8835, 8402], characters:"\\u2283\\u20D2"}, "&NotSupersetEqual;":{codepoints:[8841], characters:"\\u2289"}, "&NotTilde;":{codepoints:[8769], characters:"\\u2241"}, "&NotTildeEqual;":{codepoints:[8772], characters:"\\u2244"}, "&NotTildeFullEqual;":{codepoints:[8775], characters:"\\u2247"}, "&NotTildeTilde;":{codepoints:[8777], characters:"\\u2249"}, "&NotVerticalBar;":{codepoints:[8740], characters:"\\u2224"}, "&nparallel;":{codepoints:[8742], characters:"\\u2226"}, "&npar;":{codepoints:[8742], characters:"\\u2226"}, "&nparsl;":{codepoints:[11005, 8421], characters:"\\u2AFD\\u20E5"}, "&npart;":{codepoints:[8706, 824], characters:"\\u2202\\u0338"}, "&npolint;":{codepoints:[10772], characters:"\\u2A14"}, "&npr;":{codepoints:[8832], characters:"\\u2280"}, "&nprcue;":{codepoints:[8928], characters:"\\u22E0"}, "&nprec;":{codepoints:[8832], characters:"\\u2280"}, "&npreceq;":{codepoints:[10927, 824], characters:"\\u2AAF\\u0338"}, "&npre;":{codepoints:[10927, 824], characters:"\\u2AAF\\u0338"}, "&nrarrc;":{codepoints:[10547, 824], characters:"\\u2933\\u0338"}, "&nrarr;":{codepoints:[8603], characters:"\\u219B"}, "&nrArr;":{codepoints:[8655], characters:"\\u21CF"}, "&nrarrw;":{codepoints:[8605, 824], characters:"\\u219D\\u0338"}, "&nrightarrow;":{codepoints:[8603], characters:"\\u219B"}, "&nRightarrow;":{codepoints:[8655], characters:"\\u21CF"}, "&nrtri;":{codepoints:[8939], characters:"\\u22EB"}, "&nrtrie;":{codepoints:[8941], characters:"\\u22ED"}, "&nsc;":{codepoints:[8833], characters:"\\u2281"}, "&nsccue;":{codepoints:[8929], characters:"\\u22E1"}, "&nsce;":{codepoints:[10928, 824], characters:"\\u2AB0\\u0338"}, "&Nscr;":{codepoints:[119977], characters:"\\uD835\\uDCA9"}, "&nscr;":{codepoints:[120003], characters:"\\uD835\\uDCC3"}, "&nshortmid;":{codepoints:[8740], characters:"\\u2224"}, "&nshortparallel;":{codepoints:[8742], characters:"\\u2226"}, "&nsim;":{codepoints:[8769], characters:"\\u2241"}, "&nsime;":{codepoints:[8772], characters:"\\u2244"}, "&nsimeq;":{codepoints:[8772], characters:"\\u2244"}, "&nsmid;":{codepoints:[8740], characters:"\\u2224"}, "&nspar;":{codepoints:[8742], characters:"\\u2226"}, "&nsqsube;":{codepoints:[8930], characters:"\\u22E2"}, "&nsqsupe;":{codepoints:[8931], characters:"\\u22E3"}, "&nsub;":{codepoints:[8836], characters:"\\u2284"}, "&nsubE;":{codepoints:[10949, 824], characters:"\\u2AC5\\u0338"}, "&nsube;":{codepoints:[8840], characters:"\\u2288"}, "&nsubset;":{codepoints:[8834, 8402], characters:"\\u2282\\u20D2"}, "&nsubseteq;":{codepoints:[8840], characters:"\\u2288"}, "&nsubseteqq;":{codepoints:[10949, 824], characters:"\\u2AC5\\u0338"}, "&nsucc;":{codepoints:[8833], characters:"\\u2281"}, "&nsucceq;":{codepoints:[10928, 824], characters:"\\u2AB0\\u0338"}, "&nsup;":{codepoints:[8837], characters:"\\u2285"}, "&nsupE;":{codepoints:[10950, 824], characters:"\\u2AC6\\u0338"}, "&nsupe;":{codepoints:[8841], characters:"\\u2289"}, "&nsupset;":{codepoints:[8835, 8402], characters:"\\u2283\\u20D2"}, "&nsupseteq;":{codepoints:[8841], characters:"\\u2289"}, "&nsupseteqq;":{codepoints:[10950, 824], characters:"\\u2AC6\\u0338"}, "&ntgl;":{codepoints:[8825], characters:"\\u2279"}, "&Ntilde;":{codepoints:[209], characters:"\\u00D1"}, "&Ntilde":{codepoints:[209], characters:"\\u00D1"}, "&ntilde;":{codepoints:[241], characters:"\\u00F1"}, "&ntilde":{codepoints:[241], characters:"\\u00F1"}, "&ntlg;":{codepoints:[8824], characters:"\\u2278"}, "&ntriangleleft;":{codepoints:[8938], characters:"\\u22EA"}, "&ntrianglelefteq;":{codepoints:[8940], characters:"\\u22EC"}, "&ntriangleright;":{codepoints:[8939], characters:"\\u22EB"}, "&ntrianglerighteq;":{codepoints:[8941], characters:"\\u22ED"}, "&Nu;":{codepoints:[925], characters:"\\u039D"}, "&nu;":{codepoints:[957], characters:"\\u03BD"}, "&num;":{codepoints:[35], characters:"\\u0023"}, "&numero;":{codepoints:[8470], characters:"\\u2116"}, "&numsp;":{codepoints:[8199], characters:"\\u2007"}, "&nvap;":{codepoints:[8781, 8402], characters:"\\u224D\\u20D2"}, "&nvdash;":{codepoints:[8876], characters:"\\u22AC"}, "&nvDash;":{codepoints:[8877], characters:"\\u22AD"}, "&nVdash;":{codepoints:[8878], characters:"\\u22AE"}, "&nVDash;":{codepoints:[8879], characters:"\\u22AF"}, "&nvge;":{codepoints:[8805, 8402], characters:"\\u2265\\u20D2"}, "&nvgt;":{codepoints:[62, 8402], characters:"\\u003E\\u20D2"}, "&nvHarr;":{codepoints:[10500], characters:"\\u2904"}, "&nvinfin;":{codepoints:[10718], characters:"\\u29DE"}, "&nvlArr;":{codepoints:[10498], characters:"\\u2902"}, "&nvle;":{codepoints:[8804, 8402], characters:"\\u2264\\u20D2"}, "&nvlt;":{codepoints:[60, 8402], characters:"\\u003C\\u20D2"}, "&nvltrie;":{codepoints:[8884, 8402], characters:"\\u22B4\\u20D2"}, "&nvrArr;":{codepoints:[10499], characters:"\\u2903"}, "&nvrtrie;":{codepoints:[8885, 8402], characters:"\\u22B5\\u20D2"}, "&nvsim;":{codepoints:[8764, 8402], characters:"\\u223C\\u20D2"}, "&nwarhk;":{codepoints:[10531], characters:"\\u2923"}, "&nwarr;":{codepoints:[8598], characters:"\\u2196"}, "&nwArr;":{codepoints:[8662], characters:"\\u21D6"}, "&nwarrow;":{codepoints:[8598], characters:"\\u2196"}, "&nwnear;":{codepoints:[10535], characters:"\\u2927"}, "&Oacute;":{codepoints:[211], characters:"\\u00D3"}, "&Oacute":{codepoints:[211], characters:"\\u00D3"}, "&oacute;":{codepoints:[243], characters:"\\u00F3"}, "&oacute":{codepoints:[243], characters:"\\u00F3"}, "&oast;":{codepoints:[8859], characters:"\\u229B"}, "&Ocirc;":{codepoints:[212], characters:"\\u00D4"}, "&Ocirc":{codepoints:[212], characters:"\\u00D4"}, "&ocirc;":{codepoints:[244], characters:"\\u00F4"}, "&ocirc":{codepoints:[244], characters:"\\u00F4"}, "&ocir;":{codepoints:[8858], characters:"\\u229A"}, "&Ocy;":{codepoints:[1054], characters:"\\u041E"}, "&ocy;":{codepoints:[1086], characters:"\\u043E"}, "&odash;":{codepoints:[8861], characters:"\\u229D"}, "&Odblac;":{codepoints:[336], characters:"\\u0150"}, "&odblac;":{codepoints:[337], characters:"\\u0151"}, "&odiv;":{codepoints:[10808], characters:"\\u2A38"}, "&odot;":{codepoints:[8857], characters:"\\u2299"}, "&odsold;":{codepoints:[10684], characters:"\\u29BC"}, "&OElig;":{codepoints:[338], characters:"\\u0152"}, "&oelig;":{codepoints:[339], characters:"\\u0153"}, "&ofcir;":{codepoints:[10687], characters:"\\u29BF"}, "&Ofr;":{codepoints:[120082], characters:"\\uD835\\uDD12"}, "&ofr;":{codepoints:[120108], characters:"\\uD835\\uDD2C"}, "&ogon;":{codepoints:[731], characters:"\\u02DB"}, "&Ograve;":{codepoints:[210], characters:"\\u00D2"}, "&Ograve":{codepoints:[210], characters:"\\u00D2"}, "&ograve;":{codepoints:[242], characters:"\\u00F2"}, "&ograve":{codepoints:[242], characters:"\\u00F2"}, "&ogt;":{codepoints:[10689], characters:"\\u29C1"}, "&ohbar;":{codepoints:[10677], characters:"\\u29B5"}, "&ohm;":{codepoints:[937], characters:"\\u03A9"}, "&oint;":{codepoints:[8750], characters:"\\u222E"}, "&olarr;":{codepoints:[8634], characters:"\\u21BA"}, "&olcir;":{codepoints:[10686], characters:"\\u29BE"}, "&olcross;":{codepoints:[10683], characters:"\\u29BB"}, "&oline;":{codepoints:[8254], characters:"\\u203E"}, "&olt;":{codepoints:[10688], characters:"\\u29C0"}, "&Omacr;":{codepoints:[332], characters:"\\u014C"}, "&omacr;":{codepoints:[333], characters:"\\u014D"}, "&Omega;":{codepoints:[937], characters:"\\u03A9"}, "&omega;":{codepoints:[969], characters:"\\u03C9"}, "&Omicron;":{codepoints:[927], characters:"\\u039F"}, "&omicron;":{codepoints:[959], characters:"\\u03BF"}, "&omid;":{codepoints:[10678], characters:"\\u29B6"}, "&ominus;":{codepoints:[8854], characters:"\\u2296"}, "&Oopf;":{codepoints:[120134], characters:"\\uD835\\uDD46"}, "&oopf;":{codepoints:[120160], characters:"\\uD835\\uDD60"}, "&opar;":{codepoints:[10679], characters:"\\u29B7"}, "&OpenCurlyDoubleQuote;":{codepoints:[8220], characters:"\\u201C"}, "&OpenCurlyQuote;":{codepoints:[8216], characters:"\\u2018"}, "&operp;":{codepoints:[10681], characters:"\\u29B9"}, "&oplus;":{codepoints:[8853], characters:"\\u2295"}, "&orarr;":{codepoints:[8635], characters:"\\u21BB"}, "&Or;":{codepoints:[10836], characters:"\\u2A54"}, "&or;":{codepoints:[8744], characters:"\\u2228"}, "&ord;":{codepoints:[10845], characters:"\\u2A5D"}, "&order;":{codepoints:[8500], characters:"\\u2134"}, "&orderof;":{codepoints:[8500], characters:"\\u2134"}, "&ordf;":{codepoints:[170], characters:"\\u00AA"}, "&ordf":{codepoints:[170], characters:"\\u00AA"}, "&ordm;":{codepoints:[186], characters:"\\u00BA"}, "&ordm":{codepoints:[186], characters:"\\u00BA"}, "&origof;":{codepoints:[8886], characters:"\\u22B6"}, "&oror;":{codepoints:[10838], characters:"\\u2A56"}, "&orslope;":{codepoints:[10839], characters:"\\u2A57"}, "&orv;":{codepoints:[10843], characters:"\\u2A5B"}, "&oS;":{codepoints:[9416], characters:"\\u24C8"}, "&Oscr;":{codepoints:[119978], characters:"\\uD835\\uDCAA"}, "&oscr;":{codepoints:[8500], characters:"\\u2134"}, "&Oslash;":{codepoints:[216], characters:"\\u00D8"}, "&Oslash":{codepoints:[216], characters:"\\u00D8"}, "&oslash;":{codepoints:[248], characters:"\\u00F8"}, "&oslash":{codepoints:[248], characters:"\\u00F8"}, "&osol;":{codepoints:[8856], characters:"\\u2298"}, "&Otilde;":{codepoints:[213], characters:"\\u00D5"}, "&Otilde":{codepoints:[213], characters:"\\u00D5"}, "&otilde;":{codepoints:[245], characters:"\\u00F5"}, "&otilde":{codepoints:[245], characters:"\\u00F5"}, "&otimesas;":{codepoints:[10806], characters:"\\u2A36"}, "&Otimes;":{codepoints:[10807], characters:"\\u2A37"}, "&otimes;":{codepoints:[8855], characters:"\\u2297"}, "&Ouml;":{codepoints:[214], characters:"\\u00D6"}, "&Ouml":{codepoints:[214], characters:"\\u00D6"}, "&ouml;":{codepoints:[246], characters:"\\u00F6"}, "&ouml":{codepoints:[246], characters:"\\u00F6"}, "&ovbar;":{codepoints:[9021], characters:"\\u233D"}, "&OverBar;":{codepoints:[8254], characters:"\\u203E"}, "&OverBrace;":{codepoints:[9182], characters:"\\u23DE"}, "&OverBracket;":{codepoints:[9140], characters:"\\u23B4"}, "&OverParenthesis;":{codepoints:[9180], characters:"\\u23DC"}, "&para;":{codepoints:[182], characters:"\\u00B6"}, "&para":{codepoints:[182], characters:"\\u00B6"}, "&parallel;":{codepoints:[8741], characters:"\\u2225"}, "&par;":{codepoints:[8741], characters:"\\u2225"}, "&parsim;":{codepoints:[10995], characters:"\\u2AF3"}, "&parsl;":{codepoints:[11005], characters:"\\u2AFD"}, "&part;":{codepoints:[8706], characters:"\\u2202"}, "&PartialD;":{codepoints:[8706], characters:"\\u2202"}, "&Pcy;":{codepoints:[1055], characters:"\\u041F"}, "&pcy;":{codepoints:[1087], characters:"\\u043F"}, "&percnt;":{codepoints:[37], characters:"\\u0025"}, "&period;":{codepoints:[46], characters:"\\u002E"}, "&permil;":{codepoints:[8240], characters:"\\u2030"}, "&perp;":{codepoints:[8869], characters:"\\u22A5"}, "&pertenk;":{codepoints:[8241], characters:"\\u2031"}, "&Pfr;":{codepoints:[120083], characters:"\\uD835\\uDD13"}, "&pfr;":{codepoints:[120109], characters:"\\uD835\\uDD2D"}, "&Phi;":{codepoints:[934], characters:"\\u03A6"}, "&phi;":{codepoints:[966], characters:"\\u03C6"}, "&phiv;":{codepoints:[981], characters:"\\u03D5"}, "&phmmat;":{codepoints:[8499], characters:"\\u2133"}, "&phone;":{codepoints:[9742], characters:"\\u260E"}, "&Pi;":{codepoints:[928], characters:"\\u03A0"}, "&pi;":{codepoints:[960], characters:"\\u03C0"}, "&pitchfork;":{codepoints:[8916], characters:"\\u22D4"}, "&piv;":{codepoints:[982], characters:"\\u03D6"}, "&planck;":{codepoints:[8463], characters:"\\u210F"}, "&planckh;":{codepoints:[8462], characters:"\\u210E"}, "&plankv;":{codepoints:[8463], characters:"\\u210F"}, "&plusacir;":{codepoints:[10787], characters:"\\u2A23"}, "&plusb;":{codepoints:[8862], characters:"\\u229E"}, "&pluscir;":{codepoints:[10786], characters:"\\u2A22"}, "&plus;":{codepoints:[43], characters:"\\u002B"}, "&plusdo;":{codepoints:[8724], characters:"\\u2214"}, "&plusdu;":{codepoints:[10789], characters:"\\u2A25"}, "&pluse;":{codepoints:[10866], characters:"\\u2A72"}, "&PlusMinus;":{codepoints:[177], characters:"\\u00B1"}, "&plusmn;":{codepoints:[177], characters:"\\u00B1"}, "&plusmn":{codepoints:[177], characters:"\\u00B1"}, "&plussim;":{codepoints:[10790], characters:"\\u2A26"}, "&plustwo;":{codepoints:[10791], characters:"\\u2A27"}, "&pm;":{codepoints:[177], characters:"\\u00B1"}, "&Poincareplane;":{codepoints:[8460], characters:"\\u210C"}, "&pointint;":{codepoints:[10773], characters:"\\u2A15"}, "&popf;":{codepoints:[120161], characters:"\\uD835\\uDD61"}, "&Popf;":{codepoints:[8473], characters:"\\u2119"}, "&pound;":{codepoints:[163], characters:"\\u00A3"}, "&pound":{codepoints:[163], characters:"\\u00A3"}, "&prap;":{codepoints:[10935], characters:"\\u2AB7"}, "&Pr;":{codepoints:[10939], characters:"\\u2ABB"}, "&pr;":{codepoints:[8826], characters:"\\u227A"}, "&prcue;":{codepoints:[8828], characters:"\\u227C"}, "&precapprox;":{codepoints:[10935], characters:"\\u2AB7"}, "&prec;":{codepoints:[8826], characters:"\\u227A"}, "&preccurlyeq;":{codepoints:[8828], characters:"\\u227C"}, "&Precedes;":{codepoints:[8826], characters:"\\u227A"}, "&PrecedesEqual;":{codepoints:[10927], characters:"\\u2AAF"}, "&PrecedesSlantEqual;":{codepoints:[8828], characters:"\\u227C"}, "&PrecedesTilde;":{codepoints:[8830], characters:"\\u227E"}, "&preceq;":{codepoints:[10927], characters:"\\u2AAF"}, "&precnapprox;":{codepoints:[10937], characters:"\\u2AB9"}, "&precneqq;":{codepoints:[10933], characters:"\\u2AB5"}, "&precnsim;":{codepoints:[8936], characters:"\\u22E8"}, "&pre;":{codepoints:[10927], characters:"\\u2AAF"}, "&prE;":{codepoints:[10931], characters:"\\u2AB3"}, "&precsim;":{codepoints:[8830], characters:"\\u227E"}, "&prime;":{codepoints:[8242], characters:"\\u2032"}, "&Prime;":{codepoints:[8243], characters:"\\u2033"}, "&primes;":{codepoints:[8473], characters:"\\u2119"}, "&prnap;":{codepoints:[10937], characters:"\\u2AB9"}, "&prnE;":{codepoints:[10933], characters:"\\u2AB5"}, "&prnsim;":{codepoints:[8936], characters:"\\u22E8"}, "&prod;":{codepoints:[8719], characters:"\\u220F"}, "&Product;":{codepoints:[8719], characters:"\\u220F"}, "&profalar;":{codepoints:[9006], characters:"\\u232E"}, "&profline;":{codepoints:[8978], characters:"\\u2312"}, "&profsurf;":{codepoints:[8979], characters:"\\u2313"}, "&prop;":{codepoints:[8733], characters:"\\u221D"}, "&Proportional;":{codepoints:[8733], characters:"\\u221D"}, "&Proportion;":{codepoints:[8759], characters:"\\u2237"}, "&propto;":{codepoints:[8733], characters:"\\u221D"}, "&prsim;":{codepoints:[8830], characters:"\\u227E"}, "&prurel;":{codepoints:[8880], characters:"\\u22B0"}, "&Pscr;":{codepoints:[119979], characters:"\\uD835\\uDCAB"}, "&pscr;":{codepoints:[120005], characters:"\\uD835\\uDCC5"}, "&Psi;":{codepoints:[936], characters:"\\u03A8"}, "&psi;":{codepoints:[968], characters:"\\u03C8"}, "&puncsp;":{codepoints:[8200], characters:"\\u2008"}, "&Qfr;":{codepoints:[120084], characters:"\\uD835\\uDD14"}, "&qfr;":{codepoints:[120110], characters:"\\uD835\\uDD2E"}, "&qint;":{codepoints:[10764], characters:"\\u2A0C"}, "&qopf;":{codepoints:[120162], characters:"\\uD835\\uDD62"}, "&Qopf;":{codepoints:[8474], characters:"\\u211A"}, "&qprime;":{codepoints:[8279], characters:"\\u2057"}, "&Qscr;":{codepoints:[119980], characters:"\\uD835\\uDCAC"}, "&qscr;":{codepoints:[120006], characters:"\\uD835\\uDCC6"}, "&quaternions;":{codepoints:[8461], characters:"\\u210D"}, "&quatint;":{codepoints:[10774], characters:"\\u2A16"}, "&quest;":{codepoints:[63], characters:"\\u003F"}, "&questeq;":{codepoints:[8799], characters:"\\u225F"}, "&quot;":{codepoints:[34], characters:"\\u0022"}, "&quot":{codepoints:[34], characters:"\\u0022"}, "&QUOT;":{codepoints:[34], characters:"\\u0022"}, "&QUOT":{codepoints:[34], characters:"\\u0022"}, "&rAarr;":{codepoints:[8667], characters:"\\u21DB"}, "&race;":{codepoints:[8765, 817], characters:"\\u223D\\u0331"}, "&Racute;":{codepoints:[340], characters:"\\u0154"}, "&racute;":{codepoints:[341], characters:"\\u0155"}, "&radic;":{codepoints:[8730], characters:"\\u221A"}, "&raemptyv;":{codepoints:[10675], characters:"\\u29B3"}, "&rang;":{codepoints:[10217], characters:"\\u27E9"}, "&Rang;":{codepoints:[10219], characters:"\\u27EB"}, "&rangd;":{codepoints:[10642], characters:"\\u2992"}, "&range;":{codepoints:[10661], characters:"\\u29A5"}, "&rangle;":{codepoints:[10217], characters:"\\u27E9"}, "&raquo;":{codepoints:[187], characters:"\\u00BB"}, "&raquo":{codepoints:[187], characters:"\\u00BB"}, "&rarrap;":{codepoints:[10613], characters:"\\u2975"}, "&rarrb;":{codepoints:[8677], characters:"\\u21E5"}, "&rarrbfs;":{codepoints:[10528], characters:"\\u2920"}, "&rarrc;":{codepoints:[10547], characters:"\\u2933"}, "&rarr;":{codepoints:[8594], characters:"\\u2192"}, "&Rarr;":{codepoints:[8608], characters:"\\u21A0"}, "&rArr;":{codepoints:[8658], characters:"\\u21D2"}, "&rarrfs;":{codepoints:[10526], characters:"\\u291E"}, "&rarrhk;":{codepoints:[8618], characters:"\\u21AA"}, "&rarrlp;":{codepoints:[8620], characters:"\\u21AC"}, "&rarrpl;":{codepoints:[10565], characters:"\\u2945"}, "&rarrsim;":{codepoints:[10612], characters:"\\u2974"}, "&Rarrtl;":{codepoints:[10518], characters:"\\u2916"}, "&rarrtl;":{codepoints:[8611], characters:"\\u21A3"}, "&rarrw;":{codepoints:[8605], characters:"\\u219D"}, "&ratail;":{codepoints:[10522], characters:"\\u291A"}, "&rAtail;":{codepoints:[10524], characters:"\\u291C"}, "&ratio;":{codepoints:[8758], characters:"\\u2236"}, "&rationals;":{codepoints:[8474], characters:"\\u211A"}, "&rbarr;":{codepoints:[10509], characters:"\\u290D"}, "&rBarr;":{codepoints:[10511], characters:"\\u290F"}, "&RBarr;":{codepoints:[10512], characters:"\\u2910"}, "&rbbrk;":{codepoints:[10099], characters:"\\u2773"}, "&rbrace;":{codepoints:[125], characters:"\\u007D"}, "&rbrack;":{codepoints:[93], characters:"\\u005D"}, "&rbrke;":{codepoints:[10636], characters:"\\u298C"}, "&rbrksld;":{codepoints:[10638], characters:"\\u298E"}, "&rbrkslu;":{codepoints:[10640], characters:"\\u2990"}, "&Rcaron;":{codepoints:[344], characters:"\\u0158"}, "&rcaron;":{codepoints:[345], characters:"\\u0159"}, "&Rcedil;":{codepoints:[342], characters:"\\u0156"}, "&rcedil;":{codepoints:[343], characters:"\\u0157"}, "&rceil;":{codepoints:[8969], characters:"\\u2309"}, "&rcub;":{codepoints:[125], characters:"\\u007D"}, "&Rcy;":{codepoints:[1056], characters:"\\u0420"}, "&rcy;":{codepoints:[1088], characters:"\\u0440"}, "&rdca;":{codepoints:[10551], characters:"\\u2937"}, "&rdldhar;":{codepoints:[10601], characters:"\\u2969"}, "&rdquo;":{codepoints:[8221], characters:"\\u201D"}, "&rdquor;":{codepoints:[8221], characters:"\\u201D"}, "&rdsh;":{codepoints:[8627], characters:"\\u21B3"}, "&real;":{codepoints:[8476], characters:"\\u211C"}, "&realine;":{codepoints:[8475], characters:"\\u211B"}, "&realpart;":{codepoints:[8476], characters:"\\u211C"}, "&reals;":{codepoints:[8477], characters:"\\u211D"}, "&Re;":{codepoints:[8476], characters:"\\u211C"}, "&rect;":{codepoints:[9645], characters:"\\u25AD"}, "&reg;":{codepoints:[174], characters:"\\u00AE"}, "&reg":{codepoints:[174], characters:"\\u00AE"}, "&REG;":{codepoints:[174], characters:"\\u00AE"}, "&REG":{codepoints:[174], characters:"\\u00AE"}, "&ReverseElement;":{codepoints:[8715], characters:"\\u220B"}, "&ReverseEquilibrium;":{codepoints:[8651], characters:"\\u21CB"}, "&ReverseUpEquilibrium;":{codepoints:[10607], characters:"\\u296F"}, "&rfisht;":{codepoints:[10621], characters:"\\u297D"}, "&rfloor;":{codepoints:[8971], characters:"\\u230B"}, "&rfr;":{codepoints:[120111], characters:"\\uD835\\uDD2F"}, "&Rfr;":{codepoints:[8476], characters:"\\u211C"}, "&rHar;":{codepoints:[10596], characters:"\\u2964"}, "&rhard;":{codepoints:[8641], characters:"\\u21C1"}, "&rharu;":{codepoints:[8640], characters:"\\u21C0"}, "&rharul;":{codepoints:[10604], characters:"\\u296C"}, "&Rho;":{codepoints:[929], characters:"\\u03A1"}, "&rho;":{codepoints:[961], characters:"\\u03C1"}, "&rhov;":{codepoints:[1009], characters:"\\u03F1"}, "&RightAngleBracket;":{codepoints:[10217], characters:"\\u27E9"}, "&RightArrowBar;":{codepoints:[8677], characters:"\\u21E5"}, "&rightarrow;":{codepoints:[8594], characters:"\\u2192"}, "&RightArrow;":{codepoints:[8594], characters:"\\u2192"}, "&Rightarrow;":{codepoints:[8658], characters:"\\u21D2"}, "&RightArrowLeftArrow;":{codepoints:[8644], characters:"\\u21C4"}, "&rightarrowtail;":{codepoints:[8611], characters:"\\u21A3"}, "&RightCeiling;":{codepoints:[8969], characters:"\\u2309"}, "&RightDoubleBracket;":{codepoints:[10215], characters:"\\u27E7"}, "&RightDownTeeVector;":{codepoints:[10589], characters:"\\u295D"}, "&RightDownVectorBar;":{codepoints:[10581], characters:"\\u2955"}, "&RightDownVector;":{codepoints:[8642], characters:"\\u21C2"}, "&RightFloor;":{codepoints:[8971], characters:"\\u230B"}, "&rightharpoondown;":{codepoints:[8641], characters:"\\u21C1"}, "&rightharpoonup;":{codepoints:[8640], characters:"\\u21C0"}, "&rightleftarrows;":{codepoints:[8644], characters:"\\u21C4"}, "&rightleftharpoons;":{codepoints:[8652], characters:"\\u21CC"}, "&rightrightarrows;":{codepoints:[8649], characters:"\\u21C9"}, "&rightsquigarrow;":{codepoints:[8605], characters:"\\u219D"}, "&RightTeeArrow;":{codepoints:[8614], characters:"\\u21A6"}, "&RightTee;":{codepoints:[8866], characters:"\\u22A2"}, "&RightTeeVector;":{codepoints:[10587], characters:"\\u295B"}, "&rightthreetimes;":{codepoints:[8908], characters:"\\u22CC"}, "&RightTriangleBar;":{codepoints:[10704], characters:"\\u29D0"}, "&RightTriangle;":{codepoints:[8883], characters:"\\u22B3"}, "&RightTriangleEqual;":{codepoints:[8885], characters:"\\u22B5"}, "&RightUpDownVector;":{codepoints:[10575], characters:"\\u294F"}, "&RightUpTeeVector;":{codepoints:[10588], characters:"\\u295C"}, "&RightUpVectorBar;":{codepoints:[10580], characters:"\\u2954"}, "&RightUpVector;":{codepoints:[8638], characters:"\\u21BE"}, "&RightVectorBar;":{codepoints:[10579], characters:"\\u2953"}, "&RightVector;":{codepoints:[8640], characters:"\\u21C0"}, "&ring;":{codepoints:[730], characters:"\\u02DA"}, "&risingdotseq;":{codepoints:[8787], characters:"\\u2253"}, "&rlarr;":{codepoints:[8644], characters:"\\u21C4"}, "&rlhar;":{codepoints:[8652], characters:"\\u21CC"}, "&rlm;":{codepoints:[8207], characters:"\\u200F"}, "&rmoustache;":{codepoints:[9137], characters:"\\u23B1"}, "&rmoust;":{codepoints:[9137], characters:"\\u23B1"}, "&rnmid;":{codepoints:[10990], characters:"\\u2AEE"}, "&roang;":{codepoints:[10221], characters:"\\u27ED"}, "&roarr;":{codepoints:[8702], characters:"\\u21FE"}, "&robrk;":{codepoints:[10215], characters:"\\u27E7"}, "&ropar;":{codepoints:[10630], characters:"\\u2986"}, "&ropf;":{codepoints:[120163], characters:"\\uD835\\uDD63"}, "&Ropf;":{codepoints:[8477], characters:"\\u211D"}, "&roplus;":{codepoints:[10798], characters:"\\u2A2E"}, "&rotimes;":{codepoints:[10805], characters:"\\u2A35"}, "&RoundImplies;":{codepoints:[10608], characters:"\\u2970"}, "&rpar;":{codepoints:[41], characters:"\\u0029"}, "&rpargt;":{codepoints:[10644], characters:"\\u2994"}, "&rppolint;":{codepoints:[10770], characters:"\\u2A12"}, "&rrarr;":{codepoints:[8649], characters:"\\u21C9"}, "&Rrightarrow;":{codepoints:[8667], characters:"\\u21DB"}, "&rsaquo;":{codepoints:[8250], characters:"\\u203A"}, "&rscr;":{codepoints:[120007], characters:"\\uD835\\uDCC7"}, "&Rscr;":{codepoints:[8475], characters:"\\u211B"}, "&rsh;":{codepoints:[8625], characters:"\\u21B1"}, "&Rsh;":{codepoints:[8625], characters:"\\u21B1"}, "&rsqb;":{codepoints:[93], characters:"\\u005D"}, "&rsquo;":{codepoints:[8217], characters:"\\u2019"}, "&rsquor;":{codepoints:[8217], characters:"\\u2019"}, "&rthree;":{codepoints:[8908], characters:"\\u22CC"}, "&rtimes;":{codepoints:[8906], characters:"\\u22CA"}, "&rtri;":{codepoints:[9657], characters:"\\u25B9"}, "&rtrie;":{codepoints:[8885], characters:"\\u22B5"}, "&rtrif;":{codepoints:[9656], characters:"\\u25B8"}, "&rtriltri;":{codepoints:[10702], characters:"\\u29CE"}, "&RuleDelayed;":{codepoints:[10740], characters:"\\u29F4"}, "&ruluhar;":{codepoints:[10600], characters:"\\u2968"}, "&rx;":{codepoints:[8478], characters:"\\u211E"}, "&Sacute;":{codepoints:[346], characters:"\\u015A"}, "&sacute;":{codepoints:[347], characters:"\\u015B"}, "&sbquo;":{codepoints:[8218], characters:"\\u201A"}, "&scap;":{codepoints:[10936], characters:"\\u2AB8"}, "&Scaron;":{codepoints:[352], characters:"\\u0160"}, "&scaron;":{codepoints:[353], characters:"\\u0161"}, "&Sc;":{codepoints:[10940], characters:"\\u2ABC"}, "&sc;":{codepoints:[8827], characters:"\\u227B"}, "&sccue;":{codepoints:[8829], characters:"\\u227D"}, "&sce;":{codepoints:[10928], characters:"\\u2AB0"}, "&scE;":{codepoints:[10932], characters:"\\u2AB4"}, "&Scedil;":{codepoints:[350], characters:"\\u015E"}, "&scedil;":{codepoints:[351], characters:"\\u015F"}, "&Scirc;":{codepoints:[348], characters:"\\u015C"}, "&scirc;":{codepoints:[349], characters:"\\u015D"}, "&scnap;":{codepoints:[10938], characters:"\\u2ABA"}, "&scnE;":{codepoints:[10934], characters:"\\u2AB6"}, "&scnsim;":{codepoints:[8937], characters:"\\u22E9"}, "&scpolint;":{codepoints:[10771], characters:"\\u2A13"}, "&scsim;":{codepoints:[8831], characters:"\\u227F"}, "&Scy;":{codepoints:[1057], characters:"\\u0421"}, "&scy;":{codepoints:[1089], characters:"\\u0441"}, "&sdotb;":{codepoints:[8865], characters:"\\u22A1"}, "&sdot;":{codepoints:[8901], characters:"\\u22C5"}, "&sdote;":{codepoints:[10854], characters:"\\u2A66"}, "&searhk;":{codepoints:[10533], characters:"\\u2925"}, "&searr;":{codepoints:[8600], characters:"\\u2198"}, "&seArr;":{codepoints:[8664], characters:"\\u21D8"}, "&searrow;":{codepoints:[8600], characters:"\\u2198"}, "&sect;":{codepoints:[167], characters:"\\u00A7"}, "&sect":{codepoints:[167], characters:"\\u00A7"}, "&semi;":{codepoints:[59], characters:"\\u003B"}, "&seswar;":{codepoints:[10537], characters:"\\u2929"}, "&setminus;":{codepoints:[8726], characters:"\\u2216"}, "&setmn;":{codepoints:[8726], characters:"\\u2216"}, "&sext;":{codepoints:[10038], characters:"\\u2736"}, "&Sfr;":{codepoints:[120086], characters:"\\uD835\\uDD16"}, "&sfr;":{codepoints:[120112], characters:"\\uD835\\uDD30"}, "&sfrown;":{codepoints:[8994], characters:"\\u2322"}, "&sharp;":{codepoints:[9839], characters:"\\u266F"}, "&SHCHcy;":{codepoints:[1065], characters:"\\u0429"}, "&shchcy;":{codepoints:[1097], characters:"\\u0449"}, "&SHcy;":{codepoints:[1064], characters:"\\u0428"}, "&shcy;":{codepoints:[1096], characters:"\\u0448"}, "&ShortDownArrow;":{codepoints:[8595], characters:"\\u2193"}, "&ShortLeftArrow;":{codepoints:[8592], characters:"\\u2190"}, "&shortmid;":{codepoints:[8739], characters:"\\u2223"}, "&shortparallel;":{codepoints:[8741], characters:"\\u2225"}, "&ShortRightArrow;":{codepoints:[8594], characters:"\\u2192"}, "&ShortUpArrow;":{codepoints:[8593], characters:"\\u2191"}, "&shy;":{codepoints:[173], characters:"\\u00AD"}, "&shy":{codepoints:[173], characters:"\\u00AD"}, "&Sigma;":{codepoints:[931], characters:"\\u03A3"}, "&sigma;":{codepoints:[963], characters:"\\u03C3"}, "&sigmaf;":{codepoints:[962], characters:"\\u03C2"}, "&sigmav;":{codepoints:[962], characters:"\\u03C2"}, "&sim;":{codepoints:[8764], characters:"\\u223C"}, "&simdot;":{codepoints:[10858], characters:"\\u2A6A"}, "&sime;":{codepoints:[8771], characters:"\\u2243"}, "&simeq;":{codepoints:[8771], characters:"\\u2243"}, "&simg;":{codepoints:[10910], characters:"\\u2A9E"}, "&simgE;":{codepoints:[10912], characters:"\\u2AA0"}, "&siml;":{codepoints:[10909], characters:"\\u2A9D"}, "&simlE;":{codepoints:[10911], characters:"\\u2A9F"}, "&simne;":{codepoints:[8774], characters:"\\u2246"}, "&simplus;":{codepoints:[10788], characters:"\\u2A24"}, "&simrarr;":{codepoints:[10610], characters:"\\u2972"}, "&slarr;":{codepoints:[8592], characters:"\\u2190"}, "&SmallCircle;":{codepoints:[8728], characters:"\\u2218"}, "&smallsetminus;":{codepoints:[8726], characters:"\\u2216"}, "&smashp;":{codepoints:[10803], characters:"\\u2A33"}, "&smeparsl;":{codepoints:[10724], characters:"\\u29E4"}, "&smid;":{codepoints:[8739], characters:"\\u2223"}, "&smile;":{codepoints:[8995], characters:"\\u2323"}, "&smt;":{codepoints:[10922], characters:"\\u2AAA"}, "&smte;":{codepoints:[10924], characters:"\\u2AAC"}, "&smtes;":{codepoints:[10924, 65024], characters:"\\u2AAC\\uFE00"}, "&SOFTcy;":{codepoints:[1068], characters:"\\u042C"}, "&softcy;":{codepoints:[1100], characters:"\\u044C"}, "&solbar;":{codepoints:[9023], characters:"\\u233F"}, "&solb;":{codepoints:[10692], characters:"\\u29C4"}, "&sol;":{codepoints:[47], characters:"\\u002F"}, "&Sopf;":{codepoints:[120138], characters:"\\uD835\\uDD4A"}, "&sopf;":{codepoints:[120164], characters:"\\uD835\\uDD64"}, "&spades;":{codepoints:[9824], characters:"\\u2660"}, "&spadesuit;":{codepoints:[9824], characters:"\\u2660"}, "&spar;":{codepoints:[8741], characters:"\\u2225"}, "&sqcap;":{codepoints:[8851], characters:"\\u2293"}, "&sqcaps;":{codepoints:[8851, 65024], characters:"\\u2293\\uFE00"}, "&sqcup;":{codepoints:[8852], characters:"\\u2294"}, "&sqcups;":{codepoints:[8852, 65024], characters:"\\u2294\\uFE00"}, "&Sqrt;":{codepoints:[8730], characters:"\\u221A"}, "&sqsub;":{codepoints:[8847], characters:"\\u228F"}, "&sqsube;":{codepoints:[8849], characters:"\\u2291"}, "&sqsubset;":{codepoints:[8847], characters:"\\u228F"}, "&sqsubseteq;":{codepoints:[8849], characters:"\\u2291"}, "&sqsup;":{codepoints:[8848], characters:"\\u2290"}, "&sqsupe;":{codepoints:[8850], characters:"\\u2292"}, "&sqsupset;":{codepoints:[8848], characters:"\\u2290"}, "&sqsupseteq;":{codepoints:[8850], characters:"\\u2292"}, "&square;":{codepoints:[9633], characters:"\\u25A1"}, "&Square;":{codepoints:[9633], characters:"\\u25A1"}, "&SquareIntersection;":{codepoints:[8851], characters:"\\u2293"}, "&SquareSubset;":{codepoints:[8847], characters:"\\u228F"}, "&SquareSubsetEqual;":{codepoints:[8849], characters:"\\u2291"}, "&SquareSuperset;":{codepoints:[8848], characters:"\\u2290"}, "&SquareSupersetEqual;":{codepoints:[8850], characters:"\\u2292"}, "&SquareUnion;":{codepoints:[8852], characters:"\\u2294"}, "&squarf;":{codepoints:[9642], characters:"\\u25AA"}, "&squ;":{codepoints:[9633], characters:"\\u25A1"}, "&squf;":{codepoints:[9642], characters:"\\u25AA"}, "&srarr;":{codepoints:[8594], characters:"\\u2192"}, "&Sscr;":{codepoints:[119982], characters:"\\uD835\\uDCAE"}, "&sscr;":{codepoints:[120008], characters:"\\uD835\\uDCC8"}, "&ssetmn;":{codepoints:[8726], characters:"\\u2216"}, "&ssmile;":{codepoints:[8995], characters:"\\u2323"}, "&sstarf;":{codepoints:[8902], characters:"\\u22C6"}, "&Star;":{codepoints:[8902], characters:"\\u22C6"}, "&star;":{codepoints:[9734], characters:"\\u2606"}, "&starf;":{codepoints:[9733], characters:"\\u2605"}, "&straightepsilon;":{codepoints:[1013], characters:"\\u03F5"}, "&straightphi;":{codepoints:[981], characters:"\\u03D5"}, "&strns;":{codepoints:[175], characters:"\\u00AF"}, "&sub;":{codepoints:[8834], characters:"\\u2282"}, "&Sub;":{codepoints:[8912], characters:"\\u22D0"}, "&subdot;":{codepoints:[10941], characters:"\\u2ABD"}, "&subE;":{codepoints:[10949], characters:"\\u2AC5"}, "&sube;":{codepoints:[8838], characters:"\\u2286"}, "&subedot;":{codepoints:[10947], characters:"\\u2AC3"}, "&submult;":{codepoints:[10945], characters:"\\u2AC1"}, "&subnE;":{codepoints:[10955], characters:"\\u2ACB"}, "&subne;":{codepoints:[8842], characters:"\\u228A"}, "&subplus;":{codepoints:[10943], characters:"\\u2ABF"}, "&subrarr;":{codepoints:[10617], characters:"\\u2979"}, "&subset;":{codepoints:[8834], characters:"\\u2282"}, "&Subset;":{codepoints:[8912], characters:"\\u22D0"}, "&subseteq;":{codepoints:[8838], characters:"\\u2286"}, "&subseteqq;":{codepoints:[10949], characters:"\\u2AC5"}, "&SubsetEqual;":{codepoints:[8838], characters:"\\u2286"}, "&subsetneq;":{codepoints:[8842], characters:"\\u228A"}, "&subsetneqq;":{codepoints:[10955], characters:"\\u2ACB"}, "&subsim;":{codepoints:[10951], characters:"\\u2AC7"}, "&subsub;":{codepoints:[10965], characters:"\\u2AD5"}, "&subsup;":{codepoints:[10963], characters:"\\u2AD3"}, "&succapprox;":{codepoints:[10936], characters:"\\u2AB8"}, "&succ;":{codepoints:[8827], characters:"\\u227B"}, "&succcurlyeq;":{codepoints:[8829], characters:"\\u227D"}, "&Succeeds;":{codepoints:[8827], characters:"\\u227B"}, "&SucceedsEqual;":{codepoints:[10928], characters:"\\u2AB0"}, "&SucceedsSlantEqual;":{codepoints:[8829], characters:"\\u227D"}, "&SucceedsTilde;":{codepoints:[8831], characters:"\\u227F"}, "&succeq;":{codepoints:[10928], characters:"\\u2AB0"}, "&succnapprox;":{codepoints:[10938], characters:"\\u2ABA"}, "&succneqq;":{codepoints:[10934], characters:"\\u2AB6"}, "&succnsim;":{codepoints:[8937], characters:"\\u22E9"}, "&succsim;":{codepoints:[8831], characters:"\\u227F"}, "&SuchThat;":{codepoints:[8715], characters:"\\u220B"}, "&sum;":{codepoints:[8721], characters:"\\u2211"}, "&Sum;":{codepoints:[8721], characters:"\\u2211"}, "&sung;":{codepoints:[9834], characters:"\\u266A"}, "&sup1;":{codepoints:[185], characters:"\\u00B9"}, "&sup1":{codepoints:[185], characters:"\\u00B9"}, "&sup2;":{codepoints:[178], characters:"\\u00B2"}, "&sup2":{codepoints:[178], characters:"\\u00B2"}, "&sup3;":{codepoints:[179], characters:"\\u00B3"}, "&sup3":{codepoints:[179], characters:"\\u00B3"}, "&sup;":{codepoints:[8835], characters:"\\u2283"}, "&Sup;":{codepoints:[8913], characters:"\\u22D1"}, "&supdot;":{codepoints:[10942], characters:"\\u2ABE"}, "&supdsub;":{codepoints:[10968], characters:"\\u2AD8"}, "&supE;":{codepoints:[10950], characters:"\\u2AC6"}, "&supe;":{codepoints:[8839], characters:"\\u2287"}, "&supedot;":{codepoints:[10948], characters:"\\u2AC4"}, "&Superset;":{codepoints:[8835], characters:"\\u2283"}, "&SupersetEqual;":{codepoints:[8839], characters:"\\u2287"}, "&suphsol;":{codepoints:[10185], characters:"\\u27C9"}, "&suphsub;":{codepoints:[10967], characters:"\\u2AD7"}, "&suplarr;":{codepoints:[10619], characters:"\\u297B"}, "&supmult;":{codepoints:[10946], characters:"\\u2AC2"}, "&supnE;":{codepoints:[10956], characters:"\\u2ACC"}, "&supne;":{codepoints:[8843], characters:"\\u228B"}, "&supplus;":{codepoints:[10944], characters:"\\u2AC0"}, "&supset;":{codepoints:[8835], characters:"\\u2283"}, "&Supset;":{codepoints:[8913], characters:"\\u22D1"}, "&supseteq;":{codepoints:[8839], characters:"\\u2287"}, "&supseteqq;":{codepoints:[10950], characters:"\\u2AC6"}, "&supsetneq;":{codepoints:[8843], characters:"\\u228B"}, "&supsetneqq;":{codepoints:[10956], characters:"\\u2ACC"}, "&supsim;":{codepoints:[10952], characters:"\\u2AC8"}, "&supsub;":{codepoints:[10964], characters:"\\u2AD4"}, "&supsup;":{codepoints:[10966], characters:"\\u2AD6"}, "&swarhk;":{codepoints:[10534], characters:"\\u2926"}, "&swarr;":{codepoints:[8601], characters:"\\u2199"}, "&swArr;":{codepoints:[8665], characters:"\\u21D9"}, "&swarrow;":{codepoints:[8601], characters:"\\u2199"}, "&swnwar;":{codepoints:[10538], characters:"\\u292A"}, "&szlig;":{codepoints:[223], characters:"\\u00DF"}, "&szlig":{codepoints:[223], characters:"\\u00DF"}, "&Tab;":{codepoints:[9], characters:"\\u0009"}, "&target;":{codepoints:[8982], characters:"\\u2316"}, "&Tau;":{codepoints:[932], characters:"\\u03A4"}, "&tau;":{codepoints:[964], characters:"\\u03C4"}, "&tbrk;":{codepoints:[9140], characters:"\\u23B4"}, "&Tcaron;":{codepoints:[356], characters:"\\u0164"}, "&tcaron;":{codepoints:[357], characters:"\\u0165"}, "&Tcedil;":{codepoints:[354], characters:"\\u0162"}, "&tcedil;":{codepoints:[355], characters:"\\u0163"}, "&Tcy;":{codepoints:[1058], characters:"\\u0422"}, "&tcy;":{codepoints:[1090], characters:"\\u0442"}, "&tdot;":{codepoints:[8411], characters:"\\u20DB"}, "&telrec;":{codepoints:[8981], characters:"\\u2315"}, "&Tfr;":{codepoints:[120087], characters:"\\uD835\\uDD17"}, "&tfr;":{codepoints:[120113], characters:"\\uD835\\uDD31"}, "&there4;":{codepoints:[8756], characters:"\\u2234"}, "&therefore;":{codepoints:[8756], characters:"\\u2234"}, "&Therefore;":{codepoints:[8756], characters:"\\u2234"}, "&Theta;":{codepoints:[920], characters:"\\u0398"}, "&theta;":{codepoints:[952], characters:"\\u03B8"}, "&thetasym;":{codepoints:[977], characters:"\\u03D1"}, "&thetav;":{codepoints:[977], characters:"\\u03D1"}, "&thickapprox;":{codepoints:[8776], characters:"\\u2248"}, "&thicksim;":{codepoints:[8764], characters:"\\u223C"}, "&ThickSpace;":{codepoints:[8287, 8202], characters:"\\u205F\\u200A"}, "&ThinSpace;":{codepoints:[8201], characters:"\\u2009"}, "&thinsp;":{codepoints:[8201], characters:"\\u2009"}, "&thkap;":{codepoints:[8776], characters:"\\u2248"}, "&thksim;":{codepoints:[8764], characters:"\\u223C"}, "&THORN;":{codepoints:[222], characters:"\\u00DE"}, "&THORN":{codepoints:[222], characters:"\\u00DE"}, "&thorn;":{codepoints:[254], characters:"\\u00FE"}, "&thorn":{codepoints:[254], characters:"\\u00FE"}, "&tilde;":{codepoints:[732], characters:"\\u02DC"}, "&Tilde;":{codepoints:[8764], characters:"\\u223C"}, "&TildeEqual;":{codepoints:[8771], characters:"\\u2243"}, "&TildeFullEqual;":{codepoints:[8773], characters:"\\u2245"}, "&TildeTilde;":{codepoints:[8776], characters:"\\u2248"}, "&timesbar;":{codepoints:[10801], characters:"\\u2A31"}, "&timesb;":{codepoints:[8864], characters:"\\u22A0"}, "&times;":{codepoints:[215], characters:"\\u00D7"}, "&times":{codepoints:[215], characters:"\\u00D7"}, "&timesd;":{codepoints:[10800], characters:"\\u2A30"}, "&tint;":{codepoints:[8749], characters:"\\u222D"}, "&toea;":{codepoints:[10536], characters:"\\u2928"}, "&topbot;":{codepoints:[9014], characters:"\\u2336"}, "&topcir;":{codepoints:[10993], characters:"\\u2AF1"}, "&top;":{codepoints:[8868], characters:"\\u22A4"}, "&Topf;":{codepoints:[120139], characters:"\\uD835\\uDD4B"}, "&topf;":{codepoints:[120165], characters:"\\uD835\\uDD65"}, "&topfork;":{codepoints:[10970], characters:"\\u2ADA"}, "&tosa;":{codepoints:[10537], characters:"\\u2929"}, "&tprime;":{codepoints:[8244], characters:"\\u2034"}, "&trade;":{codepoints:[8482], characters:"\\u2122"}, "&TRADE;":{codepoints:[8482], characters:"\\u2122"}, "&triangle;":{codepoints:[9653], characters:"\\u25B5"}, "&triangledown;":{codepoints:[9663], characters:"\\u25BF"}, "&triangleleft;":{codepoints:[9667], characters:"\\u25C3"}, "&trianglelefteq;":{codepoints:[8884], characters:"\\u22B4"}, "&triangleq;":{codepoints:[8796], characters:"\\u225C"}, "&triangleright;":{codepoints:[9657], characters:"\\u25B9"}, "&trianglerighteq;":{codepoints:[8885], characters:"\\u22B5"}, "&tridot;":{codepoints:[9708], characters:"\\u25EC"}, "&trie;":{codepoints:[8796], characters:"\\u225C"}, "&triminus;":{codepoints:[10810], characters:"\\u2A3A"}, "&TripleDot;":{codepoints:[8411], characters:"\\u20DB"}, "&triplus;":{codepoints:[10809], characters:"\\u2A39"}, "&trisb;":{codepoints:[10701], characters:"\\u29CD"}, "&tritime;":{codepoints:[10811], characters:"\\u2A3B"}, "&trpezium;":{codepoints:[9186], characters:"\\u23E2"}, "&Tscr;":{codepoints:[119983], characters:"\\uD835\\uDCAF"}, "&tscr;":{codepoints:[120009], characters:"\\uD835\\uDCC9"}, "&TScy;":{codepoints:[1062], characters:"\\u0426"}, "&tscy;":{codepoints:[1094], characters:"\\u0446"}, "&TSHcy;":{codepoints:[1035], characters:"\\u040B"}, "&tshcy;":{codepoints:[1115], characters:"\\u045B"}, "&Tstrok;":{codepoints:[358], characters:"\\u0166"}, "&tstrok;":{codepoints:[359], characters:"\\u0167"}, "&twixt;":{codepoints:[8812], characters:"\\u226C"}, "&twoheadleftarrow;":{codepoints:[8606], characters:"\\u219E"}, "&twoheadrightarrow;":{codepoints:[8608], characters:"\\u21A0"}, "&Uacute;":{codepoints:[218], characters:"\\u00DA"}, "&Uacute":{codepoints:[218], characters:"\\u00DA"}, "&uacute;":{codepoints:[250], characters:"\\u00FA"}, "&uacute":{codepoints:[250], characters:"\\u00FA"}, "&uarr;":{codepoints:[8593], characters:"\\u2191"}, "&Uarr;":{codepoints:[8607], characters:"\\u219F"}, "&uArr;":{codepoints:[8657], characters:"\\u21D1"}, "&Uarrocir;":{codepoints:[10569], characters:"\\u2949"}, "&Ubrcy;":{codepoints:[1038], characters:"\\u040E"}, "&ubrcy;":{codepoints:[1118], characters:"\\u045E"}, "&Ubreve;":{codepoints:[364], characters:"\\u016C"}, "&ubreve;":{codepoints:[365], characters:"\\u016D"}, "&Ucirc;":{codepoints:[219], characters:"\\u00DB"}, "&Ucirc":{codepoints:[219], characters:"\\u00DB"}, "&ucirc;":{codepoints:[251], characters:"\\u00FB"}, "&ucirc":{codepoints:[251], characters:"\\u00FB"}, "&Ucy;":{codepoints:[1059], characters:"\\u0423"}, "&ucy;":{codepoints:[1091], characters:"\\u0443"}, "&udarr;":{codepoints:[8645], characters:"\\u21C5"}, "&Udblac;":{codepoints:[368], characters:"\\u0170"}, "&udblac;":{codepoints:[369], characters:"\\u0171"}, "&udhar;":{codepoints:[10606], characters:"\\u296E"}, "&ufisht;":{codepoints:[10622], characters:"\\u297E"}, "&Ufr;":{codepoints:[120088], characters:"\\uD835\\uDD18"}, "&ufr;":{codepoints:[120114], characters:"\\uD835\\uDD32"}, "&Ugrave;":{codepoints:[217], characters:"\\u00D9"}, "&Ugrave":{codepoints:[217], characters:"\\u00D9"}, "&ugrave;":{codepoints:[249], characters:"\\u00F9"}, "&ugrave":{codepoints:[249], characters:"\\u00F9"}, "&uHar;":{codepoints:[10595], characters:"\\u2963"}, "&uharl;":{codepoints:[8639], characters:"\\u21BF"}, "&uharr;":{codepoints:[8638], characters:"\\u21BE"}, "&uhblk;":{codepoints:[9600], characters:"\\u2580"}, "&ulcorn;":{codepoints:[8988], characters:"\\u231C"}, "&ulcorner;":{codepoints:[8988], characters:"\\u231C"}, "&ulcrop;":{codepoints:[8975], characters:"\\u230F"}, "&ultri;":{codepoints:[9720], characters:"\\u25F8"}, "&Umacr;":{codepoints:[362], characters:"\\u016A"}, "&umacr;":{codepoints:[363], characters:"\\u016B"}, "&uml;":{codepoints:[168], characters:"\\u00A8"}, "&uml":{codepoints:[168], characters:"\\u00A8"}, "&UnderBar;":{codepoints:[95], characters:"\\u005F"}, "&UnderBrace;":{codepoints:[9183], characters:"\\u23DF"}, "&UnderBracket;":{codepoints:[9141], characters:"\\u23B5"}, "&UnderParenthesis;":{codepoints:[9181], characters:"\\u23DD"}, "&Union;":{codepoints:[8899], characters:"\\u22C3"}, "&UnionPlus;":{codepoints:[8846], characters:"\\u228E"}, "&Uogon;":{codepoints:[370], characters:"\\u0172"}, "&uogon;":{codepoints:[371], characters:"\\u0173"}, "&Uopf;":{codepoints:[120140], characters:"\\uD835\\uDD4C"}, "&uopf;":{codepoints:[120166], characters:"\\uD835\\uDD66"}, "&UpArrowBar;":{codepoints:[10514], characters:"\\u2912"}, "&uparrow;":{codepoints:[8593], characters:"\\u2191"}, "&UpArrow;":{codepoints:[8593], characters:"\\u2191"}, "&Uparrow;":{codepoints:[8657], characters:"\\u21D1"}, "&UpArrowDownArrow;":{codepoints:[8645], characters:"\\u21C5"}, "&updownarrow;":{codepoints:[8597], characters:"\\u2195"}, "&UpDownArrow;":{codepoints:[8597], characters:"\\u2195"}, "&Updownarrow;":{codepoints:[8661], characters:"\\u21D5"}, "&UpEquilibrium;":{codepoints:[10606], characters:"\\u296E"}, "&upharpoonleft;":{codepoints:[8639], characters:"\\u21BF"}, "&upharpoonright;":{codepoints:[8638], characters:"\\u21BE"}, "&uplus;":{codepoints:[8846], characters:"\\u228E"}, "&UpperLeftArrow;":{codepoints:[8598], characters:"\\u2196"}, "&UpperRightArrow;":{codepoints:[8599], characters:"\\u2197"}, "&upsi;":{codepoints:[965], characters:"\\u03C5"}, "&Upsi;":{codepoints:[978], characters:"\\u03D2"}, "&upsih;":{codepoints:[978], characters:"\\u03D2"}, "&Upsilon;":{codepoints:[933], characters:"\\u03A5"}, "&upsilon;":{codepoints:[965], characters:"\\u03C5"}, "&UpTeeArrow;":{codepoints:[8613], characters:"\\u21A5"}, "&UpTee;":{codepoints:[8869], characters:"\\u22A5"}, "&upuparrows;":{codepoints:[8648], characters:"\\u21C8"}, "&urcorn;":{codepoints:[8989], characters:"\\u231D"}, "&urcorner;":{codepoints:[8989], characters:"\\u231D"}, "&urcrop;":{codepoints:[8974], characters:"\\u230E"}, "&Uring;":{codepoints:[366], characters:"\\u016E"}, "&uring;":{codepoints:[367], characters:"\\u016F"}, "&urtri;":{codepoints:[9721], characters:"\\u25F9"}, "&Uscr;":{codepoints:[119984], characters:"\\uD835\\uDCB0"}, "&uscr;":{codepoints:[120010], characters:"\\uD835\\uDCCA"}, "&utdot;":{codepoints:[8944], characters:"\\u22F0"}, "&Utilde;":{codepoints:[360], characters:"\\u0168"}, "&utilde;":{codepoints:[361], characters:"\\u0169"}, "&utri;":{codepoints:[9653], characters:"\\u25B5"}, "&utrif;":{codepoints:[9652], characters:"\\u25B4"}, "&uuarr;":{codepoints:[8648], characters:"\\u21C8"}, "&Uuml;":{codepoints:[220], characters:"\\u00DC"}, "&Uuml":{codepoints:[220], characters:"\\u00DC"}, "&uuml;":{codepoints:[252], characters:"\\u00FC"}, "&uuml":{codepoints:[252], characters:"\\u00FC"}, "&uwangle;":{codepoints:[10663], characters:"\\u29A7"}, "&vangrt;":{codepoints:[10652], characters:"\\u299C"}, "&varepsilon;":{codepoints:[1013], characters:"\\u03F5"}, "&varkappa;":{codepoints:[1008], characters:"\\u03F0"}, "&varnothing;":{codepoints:[8709], characters:"\\u2205"}, "&varphi;":{codepoints:[981], characters:"\\u03D5"}, "&varpi;":{codepoints:[982], characters:"\\u03D6"}, "&varpropto;":{codepoints:[8733], characters:"\\u221D"}, "&varr;":{codepoints:[8597], characters:"\\u2195"}, "&vArr;":{codepoints:[8661], characters:"\\u21D5"}, "&varrho;":{codepoints:[1009], characters:"\\u03F1"}, "&varsigma;":{codepoints:[962], characters:"\\u03C2"}, "&varsubsetneq;":{codepoints:[8842, 65024], characters:"\\u228A\\uFE00"}, "&varsubsetneqq;":{codepoints:[10955, 65024], characters:"\\u2ACB\\uFE00"}, "&varsupsetneq;":{codepoints:[8843, 65024], characters:"\\u228B\\uFE00"}, "&varsupsetneqq;":{codepoints:[10956, 65024], characters:"\\u2ACC\\uFE00"}, "&vartheta;":{codepoints:[977], characters:"\\u03D1"}, "&vartriangleleft;":{codepoints:[8882], characters:"\\u22B2"}, "&vartriangleright;":{codepoints:[8883], characters:"\\u22B3"}, "&vBar;":{codepoints:[10984], characters:"\\u2AE8"}, "&Vbar;":{codepoints:[10987], characters:"\\u2AEB"}, "&vBarv;":{codepoints:[10985], characters:"\\u2AE9"}, "&Vcy;":{codepoints:[1042], characters:"\\u0412"}, "&vcy;":{codepoints:[1074], characters:"\\u0432"}, "&vdash;":{codepoints:[8866], characters:"\\u22A2"}, "&vDash;":{codepoints:[8872], characters:"\\u22A8"}, "&Vdash;":{codepoints:[8873], characters:"\\u22A9"}, "&VDash;":{codepoints:[8875], characters:"\\u22AB"}, "&Vdashl;":{codepoints:[10982], characters:"\\u2AE6"}, "&veebar;":{codepoints:[8891], characters:"\\u22BB"}, "&vee;":{codepoints:[8744], characters:"\\u2228"}, "&Vee;":{codepoints:[8897], characters:"\\u22C1"}, "&veeeq;":{codepoints:[8794], characters:"\\u225A"}, "&vellip;":{codepoints:[8942], characters:"\\u22EE"}, "&verbar;":{codepoints:[124], characters:"\\u007C"}, "&Verbar;":{codepoints:[8214], characters:"\\u2016"}, "&vert;":{codepoints:[124], characters:"\\u007C"}, "&Vert;":{codepoints:[8214], characters:"\\u2016"}, "&VerticalBar;":{codepoints:[8739], characters:"\\u2223"}, "&VerticalLine;":{codepoints:[124], characters:"\\u007C"}, "&VerticalSeparator;":{codepoints:[10072], characters:"\\u2758"}, "&VerticalTilde;":{codepoints:[8768], characters:"\\u2240"}, "&VeryThinSpace;":{codepoints:[8202], characters:"\\u200A"}, "&Vfr;":{codepoints:[120089], characters:"\\uD835\\uDD19"}, "&vfr;":{codepoints:[120115], characters:"\\uD835\\uDD33"}, "&vltri;":{codepoints:[8882], characters:"\\u22B2"}, "&vnsub;":{codepoints:[8834, 8402], characters:"\\u2282\\u20D2"}, "&vnsup;":{codepoints:[8835, 8402], characters:"\\u2283\\u20D2"}, "&Vopf;":{codepoints:[120141], characters:"\\uD835\\uDD4D"}, "&vopf;":{codepoints:[120167], characters:"\\uD835\\uDD67"}, "&vprop;":{codepoints:[8733], characters:"\\u221D"}, "&vrtri;":{codepoints:[8883], characters:"\\u22B3"}, "&Vscr;":{codepoints:[119985], characters:"\\uD835\\uDCB1"}, "&vscr;":{codepoints:[120011], characters:"\\uD835\\uDCCB"}, "&vsubnE;":{codepoints:[10955, 65024], characters:"\\u2ACB\\uFE00"}, "&vsubne;":{codepoints:[8842, 65024], characters:"\\u228A\\uFE00"}, "&vsupnE;":{codepoints:[10956, 65024], characters:"\\u2ACC\\uFE00"}, "&vsupne;":{codepoints:[8843, 65024], characters:"\\u228B\\uFE00"}, "&Vvdash;":{codepoints:[8874], characters:"\\u22AA"}, "&vzigzag;":{codepoints:[10650], characters:"\\u299A"}, "&Wcirc;":{codepoints:[372], characters:"\\u0174"}, "&wcirc;":{codepoints:[373], characters:"\\u0175"}, "&wedbar;":{codepoints:[10847], characters:"\\u2A5F"}, "&wedge;":{codepoints:[8743], characters:"\\u2227"}, "&Wedge;":{codepoints:[8896], characters:"\\u22C0"}, "&wedgeq;":{codepoints:[8793], characters:"\\u2259"}, "&weierp;":{codepoints:[8472], characters:"\\u2118"}, "&Wfr;":{codepoints:[120090], characters:"\\uD835\\uDD1A"}, "&wfr;":{codepoints:[120116], characters:"\\uD835\\uDD34"}, "&Wopf;":{codepoints:[120142], characters:"\\uD835\\uDD4E"}, "&wopf;":{codepoints:[120168], characters:"\\uD835\\uDD68"}, "&wp;":{codepoints:[8472], characters:"\\u2118"}, "&wr;":{codepoints:[8768], characters:"\\u2240"}, "&wreath;":{codepoints:[8768], characters:"\\u2240"}, "&Wscr;":{codepoints:[119986], characters:"\\uD835\\uDCB2"}, "&wscr;":{codepoints:[120012], characters:"\\uD835\\uDCCC"}, "&xcap;":{codepoints:[8898], characters:"\\u22C2"}, "&xcirc;":{codepoints:[9711], characters:"\\u25EF"}, "&xcup;":{codepoints:[8899], characters:"\\u22C3"}, "&xdtri;":{codepoints:[9661], characters:"\\u25BD"}, "&Xfr;":{codepoints:[120091], characters:"\\uD835\\uDD1B"}, "&xfr;":{codepoints:[120117], characters:"\\uD835\\uDD35"}, "&xharr;":{codepoints:[10231], characters:"\\u27F7"}, "&xhArr;":{codepoints:[10234], characters:"\\u27FA"}, "&Xi;":{codepoints:[926], characters:"\\u039E"}, "&xi;":{codepoints:[958], characters:"\\u03BE"}, "&xlarr;":{codepoints:[10229], characters:"\\u27F5"}, "&xlArr;":{codepoints:[10232], characters:"\\u27F8"}, "&xmap;":{codepoints:[10236], characters:"\\u27FC"}, "&xnis;":{codepoints:[8955], characters:"\\u22FB"}, "&xodot;":{codepoints:[10752], characters:"\\u2A00"}, "&Xopf;":{codepoints:[120143], characters:"\\uD835\\uDD4F"}, "&xopf;":{codepoints:[120169], characters:"\\uD835\\uDD69"}, "&xoplus;":{codepoints:[10753], characters:"\\u2A01"}, "&xotime;":{codepoints:[10754], characters:"\\u2A02"}, "&xrarr;":{codepoints:[10230], characters:"\\u27F6"}, "&xrArr;":{codepoints:[10233], characters:"\\u27F9"}, "&Xscr;":{codepoints:[119987], characters:"\\uD835\\uDCB3"}, "&xscr;":{codepoints:[120013], characters:"\\uD835\\uDCCD"}, "&xsqcup;":{codepoints:[10758], characters:"\\u2A06"}, "&xuplus;":{codepoints:[10756], characters:"\\u2A04"}, "&xutri;":{codepoints:[9651], characters:"\\u25B3"}, "&xvee;":{codepoints:[8897], characters:"\\u22C1"}, "&xwedge;":{codepoints:[8896], characters:"\\u22C0"}, "&Yacute;":{codepoints:[221], characters:"\\u00DD"}, "&Yacute":{codepoints:[221], characters:"\\u00DD"}, "&yacute;":{codepoints:[253], characters:"\\u00FD"}, "&yacute":{codepoints:[253], characters:"\\u00FD"}, "&YAcy;":{codepoints:[1071], characters:"\\u042F"}, "&yacy;":{codepoints:[1103], characters:"\\u044F"}, "&Ycirc;":{codepoints:[374], characters:"\\u0176"}, "&ycirc;":{codepoints:[375], characters:"\\u0177"}, "&Ycy;":{codepoints:[1067], characters:"\\u042B"}, "&ycy;":{codepoints:[1099], characters:"\\u044B"}, "&yen;":{codepoints:[165], characters:"\\u00A5"}, "&yen":{codepoints:[165], characters:"\\u00A5"}, "&Yfr;":{codepoints:[120092], characters:"\\uD835\\uDD1C"}, "&yfr;":{codepoints:[120118], characters:"\\uD835\\uDD36"}, "&YIcy;":{codepoints:[1031], characters:"\\u0407"}, "&yicy;":{codepoints:[1111], characters:"\\u0457"}, "&Yopf;":{codepoints:[120144], characters:"\\uD835\\uDD50"}, "&yopf;":{codepoints:[120170], characters:"\\uD835\\uDD6A"}, "&Yscr;":{codepoints:[119988], characters:"\\uD835\\uDCB4"}, "&yscr;":{codepoints:[120014], characters:"\\uD835\\uDCCE"}, "&YUcy;":{codepoints:[1070], characters:"\\u042E"}, "&yucy;":{codepoints:[1102], characters:"\\u044E"}, "&yuml;":{codepoints:[255], characters:"\\u00FF"}, "&yuml":{codepoints:[255], characters:"\\u00FF"}, "&Yuml;":{codepoints:[376], characters:"\\u0178"}, "&Zacute;":{codepoints:[377], characters:"\\u0179"}, "&zacute;":{codepoints:[378], characters:"\\u017A"}, "&Zcaron;":{codepoints:[381], characters:"\\u017D"}, "&zcaron;":{codepoints:[382], characters:"\\u017E"}, "&Zcy;":{codepoints:[1047], characters:"\\u0417"}, "&zcy;":{codepoints:[1079], characters:"\\u0437"}, "&Zdot;":{codepoints:[379], characters:"\\u017B"}, "&zdot;":{codepoints:[380], characters:"\\u017C"}, "&zeetrf;":{codepoints:[8488], characters:"\\u2128"}, "&ZeroWidthSpace;":{codepoints:[8203], characters:"\\u200B"}, "&Zeta;":{codepoints:[918], characters:"\\u0396"}, "&zeta;":{codepoints:[950], characters:"\\u03B6"}, "&zfr;":{codepoints:[120119], characters:"\\uD835\\uDD37"}, "&Zfr;":{codepoints:[8488], characters:"\\u2128"}, "&ZHcy;":{codepoints:[1046], characters:"\\u0416"}, "&zhcy;":{codepoints:[1078], characters:"\\u0436"}, "&zigrarr;":{codepoints:[8669], characters:"\\u21DD"}, "&zopf;":{codepoints:[120171], characters:"\\uD835\\uDD6B"}, "&Zopf;":{codepoints:[8484], characters:"\\u2124"}, "&Zscr;":{codepoints:[119989], characters:"\\uD835\\uDCB5"}, "&zscr;":{codepoints:[120015], characters:"\\uD835\\uDCCF"}, "&zwj;":{codepoints:[8205], characters:"\\u200D"}, "&zwnj;":{codepoints:[8204], characters:"\\u200C"}};module.exports = htmlEntityTypes;
//# sourceMappingURL=namedHTMLEntities.js.map
},{}],14:[function(require,module,exports){
"use strict";
/**
 * the visitor pattern so we can map AST to functions
 */

var noop = function noop() {};

var visitor = {
  build: function build(fns) {
    var step = function step(node, index, context) {
      var type = node[0];
      var output = undefined,
          enterMethod = undefined,
          leaveMethod = undefined;
      if (fns[type]) {
        enterMethod = fns[type].enter || fns[type];
        leaveMethod = fns[type].leave || noop;
      } else {
        enterMethod = noop;
        leaveMethod = noop;
      }
      context.stack.push(node, index, enterMethod);

      // also walk the child nodes for those nodes with children
      switch (type) {
        case "HTML_ELEMENT":
          if (node[1].tag_info.attributes) {
            walk.apply(null, [node[1].tag_info.attributes, context]);
          }
          if (node[1].tag_contents) {
            walk.apply(null, [node[1].tag_contents, context]);
          }
          break;
        case "TORNADO_BODY":
          if (node[1].params) {
            walk.apply(null, [node[1].params, context]);
          }
          if (node[1].bodies) {
            walk.apply(null, [node[1].bodies, context]);
          }
          if (node[1].body) {
            walk.apply(null, [node[1].body, context]);
          }
          break;
        case "TORNADO_PARTIAL":
          if (node[1].params) {
            walk.apply(null, [node[1].params, context]);
          }
          break;
        case "HTML_ATTRIBUTE":
          if (node[1].value) {
            walk.apply(null, [node[1].value, context]);
          }
      }

      context.stack.pop(leaveMethod);
      return output;
    };

    var walk = function walk(_x, context) {
      var nodes = arguments[0] === undefined ? [] : arguments[0];

      nodes.forEach(function (n, index) {
        step.apply(null, [n, index, context]);
      });
    };

    return walk;
  }
};
module.exports = visitor;
//# sourceMappingURL=visitor.js.map
},{}],15:[function(require,module,exports){
"use strict";

var emptyFrag = function emptyFrag() {
  return document.createDocumentFragment();
};

var truthTest = function truthTest(params, bodies, context, test) {
  var key = params.key;
  var val = params.val;
  var main = bodies.main;

  var elseBody = bodies["else"];
  if (key && val) {
    if (test(key, val)) {
      if (main) {
        return main(context);
      }
    } else if (elseBody) {
      return elseBody(context);
    }
  }

  // There are no appropriate bodies, so return an empty fragment
  return emptyFrag();
};

var helpers = {
  eq: function eq(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left === right;
    });
  },
  ne: function ne(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left !== right;
    });
  },
  gt: function gt(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left > right;
    });
  },
  lt: function lt(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left < right;
    });
  },
  gte: function gte(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left >= right;
    });
  },
  lte: function lte(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left <= right;
    });
  }
};

module.exports = helpers;
//# sourceMappingURL=helpers.js.map
},{}],16:[function(require,module,exports){
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = function(n) {
            return [['TORNADO_BODY'].concat([{name: null, type: 'bodies', body: n}])];
          },
        peg$c1 = [],
        peg$c2 = peg$FAILED,
        peg$c3 = function(e, contents) {
            return ['HTML_ELEMENT',{
              tag_info: e,
              tag_contents: contents
            }];
          },
        peg$c4 = function(e) {
            return ['HTML_ELEMENT', {
              tag_info: e
            }]
          },
        peg$c5 = function(k, a) {
            return {key: k, attributes: a};
          },
        peg$c6 = "/",
        peg$c7 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c8 = /^[a-zA-Z0-9\-]/,
        peg$c9 = { type: "class", value: "[a-zA-Z0-9\\-]", description: "[a-zA-Z0-9\\-]" },
        peg$c10 = function(k) {
            return k.join('');
          },
        peg$c11 = function(name, val) {
            return ['HTML_ATTRIBUTE', {
              attrName: name,
              value: val
            }];
           },
        peg$c12 = function(name, val) {
            return ['HTML_ATTRIBUTE', {
              attrName: name,
              value: val
            }];
          },
        peg$c13 = function(name) {
            return ['HTML_ATTRIBUTE', {
              attrName: name
            }];
          },
        peg$c14 = function(a) {return a;},
        peg$c15 = function(a) {
            return a;
          },
        peg$c16 = void 0,
        peg$c17 = /^[^\/]/,
        peg$c18 = { type: "class", value: "[^\\/]", description: "[^\\/]" },
        peg$c19 = function(char) {return char;},
        peg$c20 = function(name) {
            return name.join('');
          },
        peg$c21 = "<!--",
        peg$c22 = { type: "literal", value: "<!--", description: "\"<!--\"" },
        peg$c23 = "-->",
        peg$c24 = { type: "literal", value: "-->", description: "\"-->\"" },
        peg$c25 = { type: "any", description: "any character" },
        peg$c26 = function(c) {return c;},
        peg$c27 = function(comment) {
            return ['HTML_COMMENT', comment.join('')]
          },
        peg$c28 = "!",
        peg$c29 = { type: "literal", value: "!", description: "\"!\"" },
        peg$c30 = "!}",
        peg$c31 = { type: "literal", value: "!}", description: "\"!}\"" },
        peg$c32 = function(comment) {
            return ['TORNADO_COMMENT', comment.join('')]
          },
        peg$c33 = function(start, contents, bodies, end) {
            if(!end || start.key !== end.key) {
              error('Expected end tag for "' + start.key + '" ' + start.type + ' body, start tag was "' + start.key + '" and end tag was "' + end.key + '"');
            }
            return true;
          },
        peg$c34 = function(start, contents, bodies, end) {
            // combine the default body into bodies
            start.bodies = bodies;
            start.body = contents;
            start.key = start.key.split('.');
            return ['TORNADO_BODY', start];
          },
        peg$c35 = function(start) {
            start.bodies = [];
            start.key = start.key.split('.');
            return ['TORNADO_BODY', start];
          },
        peg$c36 = ":",
        peg$c37 = { type: "literal", value: ":", description: "\":\"" },
        peg$c38 = function(type, contents) {return ['TORNADO_BODY', {name: type, type: 'bodies', body: contents}];},
        peg$c39 = function(b) {
            return b;
          },
        peg$c40 = /^[#?\^<+@%]/,
        peg$c41 = { type: "class", value: "[#?\\^<+@%]", description: "[#?\\^<+@%]" },
        peg$c42 = function(type, id, p) {
            return {
              type: tornadoBodyTypes[type],
              key: id,
              params: p
            };
          },
        peg$c43 = function(id) {
            return {key: id};
          },
        peg$c44 = function(r, filters) {
            var key = r.split('.');
            if (r === '.') {
              key = [];
            }
            return ['TORNADO_REFERENCE', {key: key, filters: filters}]
          },
        peg$c45 = function(key, params) {
            return ['TORNADO_PARTIAL', {
              key: key,
              params: params
            }];
          },
        peg$c46 = /^[a-zA-Z_$.]/,
        peg$c47 = { type: "class", value: "[a-zA-Z_$.]", description: "[a-zA-Z_$.]" },
        peg$c48 = /^[a-zA-Z0-9_$-.]/,
        peg$c49 = { type: "class", value: "[a-zA-Z0-9_$-.]", description: "[a-zA-Z0-9_$-.]" },
        peg$c50 = function(first, after) {
            return first + after.join('');
          },
        peg$c51 = ".",
        peg$c52 = { type: "literal", value: ".", description: "\".\"" },
        peg$c53 = function(k) {return k},
        peg$c54 = function(d) { return d; },
        peg$c55 = "|",
        peg$c56 = { type: "literal", value: "|", description: "\"|\"" },
        peg$c57 = function(type) {return {type: type};},
        peg$c58 = function(p) {return p;},
        peg$c59 = function(p) {
            return p;
          },
        peg$c60 = function(key, val) {
            return ['TORNADO_PARAM', {
              key: key,
              val: val
            }]
          },
        peg$c61 = function(key, val) {
            return ['TORNADO_PARAM', {
              key: key,
              val: ['TORNADO_REFERENCE', {key: val.split('.'), filters: []}]
            }]
          },
        peg$c62 = /^[#?\^><+%:@\/~%]/,
        peg$c63 = { type: "class", value: "[#?\\^><+%:@\\/~%]", description: "[#?\\^><+%:@\\/~%]" },
        peg$c64 = function(n) {
            return n.join('');
          },
        peg$c65 = { type: "other", description: "number" },
        peg$c66 = function(n) { return n; },
        peg$c67 = { type: "other", description: "float" },
        peg$c68 = function(l, r) { return parseFloat(l + "." + r.join('')); },
        peg$c69 = { type: "other", description: "integer" },
        peg$c70 = /^[0-9]/,
        peg$c71 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c72 = function(digits) { return parseInt(digits.join(""), 10); },
        peg$c73 = function(b) {
            return ['PLAIN_TEXT', b.join('').replace(/\n/g, '\\n')];
          },
        peg$c74 = function(entity) {
            return ['HTML_ENTITY', entity.join('')];
          },
        peg$c75 = /^[#a-zA-Z0-9]/,
        peg$c76 = { type: "class", value: "[#a-zA-Z0-9]", description: "[#a-zA-Z0-9]" },
        peg$c77 = function(char) {
            return char.join('');
          },
        peg$c78 = function(b) {
            return ['PLAIN_TEXT', b.join('')];
          },
        peg$c79 = /^[^`]/,
        peg$c80 = { type: "class", value: "[^`]", description: "[^`]" },
        peg$c81 = function(val) {
            return ['PLAIN_TEXT', val.join('')];
          },
        peg$c82 = /^[\t\x0B\f\n \xA0\uFEFF]/,
        peg$c83 = { type: "class", value: "[\\t\\x0B\\f\\n \\xA0\\uFEFF]", description: "[\\t\\x0B\\f\\n \\xA0\\uFEFF]" },
        peg$c84 = "</",
        peg$c85 = { type: "literal", value: "</", description: "\"</\"" },
        peg$c86 = "<",
        peg$c87 = { type: "literal", value: "<", description: "\"<\"" },
        peg$c88 = ">",
        peg$c89 = { type: "literal", value: ">", description: "\">\"" },
        peg$c90 = "/>",
        peg$c91 = { type: "literal", value: "/>", description: "\"/>\"" },
        peg$c92 = "{/",
        peg$c93 = { type: "literal", value: "{/", description: "\"{/\"" },
        peg$c94 = "/}",
        peg$c95 = { type: "literal", value: "/}", description: "\"/}\"" },
        peg$c96 = "{",
        peg$c97 = { type: "literal", value: "{", description: "\"{\"" },
        peg$c98 = "}",
        peg$c99 = { type: "literal", value: "}", description: "\"}\"" },
        peg$c100 = "=",
        peg$c101 = { type: "literal", value: "=", description: "\"=\"" },
        peg$c102 = "\"",
        peg$c103 = { type: "literal", value: "\"", description: "\"\\\"\"" },
        peg$c104 = "'",
        peg$c105 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c106 = "&",
        peg$c107 = { type: "literal", value: "&", description: "\"&\"" },
        peg$c108 = ";",
        peg$c109 = { type: "literal", value: ";", description: "\";\"" },
        peg$c110 = /^[^"]/,
        peg$c111 = { type: "class", value: "[^\"]", description: "[^\"]" },
        peg$c112 = "\n",
        peg$c113 = { type: "literal", value: "\n", description: "\"\\n\"" },
        peg$c114 = "\r\n",
        peg$c115 = { type: "literal", value: "\r\n", description: "\"\\r\\n\"" },
        peg$c116 = "\r",
        peg$c117 = { type: "literal", value: "\r", description: "\"\\r\"" },
        peg$c118 = "\u2028",
        peg$c119 = { type: "literal", value: "\u2028", description: "\"\\u2028\"" },
        peg$c120 = "\u2029",
        peg$c121 = { type: "literal", value: "\u2029", description: "\"\\u2029\"" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsenodes();
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c0(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsenodes() {
      var s0, s1;

      s0 = [];
      s1 = peg$parsepart();
      if (s1 === peg$FAILED) {
        s1 = peg$parseplain_text();
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parsepart();
        if (s1 === peg$FAILED) {
          s1 = peg$parseplain_text();
        }
      }

      return s0;
    }

    function peg$parsepart() {
      var s0;

      s0 = peg$parseelement();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment();
        if (s0 === peg$FAILED) {
          s0 = peg$parsehtml_entity();
          if (s0 === peg$FAILED) {
            s0 = peg$parsetornado_comment();
            if (s0 === peg$FAILED) {
              s0 = peg$parsetornado_body();
              if (s0 === peg$FAILED) {
                s0 = peg$parsetornado_partial();
                if (s0 === peg$FAILED) {
                  s0 = peg$parsetornado_reference();
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseattr_part() {
      var s0;

      s0 = peg$parsetornado_comment();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetornado_body();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetornado_reference();
          if (s0 === peg$FAILED) {
            s0 = peg$parsetornado_partial();
            if (s0 === peg$FAILED) {
              s0 = peg$parsehtml_entity();
              if (s0 === peg$FAILED) {
                s0 = peg$parseattr_text();
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsesingle_quote_attr_part() {
      var s0;

      s0 = peg$parsetornado_comment();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetornado_body();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetornado_reference();
          if (s0 === peg$FAILED) {
            s0 = peg$parsetornado_partial();
            if (s0 === peg$FAILED) {
              s0 = peg$parsehtml_entity();
              if (s0 === peg$FAILED) {
                s0 = peg$parsesingle_quote_attr_text();
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseelement() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsestart_tag();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenodes();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseend_tag();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c3(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseself_closing_tag();
        if (s1 === peg$FAILED) {
          s1 = peg$parsestart_tag();
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c4(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parsestart_tag() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parselangle();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsekey();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseattributes();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsews();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsews();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parserangle();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c5(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parseself_closing_tag() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parselangle();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsekey();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseattributes();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsews();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsews();
            }
            if (s4 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 47) {
                s5 = peg$c6;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c7); }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parserangle();
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c5(s2, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parseend_tag() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parselangleslash();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsekey();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsews();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsews();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parserangle();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsekey() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c8.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c9); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c8.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c9); }
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c10(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseattribute() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parseattribute_name();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsews();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsews();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseequals();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsews();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsews();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsequote();
              if (s5 !== peg$FAILED) {
                s6 = [];
                s7 = peg$parseattr_part();
                while (s7 !== peg$FAILED) {
                  s6.push(s7);
                  s7 = peg$parseattr_part();
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsequote();
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c11(s1, s6);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseattribute_name();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsews();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsews();
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseequals();
            if (s3 !== peg$FAILED) {
              s4 = [];
              s5 = peg$parsews();
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$parsews();
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parsesingle_quote();
                if (s5 !== peg$FAILED) {
                  s6 = [];
                  s7 = peg$parsesingle_quote_attr_part();
                  while (s7 !== peg$FAILED) {
                    s6.push(s7);
                    s7 = peg$parsesingle_quote_attr_part();
                  }
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parsesingle_quote();
                    if (s7 !== peg$FAILED) {
                      peg$reportedPos = s0;
                      s1 = peg$c12(s1, s6);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseattribute_name();
          if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parsews();
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parsews();
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseequals();
              if (s3 !== peg$FAILED) {
                s4 = [];
                s5 = peg$parsews();
                while (s5 !== peg$FAILED) {
                  s4.push(s5);
                  s5 = peg$parsews();
                }
                if (s4 !== peg$FAILED) {
                  s5 = peg$parsetornado_reference();
                  if (s5 === peg$FAILED) {
                    s5 = peg$parseno_quote_attr_text();
                  }
                  if (s5 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c12(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseattribute_name();
            if (s1 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c13(s1);
            }
            s0 = s1;
          }
        }
      }

      return s0;
    }

    function peg$parseattributes() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = [];
      s4 = peg$parsews();
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parsews();
        }
      } else {
        s3 = peg$c2;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parseattribute();
        if (s4 !== peg$FAILED) {
          peg$reportedPos = s2;
          s3 = peg$c14(s4);
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = [];
        s4 = peg$parsews();
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsews();
          }
        } else {
          s3 = peg$c2;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseattribute();
          if (s4 !== peg$FAILED) {
            peg$reportedPos = s2;
            s3 = peg$c14(s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c15(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseattribute_name() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$currPos;
      peg$silentFails++;
      s4 = peg$parsews();
      peg$silentFails--;
      if (s4 === peg$FAILED) {
        s3 = peg$c16;
      } else {
        peg$currPos = s3;
        s3 = peg$c2;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsequote();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c16;
        } else {
          peg$currPos = s4;
          s4 = peg$c2;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          peg$silentFails++;
          s6 = peg$parsesingle_quote();
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = peg$c16;
          } else {
            peg$currPos = s5;
            s5 = peg$c2;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$currPos;
            peg$silentFails++;
            s7 = peg$parserangle();
            peg$silentFails--;
            if (s7 === peg$FAILED) {
              s6 = peg$c16;
            } else {
              peg$currPos = s6;
              s6 = peg$c2;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$currPos;
              peg$silentFails++;
              s8 = peg$parseequals();
              peg$silentFails--;
              if (s8 === peg$FAILED) {
                s7 = peg$c16;
              } else {
                peg$currPos = s7;
                s7 = peg$c2;
              }
              if (s7 !== peg$FAILED) {
                if (peg$c17.test(input.charAt(peg$currPos))) {
                  s8 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s8 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c18); }
                }
                if (s8 !== peg$FAILED) {
                  peg$reportedPos = s2;
                  s3 = peg$c19(s8);
                  s2 = s3;
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parsews();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c16;
          } else {
            peg$currPos = s3;
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            peg$silentFails++;
            s5 = peg$parsequote();
            peg$silentFails--;
            if (s5 === peg$FAILED) {
              s4 = peg$c16;
            } else {
              peg$currPos = s4;
              s4 = peg$c2;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              peg$silentFails++;
              s6 = peg$parsesingle_quote();
              peg$silentFails--;
              if (s6 === peg$FAILED) {
                s5 = peg$c16;
              } else {
                peg$currPos = s5;
                s5 = peg$c2;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$currPos;
                peg$silentFails++;
                s7 = peg$parserangle();
                peg$silentFails--;
                if (s7 === peg$FAILED) {
                  s6 = peg$c16;
                } else {
                  peg$currPos = s6;
                  s6 = peg$c2;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$currPos;
                  peg$silentFails++;
                  s8 = peg$parseequals();
                  peg$silentFails--;
                  if (s8 === peg$FAILED) {
                    s7 = peg$c16;
                  } else {
                    peg$currPos = s7;
                    s7 = peg$c2;
                  }
                  if (s7 !== peg$FAILED) {
                    if (peg$c17.test(input.charAt(peg$currPos))) {
                      s8 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s8 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c18); }
                    }
                    if (s8 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c19(s8);
                      s2 = s3;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c2;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c20(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecomment() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c21) {
        s1 = peg$c21;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c22); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 3) === peg$c23) {
          s5 = peg$c23;
          peg$currPos += 3;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c24); }
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c16;
        } else {
          peg$currPos = s4;
          s4 = peg$c2;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s5 !== peg$FAILED) {
            peg$reportedPos = s3;
            s4 = peg$c26(s5);
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$c2;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c2;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 3) === peg$c23) {
            s5 = peg$c23;
            peg$currPos += 3;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c24); }
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = peg$c16;
          } else {
            peg$currPos = s4;
            s4 = peg$c2;
          }
          if (s4 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c25); }
            }
            if (s5 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c26(s5);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c2;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c2;
          }
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c23) {
            s3 = peg$c23;
            peg$currPos += 3;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c24); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c27(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsetornado_comment() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parselbrace();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 33) {
          s2 = peg$c28;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c30) {
            s6 = peg$c30;
            peg$currPos += 2;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c31); }
          }
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = peg$c16;
          } else {
            peg$currPos = s5;
            s5 = peg$c2;
          }
          if (s5 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c25); }
            }
            if (s6 !== peg$FAILED) {
              peg$reportedPos = s4;
              s5 = peg$c26(s6);
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$c2;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$c2;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$currPos;
            peg$silentFails++;
            if (input.substr(peg$currPos, 2) === peg$c30) {
              s6 = peg$c30;
              peg$currPos += 2;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c31); }
            }
            peg$silentFails--;
            if (s6 === peg$FAILED) {
              s5 = peg$c16;
            } else {
              peg$currPos = s5;
              s5 = peg$c2;
            }
            if (s5 !== peg$FAILED) {
              if (input.length > peg$currPos) {
                s6 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c25); }
              }
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s4;
                s5 = peg$c26(s6);
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$c2;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$c2;
            }
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 33) {
              s4 = peg$c28;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c29); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parserbrace();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c32(s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsetornado_body() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parsetornado_body_tag_start();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsews();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsews();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parserbrace();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsenodes();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsetornado_bodies();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsetornado_body_tag_end();
                if (s6 !== peg$FAILED) {
                  peg$reportedPos = peg$currPos;
                  s7 = peg$c33(s1, s4, s5, s6);
                  if (s7) {
                    s7 = peg$c16;
                  } else {
                    s7 = peg$c2;
                  }
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c34(s1, s4, s5, s6);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsetornado_body_tag_start();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parsews();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsews();
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 47) {
              s3 = peg$c6;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c7); }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parserbrace();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c35(s1);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      }

      return s0;
    }

    function peg$parsetornado_bodies() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$parselbrace();
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 58) {
          s4 = peg$c36;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsekey();
          if (s5 !== peg$FAILED) {
            s6 = peg$parserbrace();
            if (s6 !== peg$FAILED) {
              s7 = peg$parsenodes();
              if (s7 !== peg$FAILED) {
                peg$reportedPos = s2;
                s3 = peg$c38(s5, s7);
                s2 = s3;
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = peg$parselbrace();
        if (s3 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s4 = peg$c36;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsekey();
            if (s5 !== peg$FAILED) {
              s6 = peg$parserbrace();
              if (s6 !== peg$FAILED) {
                s7 = peg$parsenodes();
                if (s7 !== peg$FAILED) {
                  peg$reportedPos = s2;
                  s3 = peg$c38(s5, s7);
                  s2 = s3;
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c39(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsetornado_body_type() {
      var s0;

      if (peg$c40.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c41); }
      }

      return s0;
    }

    function peg$parsetornado_body_tag_start() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parselbrace();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetornado_body_type();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsews();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsews();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsetornado_key();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsetornado_params();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c42(s2, s4, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsetornado_body_tag_end() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parselbraceslash();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetornado_key();
        if (s2 !== peg$FAILED) {
          s3 = peg$parserbrace();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c43(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsetornado_reference() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parselbrace();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetornado_key();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetornado_filters();
          if (s3 !== peg$FAILED) {
            s4 = peg$parserbrace();
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c44(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsetornado_partial() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parselbrace();
      if (s1 !== peg$FAILED) {
        s2 = peg$parserangle();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsews();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsews();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsetornado_key();
            if (s4 === peg$FAILED) {
              s4 = peg$parsestring();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsetornado_params();
              if (s5 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 47) {
                  s6 = peg$c6;
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c7); }
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parserbrace();
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c45(s4, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsetornado_key() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (peg$c46.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c48.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c49); }
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          if (peg$c48.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c49); }
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c50(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsetornado_array_part() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s3 = peg$c51;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c52); }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parsetornado_key();
        if (s4 !== peg$FAILED) {
          peg$reportedPos = s2;
          s3 = peg$c53(s4);
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 46) {
            s3 = peg$c51;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c52); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsetornado_key();
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s2;
              s3 = peg$c53(s4);
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c54(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsetornado_filters() {
      var s0, s1, s2, s3;

      s0 = [];
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 124) {
        s2 = peg$c55;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsekey();
        if (s3 !== peg$FAILED) {
          peg$reportedPos = s1;
          s2 = peg$c57(s3);
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$c2;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c2;
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 124) {
          s2 = peg$c55;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c56); }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsekey();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s1;
            s2 = peg$c57(s3);
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c2;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c2;
        }
      }

      return s0;
    }

    function peg$parsetornado_params() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = [];
      s4 = peg$parsews();
      if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parsews();
        }
      } else {
        s3 = peg$c2;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parsetornado_param();
        if (s4 !== peg$FAILED) {
          peg$reportedPos = s2;
          s3 = peg$c58(s4);
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$currPos;
        s3 = [];
        s4 = peg$parsews();
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsews();
          }
        } else {
          s3 = peg$c2;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parsetornado_param();
          if (s4 !== peg$FAILED) {
            peg$reportedPos = s2;
            s3 = peg$c58(s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c59(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsetornado_param() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsekey();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseequals();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsenumber();
          if (s3 === peg$FAILED) {
            s3 = peg$parsestring();
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c60(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsekey();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseequals();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsetornado_key();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c61(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      }

      return s0;
    }

    function peg$parsetornado_tag() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      s1 = peg$parselbrace();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsews();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsews();
        }
        if (s2 !== peg$FAILED) {
          if (peg$c62.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c63); }
          }
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$currPos;
            s6 = peg$currPos;
            peg$silentFails++;
            s7 = peg$parserbrace();
            peg$silentFails--;
            if (s7 === peg$FAILED) {
              s6 = peg$c16;
            } else {
              peg$currPos = s6;
              s6 = peg$c2;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$currPos;
              peg$silentFails++;
              s8 = peg$parseeol();
              peg$silentFails--;
              if (s8 === peg$FAILED) {
                s7 = peg$c16;
              } else {
                peg$currPos = s7;
                s7 = peg$c2;
              }
              if (s7 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                  s8 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s8 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c25); }
                }
                if (s8 !== peg$FAILED) {
                  s6 = [s6, s7, s8];
                  s5 = s6;
                } else {
                  peg$currPos = s5;
                  s5 = peg$c2;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$c2;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$c2;
            }
            if (s5 !== peg$FAILED) {
              while (s5 !== peg$FAILED) {
                s4.push(s5);
                s5 = peg$currPos;
                s6 = peg$currPos;
                peg$silentFails++;
                s7 = peg$parserbrace();
                peg$silentFails--;
                if (s7 === peg$FAILED) {
                  s6 = peg$c16;
                } else {
                  peg$currPos = s6;
                  s6 = peg$c2;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$currPos;
                  peg$silentFails++;
                  s8 = peg$parseeol();
                  peg$silentFails--;
                  if (s8 === peg$FAILED) {
                    s7 = peg$c16;
                  } else {
                    peg$currPos = s7;
                    s7 = peg$c2;
                  }
                  if (s7 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                      s8 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s8 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c25); }
                    }
                    if (s8 !== peg$FAILED) {
                      s6 = [s6, s7, s8];
                      s5 = s6;
                    } else {
                      peg$currPos = s5;
                      s5 = peg$c2;
                    }
                  } else {
                    peg$currPos = s5;
                    s5 = peg$c2;
                  }
                } else {
                  peg$currPos = s5;
                  s5 = peg$c2;
                }
              }
            } else {
              s4 = peg$c2;
            }
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parsews();
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$parsews();
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parserbrace();
                if (s6 !== peg$FAILED) {
                  s1 = [s1, s2, s3, s4, s5, s6];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsetornado_reference();
      }

      return s0;
    }

    function peg$parsestring() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsequote();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenon_quote();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsenon_quote();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsequote();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c64(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsenumber() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsefloat();
      if (s1 === peg$FAILED) {
        s1 = peg$parseinteger();
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c66(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c65); }
      }

      return s0;
    }

    function peg$parsefloat() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinteger();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s2 = peg$c51;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c52); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseinteger();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseinteger();
            }
          } else {
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c68(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c67); }
      }

      return s0;
    }

    function peg$parseinteger() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c70.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c71); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c70.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c71); }
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c72(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c69); }
      }

      return s0;
    }

    function peg$parseplain_text() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$currPos;
      peg$silentFails++;
      s4 = peg$parsecomment();
      peg$silentFails--;
      if (s4 === peg$FAILED) {
        s3 = peg$c16;
      } else {
        peg$currPos = s3;
        s3 = peg$c2;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsetornado_comment();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c16;
        } else {
          peg$currPos = s4;
          s4 = peg$c2;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          peg$silentFails++;
          s6 = peg$parsestart_tag();
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = peg$c16;
          } else {
            peg$currPos = s5;
            s5 = peg$c2;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$currPos;
            peg$silentFails++;
            s7 = peg$parseend_tag();
            peg$silentFails--;
            if (s7 === peg$FAILED) {
              s6 = peg$c16;
            } else {
              peg$currPos = s6;
              s6 = peg$c2;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$currPos;
              peg$silentFails++;
              s8 = peg$parseself_closing_tag();
              peg$silentFails--;
              if (s8 === peg$FAILED) {
                s7 = peg$c16;
              } else {
                peg$currPos = s7;
                s7 = peg$c2;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$currPos;
                peg$silentFails++;
                s9 = peg$parsehtml_entity();
                peg$silentFails--;
                if (s9 === peg$FAILED) {
                  s8 = peg$c16;
                } else {
                  peg$currPos = s8;
                  s8 = peg$c2;
                }
                if (s8 !== peg$FAILED) {
                  s9 = peg$currPos;
                  peg$silentFails++;
                  s10 = peg$parsetornado_tag();
                  peg$silentFails--;
                  if (s10 === peg$FAILED) {
                    s9 = peg$c16;
                  } else {
                    peg$currPos = s9;
                    s9 = peg$c2;
                  }
                  if (s9 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                      s10 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s10 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c25); }
                    }
                    if (s10 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c26(s10);
                      s2 = s3;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c2;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parsecomment();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c16;
          } else {
            peg$currPos = s3;
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            peg$silentFails++;
            s5 = peg$parsetornado_comment();
            peg$silentFails--;
            if (s5 === peg$FAILED) {
              s4 = peg$c16;
            } else {
              peg$currPos = s4;
              s4 = peg$c2;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              peg$silentFails++;
              s6 = peg$parsestart_tag();
              peg$silentFails--;
              if (s6 === peg$FAILED) {
                s5 = peg$c16;
              } else {
                peg$currPos = s5;
                s5 = peg$c2;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$currPos;
                peg$silentFails++;
                s7 = peg$parseend_tag();
                peg$silentFails--;
                if (s7 === peg$FAILED) {
                  s6 = peg$c16;
                } else {
                  peg$currPos = s6;
                  s6 = peg$c2;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$currPos;
                  peg$silentFails++;
                  s8 = peg$parseself_closing_tag();
                  peg$silentFails--;
                  if (s8 === peg$FAILED) {
                    s7 = peg$c16;
                  } else {
                    peg$currPos = s7;
                    s7 = peg$c2;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$currPos;
                    peg$silentFails++;
                    s9 = peg$parsehtml_entity();
                    peg$silentFails--;
                    if (s9 === peg$FAILED) {
                      s8 = peg$c16;
                    } else {
                      peg$currPos = s8;
                      s8 = peg$c2;
                    }
                    if (s8 !== peg$FAILED) {
                      s9 = peg$currPos;
                      peg$silentFails++;
                      s10 = peg$parsetornado_tag();
                      peg$silentFails--;
                      if (s10 === peg$FAILED) {
                        s9 = peg$c16;
                      } else {
                        peg$currPos = s9;
                        s9 = peg$c2;
                      }
                      if (s9 !== peg$FAILED) {
                        if (input.length > peg$currPos) {
                          s10 = input.charAt(peg$currPos);
                          peg$currPos++;
                        } else {
                          s10 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c25); }
                        }
                        if (s10 !== peg$FAILED) {
                          peg$reportedPos = s2;
                          s3 = peg$c26(s10);
                          s2 = s3;
                        } else {
                          peg$currPos = s2;
                          s2 = peg$c2;
                        }
                      } else {
                        peg$currPos = s2;
                        s2 = peg$c2;
                      }
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c2;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c73(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsehtml_entity() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseampersand();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseentity_chars();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesemicolon();
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c2;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c2;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c74(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseentity_chars() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c75.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c76); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c75.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c76); }
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c77(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseattr_text() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$currPos;
      peg$silentFails++;
      s4 = peg$parsetornado_comment();
      peg$silentFails--;
      if (s4 === peg$FAILED) {
        s3 = peg$c16;
      } else {
        peg$currPos = s3;
        s3 = peg$c2;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsetornado_body();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c16;
        } else {
          peg$currPos = s4;
          s4 = peg$c2;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          peg$silentFails++;
          s6 = peg$parsetornado_reference();
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = peg$c16;
          } else {
            peg$currPos = s5;
            s5 = peg$c2;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$currPos;
            peg$silentFails++;
            s7 = peg$parsetornado_partial();
            peg$silentFails--;
            if (s7 === peg$FAILED) {
              s6 = peg$c16;
            } else {
              peg$currPos = s6;
              s6 = peg$c2;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$currPos;
              peg$silentFails++;
              s8 = peg$parsehtml_entity();
              peg$silentFails--;
              if (s8 === peg$FAILED) {
                s7 = peg$c16;
              } else {
                peg$currPos = s7;
                s7 = peg$c2;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$currPos;
                peg$silentFails++;
                s9 = peg$parsequote();
                peg$silentFails--;
                if (s9 === peg$FAILED) {
                  s8 = peg$c16;
                } else {
                  peg$currPos = s8;
                  s8 = peg$c2;
                }
                if (s8 !== peg$FAILED) {
                  if (input.length > peg$currPos) {
                    s9 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s9 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c25); }
                  }
                  if (s9 !== peg$FAILED) {
                    peg$reportedPos = s2;
                    s3 = peg$c26(s9);
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parsetornado_comment();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c16;
          } else {
            peg$currPos = s3;
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            peg$silentFails++;
            s5 = peg$parsetornado_body();
            peg$silentFails--;
            if (s5 === peg$FAILED) {
              s4 = peg$c16;
            } else {
              peg$currPos = s4;
              s4 = peg$c2;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              peg$silentFails++;
              s6 = peg$parsetornado_reference();
              peg$silentFails--;
              if (s6 === peg$FAILED) {
                s5 = peg$c16;
              } else {
                peg$currPos = s5;
                s5 = peg$c2;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$currPos;
                peg$silentFails++;
                s7 = peg$parsetornado_partial();
                peg$silentFails--;
                if (s7 === peg$FAILED) {
                  s6 = peg$c16;
                } else {
                  peg$currPos = s6;
                  s6 = peg$c2;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$currPos;
                  peg$silentFails++;
                  s8 = peg$parsehtml_entity();
                  peg$silentFails--;
                  if (s8 === peg$FAILED) {
                    s7 = peg$c16;
                  } else {
                    peg$currPos = s7;
                    s7 = peg$c2;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$currPos;
                    peg$silentFails++;
                    s9 = peg$parsequote();
                    peg$silentFails--;
                    if (s9 === peg$FAILED) {
                      s8 = peg$c16;
                    } else {
                      peg$currPos = s8;
                      s8 = peg$c2;
                    }
                    if (s8 !== peg$FAILED) {
                      if (input.length > peg$currPos) {
                        s9 = input.charAt(peg$currPos);
                        peg$currPos++;
                      } else {
                        s9 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c25); }
                      }
                      if (s9 !== peg$FAILED) {
                        peg$reportedPos = s2;
                        s3 = peg$c26(s9);
                        s2 = s3;
                      } else {
                        peg$currPos = s2;
                        s2 = peg$c2;
                      }
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c2;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c78(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsesingle_quote_attr_text() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$currPos;
      peg$silentFails++;
      s4 = peg$parsetornado_comment();
      peg$silentFails--;
      if (s4 === peg$FAILED) {
        s3 = peg$c16;
      } else {
        peg$currPos = s3;
        s3 = peg$c2;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsetornado_body();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c16;
        } else {
          peg$currPos = s4;
          s4 = peg$c2;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          peg$silentFails++;
          s6 = peg$parsetornado_reference();
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = peg$c16;
          } else {
            peg$currPos = s5;
            s5 = peg$c2;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$currPos;
            peg$silentFails++;
            s7 = peg$parsetornado_partial();
            peg$silentFails--;
            if (s7 === peg$FAILED) {
              s6 = peg$c16;
            } else {
              peg$currPos = s6;
              s6 = peg$c2;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$currPos;
              peg$silentFails++;
              s8 = peg$parsehtml_entity();
              peg$silentFails--;
              if (s8 === peg$FAILED) {
                s7 = peg$c16;
              } else {
                peg$currPos = s7;
                s7 = peg$c2;
              }
              if (s7 !== peg$FAILED) {
                s8 = peg$currPos;
                peg$silentFails++;
                s9 = peg$parsesingle_quote();
                peg$silentFails--;
                if (s9 === peg$FAILED) {
                  s8 = peg$c16;
                } else {
                  peg$currPos = s8;
                  s8 = peg$c2;
                }
                if (s8 !== peg$FAILED) {
                  if (input.length > peg$currPos) {
                    s9 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s9 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c25); }
                  }
                  if (s9 !== peg$FAILED) {
                    peg$reportedPos = s2;
                    s3 = peg$c26(s9);
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parsetornado_comment();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c16;
          } else {
            peg$currPos = s3;
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            peg$silentFails++;
            s5 = peg$parsetornado_body();
            peg$silentFails--;
            if (s5 === peg$FAILED) {
              s4 = peg$c16;
            } else {
              peg$currPos = s4;
              s4 = peg$c2;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              peg$silentFails++;
              s6 = peg$parsetornado_reference();
              peg$silentFails--;
              if (s6 === peg$FAILED) {
                s5 = peg$c16;
              } else {
                peg$currPos = s5;
                s5 = peg$c2;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$currPos;
                peg$silentFails++;
                s7 = peg$parsetornado_partial();
                peg$silentFails--;
                if (s7 === peg$FAILED) {
                  s6 = peg$c16;
                } else {
                  peg$currPos = s6;
                  s6 = peg$c2;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$currPos;
                  peg$silentFails++;
                  s8 = peg$parsehtml_entity();
                  peg$silentFails--;
                  if (s8 === peg$FAILED) {
                    s7 = peg$c16;
                  } else {
                    peg$currPos = s7;
                    s7 = peg$c2;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$currPos;
                    peg$silentFails++;
                    s9 = peg$parsesingle_quote();
                    peg$silentFails--;
                    if (s9 === peg$FAILED) {
                      s8 = peg$c16;
                    } else {
                      peg$currPos = s8;
                      s8 = peg$c2;
                    }
                    if (s8 !== peg$FAILED) {
                      if (input.length > peg$currPos) {
                        s9 = input.charAt(peg$currPos);
                        peg$currPos++;
                      } else {
                        s9 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c25); }
                      }
                      if (s9 !== peg$FAILED) {
                        peg$reportedPos = s2;
                        s3 = peg$c26(s9);
                        s2 = s3;
                      } else {
                        peg$currPos = s2;
                        s2 = peg$c2;
                      }
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c2;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c78(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseno_quote_attr_text() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$currPos;
      peg$silentFails++;
      s4 = peg$parsequote();
      peg$silentFails--;
      if (s4 === peg$FAILED) {
        s3 = peg$c16;
      } else {
        peg$currPos = s3;
        s3 = peg$c2;
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsesingle_quote();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = peg$c16;
        } else {
          peg$currPos = s4;
          s4 = peg$c2;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          peg$silentFails++;
          s6 = peg$parseequals();
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = peg$c16;
          } else {
            peg$currPos = s5;
            s5 = peg$c2;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$currPos;
            peg$silentFails++;
            s7 = peg$parselangle();
            peg$silentFails--;
            if (s7 === peg$FAILED) {
              s6 = peg$c16;
            } else {
              peg$currPos = s6;
              s6 = peg$c2;
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$currPos;
              peg$silentFails++;
              s8 = peg$parserangle();
              peg$silentFails--;
              if (s8 === peg$FAILED) {
                s7 = peg$c16;
              } else {
                peg$currPos = s7;
                s7 = peg$c2;
              }
              if (s7 !== peg$FAILED) {
                if (peg$c79.test(input.charAt(peg$currPos))) {
                  s8 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s8 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c80); }
                }
                if (s8 !== peg$FAILED) {
                  peg$reportedPos = s2;
                  s3 = peg$c19(s8);
                  s2 = s3;
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c2;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$c2;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$currPos;
          peg$silentFails++;
          s4 = peg$parsequote();
          peg$silentFails--;
          if (s4 === peg$FAILED) {
            s3 = peg$c16;
          } else {
            peg$currPos = s3;
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            peg$silentFails++;
            s5 = peg$parsesingle_quote();
            peg$silentFails--;
            if (s5 === peg$FAILED) {
              s4 = peg$c16;
            } else {
              peg$currPos = s4;
              s4 = peg$c2;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              peg$silentFails++;
              s6 = peg$parseequals();
              peg$silentFails--;
              if (s6 === peg$FAILED) {
                s5 = peg$c16;
              } else {
                peg$currPos = s5;
                s5 = peg$c2;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$currPos;
                peg$silentFails++;
                s7 = peg$parselangle();
                peg$silentFails--;
                if (s7 === peg$FAILED) {
                  s6 = peg$c16;
                } else {
                  peg$currPos = s6;
                  s6 = peg$c2;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$currPos;
                  peg$silentFails++;
                  s8 = peg$parserangle();
                  peg$silentFails--;
                  if (s8 === peg$FAILED) {
                    s7 = peg$c16;
                  } else {
                    peg$currPos = s7;
                    s7 = peg$c2;
                  }
                  if (s7 !== peg$FAILED) {
                    if (peg$c79.test(input.charAt(peg$currPos))) {
                      s8 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s8 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c80); }
                    }
                    if (s8 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c19(s8);
                      s2 = s3;
                    } else {
                      peg$currPos = s2;
                      s2 = peg$c2;
                    }
                  } else {
                    peg$currPos = s2;
                    s2 = peg$c2;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$c2;
                }
              } else {
                peg$currPos = s2;
                s2 = peg$c2;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$c2;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c2;
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c81(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsews() {
      var s0;

      if (peg$c82.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c83); }
      }

      return s0;
    }

    function peg$parselangleslash() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c84) {
        s0 = peg$c84;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c85); }
      }

      return s0;
    }

    function peg$parselangle() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 60) {
        s0 = peg$c86;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c87); }
      }

      return s0;
    }

    function peg$parserangle() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 62) {
        s0 = peg$c88;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c89); }
      }

      return s0;
    }

    function peg$parserangleslash() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c90) {
        s0 = peg$c90;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c91); }
      }

      return s0;
    }

    function peg$parselbraceslash() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c92) {
        s0 = peg$c92;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c93); }
      }

      return s0;
    }

    function peg$parserbraceslash() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c94) {
        s0 = peg$c94;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c95); }
      }

      return s0;
    }

    function peg$parselbrace() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 123) {
        s0 = peg$c96;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c97); }
      }

      return s0;
    }

    function peg$parserbrace() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 125) {
        s0 = peg$c98;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c99); }
      }

      return s0;
    }

    function peg$parseequals() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 61) {
        s0 = peg$c100;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c101); }
      }

      return s0;
    }

    function peg$parsequote() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 34) {
        s0 = peg$c102;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c103); }
      }

      return s0;
    }

    function peg$parsesingle_quote() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 39) {
        s0 = peg$c104;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c105); }
      }

      return s0;
    }

    function peg$parseampersand() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 38) {
        s0 = peg$c106;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c107); }
      }

      return s0;
    }

    function peg$parsesemicolon() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 59) {
        s0 = peg$c108;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c109); }
      }

      return s0;
    }

    function peg$parsenon_quote() {
      var s0;

      if (peg$c110.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c111); }
      }

      return s0;
    }

    function peg$parseeol() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 10) {
        s0 = peg$c112;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c113); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c114) {
          s0 = peg$c114;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c115); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 13) {
            s0 = peg$c116;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c117); }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 8232) {
              s0 = peg$c118;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c119); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 8233) {
                s0 = peg$c120;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c121); }
              }
            }
          }
        }
      }

      return s0;
    }



      var tornadoBodyTypes = {
        '?': 'exists',
        '^': 'notExists',
        '#': 'section',
        '@': 'helper',
        '+': 'block',
        '<': 'inlinePartial',
        '%': 'pragma'
      };


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();
},{}],17:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var helpers = _interopRequire(require("./helpers"));

var tornado = {

  /**
   * A cache of all registered templates
   */
  templateCache: {},

  /**
   * All registered Helpers
   */
  helpers: {},

  /**
   * Method for registering templates. This method is intended
   * to be called within a compiled template, but can be called
   * outside of that context as well.
   * @param {String} name The name of the template to be registered.
   * If a name is not provided, or the name parameter is not a string,
   * a default name will be provided of the form 'default{TIMESTAMP}'
   * @param {Object} template A Tornado template object.
   */
  register: function register(name, template) {
    if (!name || typeof name !== "string") {
      name = "default" + new Date();
    }
    this.templateCache[name] = template;
  },

  /**
   * Register a helper, overwrite if a helper already exists
   * @param {String} name The name of the helper
   * @param {Function} method The function to be executed when the helper is found in a template
   */
  registerHelper: function registerHelper(name, method) {
    this.helpers[name] = method;
  },

  /**
   * Register multiple helpers at once.
   * @param {Object} helpers An object of helpers where the keys are helper names and the
   * values are helper methods
   */
  registerHelpers: function registerHelpers(helpers) {
    for (var _name in helpers) {
      if (helpers.hasOwnProperty(_name)) {
        this.registerHelper(_name, helpers[_name]);
      }
    }
  },

  /**
   * Method for retrieving values from the given context
   * @param {Object} context The context from which the value should
   * be retrieved.
   * @param {Array} path An array of key names.
   * @return {*} The value at the end of the path, or an empty string.
   */
  get: function get(context, path) {
    var _this = this;

    var pathLength = path.length;
    var newContext = undefined;
    if (pathLength === 1) {
      // there is only one more item left in the path
      var res = context[path.pop()];
      if (res !== undefined) {
        return this.util.isFunction(res) ? res.bind(context)() : res;
      } else {
        return "";
      }
    } else if (pathLength === 0) {
      // return the current context for {.}
      return context || "";
    } else if (!pathLength || pathLength < 0) {
      // There is something wrong with the path (maybe it was not an array?)
      return "";
    }
    // There are still more steps in the array
    newContext = context[path.shift()];
    if (newContext) {
      if (this.util.isFunction(newContext)) {
        newContext = newContext.bind(context)();
      }

      if (this.util.isPromise(newContext)) {
        return newContext.then(function (val) {
          return _this.get(val, path);
        });
      }

      if (this.util.isObject(newContext)) {
        return this.get(newContext, path);
      }
    }
    return "";
  },

  /**
   * Get and render a partial. First look in the cache. If the partial is not found there,
   * call td.fetchPartial (which can be user defined), and render the partial that is returned
   * when the Promise returned by td.fetchPartial resolves.
   * @param {String} name The name of the partial to be rendered and returned
   * @param {Object} context The context to be used to render the partial
   * @param {TornadoTemplate} parentTemplate The template object that the template was called from
   * @param {DocumentFragment|Promise}
   */
  getPartial: function getPartial(name, context, parentTemplate) {
    var _this = this;

    var partial = this.templateCache[name];
    if (partial) {
      return new Promise(function (resolve /*, reject*/) {
        partial.parentTemplate = parentTemplate;
        resolve(partial.render(context));
      });
    } else {
      return this.fetchPartial(name).then(function (partial) {
        partial.parentTemplate = parentTemplate;
        return partial.render(context);
      })["catch"](function (error) {
        return _this.throwError(error);
      });
    }
  },

  /**
   * TODO: Flesh out a good default for this function.
   * Return a promise that resolves with the fetched partial, from wherever you want to fetch it.
   * @param {String} name The name of the partial to be fetched.
   * @return {Promise} A promise that resolves with a Tornado partial
   */
  fetchPartial: function fetchPartial() {
    return new Promise(function (resolve /*, reject*/) {

      // TODO: Make this really work correctly.
      var fakePartial = {
        render: function render() {
          var frag = document.createDocumentFragment();
          frag.appendChild(document.createTextNode("It worked!"));
          return frag;
        }
      };
      resolve(fakePartial);
    });
  },

  /**
   * Check if a value is truthy. If the value is a promise, wait until the promise resolves,
   * then check if the resolved value is truthy.
   * @param {*} val The value to be checked for existence.
   * @param {[Node]} placeholderNode The node which will be replaced with the appropriate body,
   * depending on the results of the exists check.
   * @param {Object} bodies The Tornado bodies that will be inserted depending on the results of the
   * exists check.
   * @param {*} The context in which the exists was created.
   * @return {[String]} If the section is within an HTML attribute, return a string
   */
  exists: function exists(val, placeholderNode, bodies, context) {
    var _this = this;

    if (this.util.isPromise(val)) {
      placeholderNode = this.insertPendingBody(placeholderNode, bodies.pending, context) || placeholderNode;
      val.then(function (data) {
        if (_this.util.isTruthy(data)) {
          if (bodies.main) {
            return _this.existsResult(placeholderNode, bodies.main, context);
          }
        } else if (bodies["else"]) {
          return _this.existsResult(placeholderNode, bodies["else"], context);
        }
      })["catch"](function () {
        if (bodies["else"]) {
          return _this.existsResult(placeholderNode, bodies["else"], context);
        }
      });
    } else {
      if (this.util.isTruthy(val)) {
        if (bodies.main) {
          return this.existsResult(placeholderNode, bodies.main, context);
        }
      } else if (bodies["else"]) {
        return this.existsResult(placeholderNode, bodies["else"], context);
      }
    }
  },

  /**
   * The notExists is a proxy for the exists method, but first the main and else bodies are switched
   */
  notExists: function notExists(val, placeholderNode, bodies, context) {
    var mainBody = bodies.main;
    var elseBody = bodies["else"];
    bodies.main = elseBody;
    bodies["else"] = mainBody;
    return this.exists(val, placeholderNode, bodies, context);
  },

  /**
   * Simplify the logic of the this.exists by pulling out the logic that determines if the exists is
   * within an HTML attribute.
   * @param {Node} placeholderNode  If the exists is not in an HTML Attribute, the placeholderNode
   * is the node that will be replaced by the exists body
   * @param {Function} body The appropriate exists body function (e.g. bodies.main and bodies.else)
   * @param {Object} context The context to be used to render the body
   */
  existsResult: function existsResult(placeholderNode, body, context) {
    if (placeholderNode) {
      this.replaceNode(placeholderNode, body(context));
    } else {
      return this.nodeToString(body(context));
    }
  },

  /**
   * Check for truthiness in the same way this.exists checks. If `val` is truthy, render the main
   * body with using `val` as the context (if `val` is an array, loop through the array and render
   * the main body for each value in the array). If `val` is falsy, optionally render the else body
   * using `context`. Handle promises the way this.exists does.
   * @param {*} val The val to be checked.
   * @param {[Node]} placeholderNode The node that will be replaced with the rendered body(ies).
   * @param {Object} bodies The Tornado bodies that will be inserted depending on the results of the
   * truthiness tests.
   * @param {*} context The context in which the section was called.
   * @return {[String]} If within an HTML attribute, return a string.
   */
  section: function section(val, placeholderNode, bodies, context) {
    var _this = this;

    var body = undefined,
        ctx = undefined;
    if (this.util.isPromise(val)) {
      placeholderNode = this.insertPendingBody(placeholderNode, bodies.pending, context) || placeholderNode;
      val.then(function (data) {
        if (_this.util.isTruthy(data)) {
          body = bodies.main;
          ctx = data;
        } else {
          body = bodies["else"];
          ctx = context;
        }
        return _this.sectionResult(ctx, placeholderNode, body);
      })["catch"](function () {
        return _this.sectionResult(context, placeholderNode, bodies["else"]);
      });
    } else {
      if (this.util.isTruthy(val)) {
        body = bodies.main;
        ctx = val;
      } else {
        body = bodies["else"];
        ctx = context;
      }
      return this.sectionResult(ctx, placeholderNode, body);
    }
  },

  /**
   * Break out the logic of whether the value is an Array and whether the section was called within
   * an HTML attribute.
   * @param {*} val The value to be used to render the body
   * @param {[Node]} placeholderNode The node to be replaced by the results of the body. If the
   * section was called within an HTML attribute, placeholderNode will be null.
   * @param {Function} body The appropriate body rendering function to be rendered with `val`.
   * @return {[String]} Return a string if in an HTML attribute
   */
  sectionResult: function sectionResult(val, placeholderNode, body) {
    if (!body) {
      return "";
    }
    if (Array.isArray(val)) {
      if (placeholderNode) {
        var frag = document.createDocumentFragment();
        for (var i = 0, item = undefined; item = val[i]; i++) {
          frag.appendChild(body(item));
        }
        this.replaceNode(placeholderNode, frag);
      } else {
        var attrs = [];
        for (var i = 0, item = undefined; item = val[i]; i++) {
          attrs.push(this.nodeToString(body(item)));
        }
        return attrs.join("");
      }
    } else {
      if (placeholderNode) {
        this.replaceNode(placeholderNode, body(val));
      } else {
        return this.nodeToString(body(val));
      }
    }
  },

  /**
   * Find and return a helper. If no helper of the given name is found, throw an error
   * @param {String} name The name of the helper
   * @param {Object} context The context at the point the helper was called
   * @param {Object} params The params passed to the helper
   * @return {DocumentFragment|Promise}
   */
  helper: (function (_helper) {
    var _helperWrapper = function helper(_x, _x2, _x3, _x4, _x5) {
      return _helper.apply(this, arguments);
    };

    _helperWrapper.toString = function () {
      return _helper.toString();
    };

    return _helperWrapper;
  })(function (name, placeholderNode, context, params, bodies) {
    var _this = this;

    var helper = this.helpers[name];
    if (!helper) {
      throw new Error("Helper not registered: " + name);
    } else {
      var paramVals = this.util.getValuesFromObject(params);
      if (this.util.hasPromises(paramVals)) {
        Promise.all(paramVals).then(function (values) {
          var resolvedParams = _this.util.arraysToObject(Object.keys(params).sort(), values);
          var returnVal = helper(context, resolvedParams, bodies);
          return _this.helperResult(placeholderNode, returnVal);
        });
      } else {
        var returnVal = helper(context, params, bodies);
        return this.helperResult(placeholderNode, returnVal);
      }
    }
  }),

  helperResult: function helperResult(placeholderNode, returnVal) {
    var _this = this;

    if (this.util.isPromise(returnVal)) {
      returnVal.then(function (frag) {
        if (placeholderNode) {
          _this.replaceNode(placeholderNode, frag);
        } else {
          return _this.nodeToString(frag);
        }
      });
    } else {
      if (placeholderNode) {
        this.replaceNode(placeholderNode, returnVal);
      } else {
        return this.nodeToString(returnVal);
      }
    }
  },

  /**
   * Render a block or inline partial based of a given name.
   * @param {String} name The name of the block
   * @param {Number} idx The index of the block (in case there are multiples)
   * @param {TornadoTemplate} template The template in which the block was found
   * @return {DocumentFragment}
   */
  block: function block(name, idx, context, template) {
    var renderer = this.getBlockRenderer(name, idx, template);
    if (!renderer) {
      var frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(""));
      return frag;
    }
    return renderer(context).frag;
  },

  /**
   * Get the renderer for a given block. The renderer may be an inline partial, the block's default
   * content, or an inline partial in a parent template. If no renderer is found, undefined will
   * be returned.
   * @param {String} name The name of the block
   * @param {Number} idx The blocks index within the template
   * @param {Object} template The template within which to look for a renderer
   * @return {Function} The renderer if found, or undefined
   */
  getBlockRenderer: function getBlockRenderer(name, idx, template) {
    var renderer = undefined;
    while (template) {
      renderer = template["f_i_" + name];

      if (renderer && typeof renderer === "function") {
        // Prefer the inline partial renderer
        return renderer;
      } else {
        // Fall back to the block renderer
        renderer = template["f_b_" + name + "" + idx];
        if (renderer && typeof renderer === "function") {
          return renderer;
        }
      }
      template = template.parentTemplate;
    }
    // If no renderer is found, undefined will be returned.
  },

  /**
   * Build a pending body within a div with class "pending" (we have to wrap in a div so we can
   * easily replace the entire thing when the promise resolves). If no pending body exists, then
   * return false.
   * @param {Node} placeholderNode The node where the pending body will be inserted
   * @param {[Function]} body The pending body function, if it exists
   * @param {Object} context The current Tornado context, to be used in building the pending body
   * @return {HTMLElement|False} Return the containing div, or false
   */
  insertPendingBody: function insertPendingBody(placeholderNode, body, context) {
    if (body) {
      var div = document.createElement("div");
      div.setAttribute("class", "tornado-pending");
      div.appendChild(body(context));
      this.replaceNode(placeholderNode, div);
      return div;
    } else {
      return false;
    }
  },

  /**
   * Turn a document fragment into a string
   * @param {DocumentFragment|HTMLElement} frag The document fragment to be turned into a string
   * @return {String}
   */
  nodeToString: function nodeToString(frag) {
    var div = document.createElement("div");
    div.appendChild(frag);
    return div.innerHTML;
  },

  /**
   * Replace a given node with a new node. Nothing will happen if the oldNode
   * does not have a parent node
   * @param {Node} oldNode The node to be replaced
   * @param {Node} newNode The new node to be inserted
   */
  replaceNode: function replaceNode(oldNode, newNode) {
    if (!oldNode) {
      return;
    }
    var parentNode = oldNode.parentNode;
    var isPromise = this.util.isPromise(newNode);
    if (isPromise) {
      newNode.then(function (node) {
        parentNode = oldNode.parentNode;
        parentNode.replaceChild(node, oldNode);
      });
    } else {
      parentNode.replaceChild(newNode, oldNode);
    }
  },

  /**
   * Create a text node (like document.createTextNode), possibly asynchronously if the value is a
   * Promise
   * @param {String|Promise} val The value to be text noded
   * @return {TextNode}
   */
  createTextNode: function createTextNode(val) {
    if (this.util.isPromise(val)) {
      return val.then(function (data) {
        return document.createTextNode(data);
      })["catch"](function () {
        return document.createTextNode("");
      });
    } else {
      return document.createTextNode(val);
    }
  },

  /**
   * Create an HTML comment with the given contents
   * @param {String} contents The contents of the comment
   * @return {HTMLComment}
   */
  createHTMLComment: function createHTMLComment(contents) {
    return document.createComment(contents);
  },

  /**
   * Create a document fragment (lives in runtime so it can be minified)
   * @return {DocumentFragment}
   */
  createDocumentFragment: function createDocumentFragment() {
    return document.createDocumentFragment();
  },

  /**
   * Create and return an element, possibly within an XML namespace (other than HTML).
   * @param {String} name The name of the element to be created
   * @param {String} [namespace] The optional XML namespace (e.g. 'http://www.w3.org/2000/svg')
   * @return {HTMLElement}
   */
  createElement: function createElement(name, namespace) {
    if (namespace) {
      return document.createElementNS(namespace, name);
    } else {
      return document.createElement(name);
    }
  },

  /**
   * Set an attribute on a given node. To support references and promises, the value of the
   * attribute is an array of values
   * @param {HTMLElement} node The element whose attribute is to be set
   * @param {String} attrName The name of the attribute to be set
   * @param {Array|String} vals An array of strings and Promises. When all of the promises resolve,
   * the attribute will be set. If vals is a String, the attribute will be set immediately.
   */
  setAttribute: function setAttribute(node, attrName, vals) {
    if (Array.isArray(vals)) {
      Promise.all(vals).then(function (values) {
        node.setAttribute(attrName, values.join(""));
      });
    } else {
      node.setAttribute(attrName, vals);
    }
  },

  util: {
    /**
     * Determine if a value is an object
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isObject: function isObject(val) {
      return typeof val === "object" && val !== null;
    },

    /**
     * Deterime if a value is a Promise
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isPromise: function isPromise(val) {
      return this.isFunction(val.then);
    },

    /**
     * Check if an Array cotains any promises
     * @param {Array} arr The Array whose values are in question
     * @return {Boolean}
     */
    hasPromises: function hasPromises(arr) {
      var _this = this;

      return arr.some(function (val) {
        return _this.isPromise(val);
      });
    },

    /**
     * Determine if a value is a Function
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isFunction: function isFunction(val) {
      return typeof val === "function";
    },

    /**
     * Determine Tornado truthiness
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isTruthy: function isTruthy(val) {
      if (val === 0) {
        return true;
      }
      if (Array.isArray(val) && !val.length) {
        return false;
      }
      return !!val;
    },

    /**
     * Return the values of the object (sorted by key name) as an array
     * @param {Object} obj The object from which the values are to be extracted
     * @return {Array}
     */
    getValuesFromObject: function getValuesFromObject(obj) {
      return Object.keys(obj).sort().map(function (key) {
        return obj[key];
      });
    },

    /**
     * Given two arrays of equal length, the values in the first array become keys and the values of
     * the second array become values of a new object.
     * @param {Object} keys An array with the names of keys for the new object
     * @param {Object} values An array with the values for the new object
     * @return {Object}
     */
    arraysToObject: function arraysToObject(keys, values) {
      var result = {};
      if (!keys.length === values.length) {
        return result;
      }
      for (var i = 0, len = keys.length; i < len; i++) {
        result[keys[i]] = values[i];
      }
      return result;
    }
  }
};

/**
 * Aliases for minification
 */
tornado.r = tornado.register;
tornado.g = tornado.get;
tornado.t = tornado.createTextNode;
tornado.c = tornado.createHTMLComment;
tornado.m = tornado.createElement;
tornado.f = tornado.createDocumentFragment;
tornado.a = tornado.setAttribute;
tornado.p = tornado.getPartial;
tornado.n = tornado.replaceNode;
tornado.e = tornado.exists;
tornado.h = tornado.helper;
tornado.b = tornado.block;
tornado.s = tornado.nodeToString;

tornado.registerHelpers(helpers);

module.exports = tornado;
/*name*/ /*c*/
//# sourceMappingURL=runtime.js.map
},{"./helpers":15}],18:[function(require,module,exports){
var parser = require('../../dist/parser'),
    compiler = require('../../dist/compiler'),
    td = require('../../dist/runtime');

window.td = td;

var weatherIconMap = {
  '0': 'F',   // tornado
  '1': 'F',   // tropical storm
  '2': 'F',   // hurricane
  '3': 'P',   // thunderstorms
  '4': '0',   // severe thunderstorms
  '5': 'X',   // frozen rain
  '6': 'X',
  '7': 'X',
  '8': 'X',
  '9': 'Q',   // drizzle
  '10': 'X',  // frozen rain
  '11': 'Q',  // showers
  '12': 'R',  // showers
  '13': 'U',  // snow
  '14': 'U',  // snow
  '15': 'V',  // snow
  '16': 'V',  // snow
  '17': 'X',  // hail
  '18': '$',  // sleet
  '19': '$',  // dust
  '20': 'M',  // fog
  '21': 'X',  // sleet
  '22': 'E',  // smoky
  '23': 'S',  // blustery
  '24': 'F',  // windy
  '25': 'G',  // windy
  '26': 'N',  // cloudy
  '27': 'H',
  '28': 'H',
  '29': 'H',
  '30': 'H',
  '31': 'C',  // clear (night)
  '32': 'B',  // sunny
  '33': 'H',  // fair
  '34': '3',
  '35': 'X',
  '36': "'",
  '37': 'P',
  '38': 'P',
  '39': 'P',
  '40': 'Q',
  '41': 'W',
  '42': 'U',
  '43': 'W',
  '44': 'H',
  '45': '6',
  '46': 'V',
  '47': 'P'
};

td.registerHelper('weatherIcon', function(context, params, bodies) {
  var iconCode = weatherIconMap[params.code];
  var result = bodies.main(context);
  if (iconCode) {
    var span = document.createElement('span');
    span.setAttribute('data-icon-code', iconCode);
    span.setAttribute('title', params.desc);
    span.setAttribute('class', 'weather-icon');
    span.appendChild(result);
    result = span;
  }
  return result;
});

var button = document.querySelector('#render');
var templateTextArea = document.querySelector('#template');
var contextTextArea = document.querySelector('#context');
var astContainer = document.querySelector('#output .ast');
var compiledContainer = document.querySelector('#output .compiled');
var outputContainer = document.querySelector('#output .output');
var stringContainer = document.querySelector('#output .string');

button.addEventListener('click', function() {
  var t = templateTextArea.value;
  var c = contextTextArea.value;
  var ast = parser.parse(t);
  astContainer.innerHTML = JSON.stringify(ast, null, 2);
  var compiled = compiler.compile(ast, 'test');
  compiledContainer.innerHTML = compiled;
  var tl = eval(compiled);
  var data = {};
  eval('data = ' + c + ';');
  var out = tl.render(eval(data));
  outputContainer.innerHTML = '';
  outputContainer.appendChild(out);
  stringContainer.innerHTML = outputContainer.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
});

outputContainer.addEventListener('click', function(evt) {
  var target = evt.target;
  target.classList.toggle('min');
});

},{"../../dist/compiler":1,"../../dist/parser":16,"../../dist/runtime":17}]},{},[18]);
