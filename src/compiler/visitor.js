'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let visitor = {
  build(fns) {
    let step = function(node) {
      let type = node[0];
      if (type && fns[type]) {
        return fns[type].apply(null, node);
      }
    };
    let walk = function(nodes=[]) {
      nodes.forEach((n) => {
        step(n);
      });
    };

    return walk;
  }
};
module.exports = visitor;
