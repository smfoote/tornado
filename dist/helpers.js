"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/*eslint no-debugger:0 */

var util = _interopRequire(require("./util"));

var emptyFrag = function emptyFrag() {
  return document.createDocumentFragment();
};

var MATH_OPERATOR_MAP = {
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
  "%": "mod"
};

var truthTest = function truthTest(context, params, bodies, helperContext, test) {
  var key = params.key;
  var val = params.val;

  var selectState = helperContext.get("$selectState");
  if (!key && selectState) {
    key = selectState.key;
  }
  util.assert(key !== undefined, "@eq, @ne, @lt, @lte, @gt, @gte require a `key` parameter in themselves or in a parent helper");
  util.assert(val !== undefined, "@eq, @ne, @lt, @lte, @gt, @gte require a `val` parameter");
  var main = bodies.main;

  var elseBody = bodies["else"];
  if (key && val) {
    if (test(key, val)) {
      var res = undefined;
      if (main) {
        res = main(context);
      }
      if (selectState) {
        selectState.isResolved = true;
      }
      return res;
    } else if (elseBody) {
      return elseBody(context);
    }
  }

  // There are no appropriate bodies, so return an empty fragment
  return emptyFrag();
};

var helpers = {
  sep: function sep(context, params, bodies, helperContext) {
    if (helperContext.get("$idx") < helperContext.get("$len") - 1) {
      return bodies.main(context);
    }
  },
  first: function first(context, params, bodies, helperContext) {
    if (helperContext.get("$idx") === 0) {
      return bodies.main(context);
    }
  },
  last: function last(context, params, bodies, helperContext) {
    if (helperContext.get("$idx") === helperContext.get("$len") - 1) {
      return bodies.main(context);
    }
  },
  eq: function eq(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, function (left, right) {
      return left === right;
    });
  },
  ne: function ne(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, function (left, right) {
      return left !== right;
    });
  },
  gt: function gt(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, function (left, right) {
      return left > right;
    });
  },
  lt: function lt(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, function (left, right) {
      return left < right;
    });
  },
  gte: function gte(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, function (left, right) {
      return left >= right;
    });
  },
  lte: function lte(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, function (left, right) {
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
  },
  select: function select(context, params, bodies, helperContext) {
    var key = params.key;

    util.assert(key !== undefined, "@select helper requires a `key` parameter");
    helperContext.set("selectState", {
      key: key,
      isResolved: false
    });
    return bodies.main(context);
  },
  "default": function _default(context, params, bodies, helperContext) {
    var selectState = helperContext.get("$selectState");
    if (selectState && !selectState.isResolved) {
      return bodies.main(context);
    }
  },
  math: function math(context, params, bodies, helperContext) {
    var a = params.a;
    var b = params.b;
    var operator = params.operator;
    var round = params.round;
    var main = bodies.main;

    var res = undefined;

    util.assert(a !== undefined, "@math requires the `a` parameter");
    util.assert(operator !== undefined, "@math requires the `operator` parameter");

    if (Object.keys(MATH_OPERATOR_MAP).indexOf(operator) > -1) {
      operator = MATH_OPERATOR_MAP[operator];
    }

    a = parseFloat(a);
    b = parseFloat(b);

    switch (operator) {
      case "add":
        res = a + b;
        break;
      case "subtract":
        res = a - b;
        break;
      case "multiply":
        res = a * b;
        break;
      case "divide":
        util.assert(b !== 0, "Division by 0 is not allowed, not even in Tornado");
        res = a / b;
        break;
      case "mod":
        util.assert(b !== 0, "Division by 0 is not allowed, not even in Tornado");
        res = a % b;
        break;
      case "ceil":
      case "floor":
      case "round":
      case "abs":
        res = Math[operator](a);
        break;
      case "toint":
        res = parseInt(a, 10);
        break;
      default:
        // TODO replace this with proper error handling
        console.log("@math does not support " + operator + " operator");
    }
    if (round) {
      res = Math.round(res);
    }
    if (main) {
      helperContext.set("selectState", {
        key: res,
        isResolved: false
      });
      return bodies.main(context);
    } else {
      return emptyFrag().appendChild(document.createTextNode(res));
    }
  }
};

module.exports = helpers;
//# sourceMappingURL=helpers.js.map