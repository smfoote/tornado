'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let visitor = {
  build(fns) {
    let step = function(node) {
      let type = node[0];
      let extraArgs = Array.prototype.slice.call(arguments, 1);
      let output;
      // TODO: add enter and leave logic so node handlers can set up the context for the children
      if (type && fns[type]) {
        output = fns[type].apply(null, arguments);
      }

      // also walk the child nodes for those nodes with children
      switch (type) {
        case 'HTML_ELEMENT':
          if (node[1].tag_contents) {
            walk.apply(null, [node[1].tag_contents].concat(extraArgs));
          }
          break;
        case 'TORNADO_BODY':
          if (node[1].bodies) {
            walk.apply(null, [node[1].bodies].concat(extraArgs));
          }
          if (node[1].params) {
            walk.apply(null, [node[1].params].concat(extraArgs));
          }
          break;
        case 'TORNADO_PARTIAL':
          if (node[1].params) {
            walk.apply(null, [node[1].params].concat(extraArgs));
          }
          break;
      }

      return output;
    };

    let walk = function(nodes=[]) {
      let extraArgs = Array.prototype.slice.call(arguments, 1);
      nodes.forEach((n) => {
        step.apply(null, [n].concat(extraArgs));
      });
    };

    return walk;
  }
};
export default visitor;
