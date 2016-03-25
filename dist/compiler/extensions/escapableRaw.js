"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var STATES = require("../utils/builder").STATES;

var escapableRawEls = ["textarea", "title"];
var generatedWalker = visitor.build({
  HTML_ELEMENT: function HTML_ELEMENT(node) {
    var key = node[1].tag_info.key;
    if (escapableRawEls.indexOf(key) > -1) {
      this.setState(node, STATES.ESCAPABLE_RAW);
    }
  }
});

var escapableRaw = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

module.exports = escapableRaw;
//# sourceMappingURL=escapableRaw.js.map