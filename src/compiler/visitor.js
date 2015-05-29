'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let visitor = {
  build(fns) {
    let step = function(node) {
      let type = node[0];
      if (type && fns[type]) {
        return fns[type].apply(null, arguments);
      }
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
module.exports = visitor;
