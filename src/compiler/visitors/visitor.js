'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

import visitorKeys from './visitorKeys';
import merge from 'lodash.merge';
import api from './visitorApi';
let nativeSlice = Array.prototype.slice;

function noop() {}

// visit can be an object with enter leave or a function
// if it is a function, run this on enter
function normalizeFns(fns) {
  Object.keys(fns).forEach(function(key) {
    var handler = fns[key];
    if (typeof handler === 'function') {
      fns[key] = {
        enter: handler,
        leave: noop
      };
    }
  });
}


let visitor = {
  build(fns, overrideVisitorKeys) {
    let keys = visitorKeys;
    normalizeFns(fns);

    if (overrideVisitorKeys) {
      keys = merge({}, keys, overrideVisitorKeys);
    }
    function visit(node) {
      let extraArgs = nativeSlice.call(arguments, 1);
      let type = node[0],
          found = fns[type],
          foundFallback = fns.FALLBACK,
          walk = keys[type],
          walkFallBack = keys.FALLBACK;
      if (found) {
        found.enter.apply(api, arguments);
      } else if (foundFallback) {
        foundFallback.enter.apply(api, arguments);
      }
      if (walk) {
        walk.apply(api, [node, visit].concat(extraArgs));
      } else if (walkFallBack) {
        walkFallBack.apply(api, [node, visit].concat(extraArgs));
      }

      if (found) {
        found.leave.apply(api, arguments);
      } else if (foundFallback) {
        foundFallback.leave.apply(api, arguments);
      }
    }

    return visit;
  }

};

export default visitor;
