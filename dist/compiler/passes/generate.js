"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _utilsBuilder = require("../utils/builder");

var util = _interopRequire(_utilsBuilder);

// TODO: Figure out where these should actually live
var STATES = _utilsBuilder.STATES;

var createMethodHeaders = require("./preprocess").createMethodHeaders;

var createMethodFooters = require("./postprocess").createMethodFooters;

var visitor = _interopRequire(require("../visitor"));

var nodeMethods = {
  TORNADO_PARTIAL: function TORNADO_PARTIAL(node, ctx) {
    var meta = node[1];
    var params = meta.params;
    var context = "c";
    var tdIndex = ctx.currentIdx();
    var indexes = ctx.htmlBodies[tdIndex].htmlBodiesIndexes;
    var indexHash = indexes.join("");
    if (params.length === 1 && params[0].key === "context") {
      context = "td." + util.getTdMethodName("get") + "(c, " + params[0].val + ")";
    }
    if (context.state !== STATES.HTML_ATTRIBUTE) {
      ctx.append(null, "      " + util.createPlaceholder(ctx) + ";\n", null);
      ctx.append(null, null, "      var on" + indexHash + " = td." + util.getTdMethodName("getNodeAtIdxPath") + "(root, " + JSON.stringify(indexes) + ");\n      td." + util.getTdMethodName("replaceNode") + "(on" + indexHash + ", td." + util.getTdMethodName("getPartial") + "('" + meta.name + "', " + context + ", this));\n");
    } else {
      return "td." + util.getTdMethodName("getPartial") + "('" + meta.name + "', " + context + ", this).then(function(node){return td." + util.getTdMethodName("nodeToString") + "(node)})";
    }
  },
  TORNADO_BODY: function TORNADO_BODY(node, ctx) {
    var bodyInfo = node[1];
    var previousState = ctx.state;
    var createMethods = !!bodyInfo.body.length;
    var methodName = undefined,
        blockName = undefined,
        blockIndex = undefined;

    if (bodyInfo.type === "block" || bodyInfo.type === "inlinePartial") {
      blockName = bodyInfo.key.join(".");
      methodName = "_" + bodyInfo.type.substring(0, 1) + "_" + blockName;
    }

    if (bodyInfo.type === "block") {
      var blocks = ctx.blocks;
      if (blocks.hasOwnProperty(blockName)) {
        blockIndex = ++blocks[blockName];
      } else {
        blockIndex = blocks[blockName] = 0;
      }
      bodyInfo.blockIndex = blockIndex;
      bodyInfo.blockName = blockName;
      methodName += blockIndex;
    }

    // Set up the body in the parent fragment and renderer
    var renderVal = ctx.tornadoBodies[bodyInfo.type].apply(ctx, [bodyInfo]);

    if (createMethods) {
      // Build the fragment and renderer, then walk the bodies.
      ctx.tdBodies.push({ parentIndex: ctx.currentIdx() });
      var tdIndex = ctx.setIdx(ctx.tdBodies.length - 1);
      ctx.refCount++;
      ctx.htmlBodies.push({ count: -1, htmlBodiesIndexes: [0] });

      // Open the functions
      createMethodHeaders(methodName, ctx);

      ctx.state = STATES.OUTER_SPACE;
      /// TODO: recursive??
      // generateWalker(bodyInfo.body, ctx);
      ctx.state = previousState;

      if (bodyInfo.bodies && bodyInfo.bodies.length) {}

      // Close the functions
      createMethodFooters(null, ctx);
      ctx.setIdx(ctx.tdBodies[tdIndex].parentIndex);
    }
    return renderVal;
  },
  TORNADO_REFERENCE: function TORNADO_REFERENCE(node, ctx) {
    var tdIndex = ctx.currentIdx();
    var indexes = ctx.htmlBodies[tdIndex].htmlBodiesIndexes;
    var indexHash = indexes.join("");
    if (ctx.state === STATES.HTML_ELEMENT || ctx.state === STATES.OUTER_SPACE) {
      ctx.append(null, "      " + util.createPlaceholder(ctx) + ";\n", "      var on" + indexHash + " = td." + util.getTdMethodName("getNodeAtIdxPath") + "(root, " + JSON.stringify(indexes) + ");\n      td." + util.getTdMethodName("replaceNode") + "(on" + indexHash + ", td." + util.getTdMethodName("createTextNode") + "(td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(node[1].key) + ")));\n");
    } else if (ctx.state === STATES.HTML_ATTRIBUTE) {
      return "td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(node[1].key) + ")";
    }
  },
  HTML_ELEMENT: function HTML_ELEMENT(node, ctx) {
    var nodeInfo = node[1].tag_info;
    // let nodeContents = node[1].tag_contents;
    var tdIndex = ctx.currentIdx();
    util.setHTMLElementState(nodeInfo, ctx);
    var isNamespaceRoot = nodeInfo.attributes.some(function (attr) {
      return attr.attrName === "xmlns";
    });
    var namespace = ctx.namespace ? ", '" + ctx.namespace + "'" : "";
    ctx.htmlBodies[tdIndex].htmlBodiesIndexes.push(0);
    var count = ++ctx.htmlBodies[tdIndex].count;
    ctx.append(null, "      var el" + count + " = td." + util.getTdMethodName("createElement") + "('" + nodeInfo.key + "'" + namespace + ");\n", null);
    util.buildElementAttributes(nodeInfo.key, nodeInfo.attributes, ctx);
    if (isNamespaceRoot) {
      ctx.namespace = null;
    }
  },
  PLAIN_TEXT: function PLAIN_TEXT(node, ctx) {
    if (ctx.state === STATES.HTML_ATTRIBUTE) {
      return "'" + node[1] + "'";
    } else if (ctx.state === STATES.HTML_ELEMENT || ctx.state === STATES.OUTER_SPACE) {
      ctx.append(null, "      " + util.getElContainerName(ctx) + ".appendChild(td." + util.getTdMethodName("createTextNode") + "('" + node[1].replace(/'/g, "\\'") + "'));\n", null);
    } else if (ctx.state === STATES.ESCAPABLE_RAW) {
      ctx.append(null, "      " + util.getElContainerName(ctx) + ".defaultValue += '" + node[1].replace(/'/g, "\\'") + "';\n", null);
    }
  }
};

nodeMethods.ESCAPABLE_RAW = nodeMethods.HTML_ELEMENT;

var generateWalker = visitor.build(nodeMethods);

var generateJavascript = function generateJavascript(ast, options) {
  return generateWalker(ast, options.context);
};

module.exports = generateJavascript;

// generateWalker(bodyInfo.bodies, ctx);
//# sourceMappingURL=generate.js.map