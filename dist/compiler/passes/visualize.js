"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var generatedWalker = visitor.build({
  HTML_ELEMENT: function HTML_ELEMENT(item) {
    var node = item.node;

    console.log("entering: " + node[0]);
  },
  HTML_COMMENT: function HTML_COMMENT(item) {
    var node = item.node;

    console.log("entering: " + node[0]);
  },
  HTML_ENTITY: function HTML_ENTITY(item) {
    var node = item.node;

    console.log("entering: " + node[0]);
  },
  PLAIN_TEXT: function PLAIN_TEXT(item) {
    var node = item.node;

    console.log("entering: " + node[0]);
  },
  TORNADO_COMMENT: function TORNADO_COMMENT(item) {
    var node = item.node;

    console.log("entering: " + node[0]);
  },
  TORNADO_BODY: function TORNADO_BODY(item) {
    var node = item.node;

    console.log("entering: " + node[0]);
  },
  TORNADO_PARTIAL: function TORNADO_PARTIAL(item) {
    var node = item.node;

    console.log("entering: " + node[0]);
  },
  TORNADO_REFERENCE: function TORNADO_REFERENCE(node) {
    console.log("entering: " + node[0]);
  }
});

var generateVisualizer = function generateVisualizer(ast, options) {
  return generatedWalker(ast, options.context);
};

module.exports = generateVisualizer;
//# sourceMappingURL=visualize.js.map