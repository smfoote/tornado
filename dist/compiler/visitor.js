"use strict";
/**
 * the visitor pattern so we can map AST to functions
 */

var noop = function noop() {};

var visitor = {
  build: function build(fns) {
    var step = function step(node) {
      var type = node[0];
      var extraArgs = Array.prototype.slice.call(arguments, 1);
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
      enterMethod.apply(this, [{ node: node }].concat(extraArgs));

      // also walk the child nodes for those nodes with children
      switch (type) {
        case "HTML_ELEMENT":
          if (node[1].tag_info.attributes) {
            walk.apply(null, [node[1].tag_info.attributes].concat(extraArgs));
          }
          if (node[1].tag_contents) {
            walk.apply(null, [node[1].tag_contents].concat(extraArgs));
          }
          break;
        case "TORNADO_BODY":
          if (node[1].params) {
            walk.apply(null, [node[1].params].concat(extraArgs));
          }
          if (node[1].bodies) {
            walk.apply(null, [node[1].bodies].concat(extraArgs));
          }
          if (node[1].body) {
            walk.apply(null, [node[1].body].concat(extraArgs));
          }
          break;
        case "TORNADO_PARTIAL":
          if (node[1].params) {
            walk.apply(null, [node[1].params].concat(extraArgs));
          }
          break;
        case "HTML_ATTRIBUTE":
          if (node[1].value) {
            walk.apply(null, [node[1].value].concat(extraArgs));
          }
      }

      leaveMethod.apply(this, [{ node: node }].concat(extraArgs));
      return output;
    };

    var walk = function walk() {
      var nodes = arguments[0] === undefined ? [] : arguments[0];

      var extraArgs = Array.prototype.slice.call(arguments, 1);
      nodes.forEach(function (n) {
        step.apply(null, [n].concat(extraArgs));
      });
    };

    return walk;
  }
};
module.exports = visitor;
//# sourceMappingURL=visitor.js.map