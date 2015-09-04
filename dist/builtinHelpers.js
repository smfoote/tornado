"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/*eslint no-debugger:0 */

var util = _interopRequire(require("./util"));

var helpers = {
  /**
   * Check if a value is truthy. If the value is a promise, wait until the promise resolves,
   * then check if the resolved value is truthy.
   */
  exists: function exists(context, params, bodies, td) {
    var key = params.key.split(".");
    var val = td.get(context, key);
    if (util.isPromise(val)) {
      return val.then(function (data) {
        if (util.isTruthy(data)) {
          if (bodies.main) {
            return bodies.main(context);
          }
        } else if (bodies["else"]) {
          return bodies["else"](context);
        }
      })["catch"](function () {
        if (bodies["else"]) {
          return bodies["else"](context);
        }
      });
    } else {
      if (util.isTruthy(val)) {
        if (bodies.main) {
          return bodies.main(context);
        }
      } else if (bodies["else"]) {
        return bodies["else"](context);
      }
    }
  }
};

module.exports = helpers;
//# sourceMappingURL=builtinHelpers.js.map