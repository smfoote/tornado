"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var BUILT_IN_HELPER_TYPES = ["exists", "notExists", "section"];

var generatedWalker = visitor.build({
  TORNADO_BODY: function TORNADO_BODY(node) {
    node = node[1];
    if (BUILT_IN_HELPER_TYPES.indexOf(node.type) > -1) {
      node.params.push(["TORNADO_PARAM", {
        key: "key",
        val: node.key.join(".")
      }]);
      node.key = [node.type];
      node.type = "helper";
    }
  }
});

var builtinHelpers = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

module.exports = builtinHelpers;
//# sourceMappingURL=builtinHelpers.js.map