"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var STATES = require("../utils/builder").STATES;

var escapableRawEls = ["textarea", "title"];
var generatedWalker = visitor.build({
  HTML_ELEMENT: {
    enter: function enter(node) {
      var key = node[1].tag_info.key;
      if (escapableRawEls.indexOf(key) > -1) {
        this.enterState(node, STATES.ESCAPABLE_RAW);
      }
    },
    leave: function leave(node) {
      var key = node[1].tag_info.key;
      if (escapableRawEls.indexOf(key) > -1) {
        this.leaveState(node, STATES.ESCAPABLE_RAW);
      }
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