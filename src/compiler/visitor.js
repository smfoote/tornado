'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let noop = function() {};

let visitor = {
  build(fns) {
    let step = function(node, index, context) {
      let type = node[0];
      let output, enterMethod, leaveMethod;
      if (fns[type]){
        enterMethod = fns[type].enter || fns[type];
        leaveMethod = fns[type].leave || noop;
      } else {
        enterMethod = noop;
        leaveMethod = noop;
      }
      context.stack.push(node, index, enterMethod);

      // also walk the child nodes for those nodes with children
      switch (type) {
        case 'HTML_ELEMENT':
          if (node[1].tag_info.attributes) {
            walk.apply(null, [node[1].tag_info.attributes, context]);
          }
          if (node[1].tag_contents) {
            walk.apply(null, [node[1].tag_contents, context]);
          }
          break;
        case 'TORNADO_BODY':
          if (node[1].params) {
            walk.apply(null, [node[1].params, context]);
          }
          if (node[1].bodies) {
            walk.apply(null, [node[1].bodies, context]);
          }
          if (node[1].body) {
            walk.apply(null, [node[1].body, context]);
          }
          break;
        case 'TORNADO_PARTIAL':
          if (node[1].params) {
            walk.apply(null, [node[1].params, context]);
          }
          break;
        case 'HTML_ATTRIBUTE':
          if (node[1].value) {
            walk.apply(null, [node[1].value, context]);
          }
      }

      context.stack.pop(leaveMethod);
      return output;
    };

    let walk = function(nodes=[], context) {
      nodes.forEach((n, index) => {
        step.apply(null, [n, index, context]);
      });
    };

    return walk;
  }
};
export default visitor;
