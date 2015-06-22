"use strict";

var emptyFrag = function emptyFrag() {
  return document.createDocumentFragment();
};

var truthTest = function truthTest(params, bodies, context, test) {
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
  }
};

module.exports = helpers;
//# sourceMappingURL=helpers.js.map