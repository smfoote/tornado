'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let noop = function() {};

let visitor = {
  build(fns) {
    let step = function(node) {
      let type = node[0];
      let extraArgs = Array.prototype.slice.call(arguments, 1);
      let output, enterMethod, leaveMethod;
      if (fns[type]){
        enterMethod = fns[type].enter || fns[type];
        leaveMethod = fns[type].leave || noop;
      } else {
        enterMethod = noop;
        leaveMethod = noop;
      }
      enterMethod.apply(this, [{node}].concat(extraArgs));

      // also walk the child nodes for those nodes with children
      switch (type) {
        case 'HTML_ELEMENT':
          if (node[1].tag_info.attributes) {
            walk.apply(null, [node[1].tag_info.attributes].concat(extraArgs));
          }
          if (node[1].tag_contents) {
            walk.apply(null, [node[1].tag_contents].concat(extraArgs));
          }
          break;
        case 'TORNADO_BODY':
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
        case 'TORNADO_PARTIAL':
          if (node[1].params) {
            walk.apply(null, [node[1].params].concat(extraArgs));
          }
          break;
        case 'HTML_ATTRIBUTE':
          if (node[1].value) {
            walk.apply(null, [node[1].value].concat(extraArgs));
          }
      }

      leaveMethod.apply(this, [{node}].concat(extraArgs));
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
