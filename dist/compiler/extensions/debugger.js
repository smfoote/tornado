"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var generatedWalker = visitor.build({
  TORNADO_BODY: function TORNADO_BODY(item) {
    var node = item.node;

    var nodeInfo = node[1];
    if (nodeInfo.type === "helper" && nodeInfo.key.join("") === "debugger") {
      node[0] = "TORNADO_DEBUGGER";
    }
  }
});

var escapableRaw = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

module.exports = escapableRaw;
//# sourceMappingURL=debugger.js.map