/* eslint camelcase: 0 */

"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var generatedWalker = visitor.build({
  TORNADO_BODY: function TORNADO_BODY(node) {
    var nodeInfo = node[1];
    if (nodeInfo.type === "helper" && nodeInfo.key.join("") === "debugger") {
      node[0] = "TORNADO_DEBUGGER";
    }
  }
});

var debuggerExtension = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }],
  instructions: {
    TORNADO_DEBUGGER: {
      enter: function enter(node, ctx, frameStack) {
        var inner = frameStack.current(),
            outer = inner;
        return {
          type: "insert",
          options: { key: node[1].key, frameStack: [inner, outer], item: node.stackItem, ctx: ctx }
        };
      }
    }
  },
  codeGen: {
    insert_TORNADO_DEBUGGER: function insert_TORNADO_DEBUGGER(instruction, code) {
      var tdBody = instruction.tdBody;

      var renderer = "      debugger;\n";
      code.push(tdBody, { renderer: renderer });
    }
  }
};

module.exports = debuggerExtension;
//# sourceMappingURL=debugger.js.map