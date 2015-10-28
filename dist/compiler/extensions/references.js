"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var generatedWalker = visitor.build({
  TORNADO_REFERENCE: function TORNADO_REFERENCE(item) {
    var node = item.node;

    node = node[1];
    var sepParam = node.params.filter(function (param) {
      return param[1].key === "sep";
    }).reduce(function (acc, param) {
      return param[1];
    }, null);
    if (sepParam && sepParam.val !== ".") {
      node.key = node.key.join(".").split(sepParam.val);
    }
  }
});

var builtinHelpers = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

module.exports = builtinHelpers;
//# sourceMappingURL=references.js.map