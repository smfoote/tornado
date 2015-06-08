'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let noop = function() {};

let visitor = {
  build(fns) {
    let step = function(node, index, context) {
      let type = node[0];
      let output;
      let enterMethod = fns[type].enter || fns[type];
      let leaveMethod = fns[type].leave || noop;
      context.stack.push(node, index, enterMethod);

      // also walk the child nodes for those nodes with children
      switch (type) {
        case 'HTML_ELEMENT':
          if (node[1].tag_info.attributes) {
            walkAttrs.apply(null, [node[1].tag_info.attributes]);
          }
          if (node[1].tag_contents) {
            walk.apply(null, [node[1].tag_contents, context]);
          }
          break;
        case 'TORNADO_BODY':
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
        case 'TORNADO_PARTIAL':
          if (node[1].params) {
            walk.apply(null, [node[1].params, context]);
          }
          break;
      }

      context.stack.pop(leaveMethod);
      return output;
    };

    /**
     * Walk through the attributes of an HTML element
     */
    let walkAttrs = function walkAttrs(items = []) {
      let res = [];
      items.forEach((item) => {
        if (item[0] === 'PLAIN_TEXT') {
          res.push('\'' + item[1] + '\'');
        }
      });
      res = res.length ? res : ['\'\''];
      return `[${res.join(',')}]`;
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
