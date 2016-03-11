"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * the visitor pattern so we can map AST to functions
 */

var visitorKeys = _interopRequire(require("./visitorKeys"));

var merge = _interopRequire(require("lodash.merge"));

var api = _interopRequire(require("./visitorApi"));

var nativeSlice = Array.prototype.slice;

function noop() {}

// visit can be an object with enter leave or a function
// if it is a function, run this on enter
function normalizeFns(fns) {
  Object.keys(fns).forEach(function (key) {
    var handler = fns[key];
    if (typeof handler === "function") {
      fns[key] = {
        enter: handler,
        leave: noop
      };
    }
  });
}

var visitor = {
  build: function build(fns, overrideVisitorKeys) {
    var keys = visitorKeys;
    normalizeFns(fns);

    if (overrideVisitorKeys) {
      keys = merge({}, keys, overrideVisitorKeys);
    }
    function visit(node) {
      var extraArgs = nativeSlice.call(arguments, 1);
      var type = node[0],
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

module.exports = visitor;
//# sourceMappingURL=visitor.js.map