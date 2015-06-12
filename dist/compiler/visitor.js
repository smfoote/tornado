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
          if (node[1].body) {
            walk.apply(null, [node[1].body, context]);
          }
          if (node[1].bodies) {
            walk.apply(null, [node[1].bodies, context]);
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