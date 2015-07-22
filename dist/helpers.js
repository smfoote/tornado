"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/*eslint no-debugger:0 */

var util = _interopRequire(require("./util"));

var emptyFrag = function emptyFrag() {
  return document.createDocumentFragment();
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
  }
};

module.exports = helpers;
//# sourceMappingURL=helpers.js.map