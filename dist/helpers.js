"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/*eslint no-debugger:0 */

var util = _interopRequire(require("./util"));

var emptyFrag = function emptyFrag() {
  return document.createDocumentFragment();
};

var truthTest = function truthTest(params, bodies, context, test) {
  util.assert(params.val !== undefined, "The `val` param is required for @eq, @ne, @lt, @lte, @gt, and @gte");
  var key = params.key;
  var val = params.val;
  var main = bodies.main;

  var elseBody = bodies["else"];
  if (key && val) {
    if (test(key, val)) {
      if (main) {
        return main(context);
      }
    } else if (elseBody) {
      return elseBody(context);
    }
  }

  // There are no appropriate bodies, so return an empty fragment
  return emptyFrag();
};

var helpers = {
  eq: function eq(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left === right;
    });
  },
  ne: function ne(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left !== right;
    });
  },
  gt: function gt(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left > right;
    });
  },
  lt: function lt(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left < right;
    });
  },
  gte: function gte(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left >= right;
    });
  },
  lte: function lte(context, params, bodies) {
    return truthTest(params, bodies, context, function (left, right) {
      return left <= right;
    });
  },
  contextDump: function contextDump(context, params) {
    var formattedContext = JSON.stringify(context, null, 2);
    if (params.to === "console") {
      console.log(formattedContext);
    } else {
      var frag = document.createDocumentFragment();
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(formattedContext));
      frag.appendChild(pre);
      return frag;
    }
  },
  "debugger": function _debugger() {
    debugger;
  }
};

module.exports = helpers;
//# sourceMappingURL=helpers.js.map