"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("./util"));

/**
 * Check if a value is truthy. If the value is a promise, wait until the promise resolves,
 * then check if the resolved value is truthy.
 */
var exists = function exists(context, params, bodies, td) {
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
};

/**
 * Inverse of exists
 */
var notExists = function notExists(context, params, bodies, td) {
  var mainBody = bodies.main;
  var elseBody = bodies["else"];
  bodies.main = elseBody;
  bodies["else"] = mainBody;
  return exists(context, params, bodies, td);
};

/**
 * Break out the logic of whether the rendering context of a section is an Array
 * @param {Function} body The appropriate body rendering function to be rendered with `val`.
 * @param {*} ctx The context to be used to render the body
 * @return {DocumentFragment}
 */
var sectionResult = function sectionResult(body, ctx, td) {
  if (!body) {
    return "";
  }
  if (Array.isArray(ctx)) {
    var frag = td.createDocumentFragment();
    td.helperContext.set("len", ctx.length);
    for (var i = 0, item = undefined; item = ctx[i]; i++) {
      td.helperContext.set("idx", i);
      frag.appendChild(body(item));
    }
    return frag;
  } else {
    return body(ctx);
  }
};

/**
 * Check for truthiness in the same way the exists helper does. If truthy, render the main
 * body with using the result of `td.get(params.key.split('.')` as the context (if the result is
 * an array, loop through the array and render the main body for each value in the array). If
 * falsy, optionally render the else body using `context`. Handle promises the way the exists
 * helper does.
 */
var section = function section(context, params, bodies, td) {
  var key = params.key.split(".");
  var val = td.get(context, key);
  var body = undefined,
      ctx = undefined;
  Object.keys(params).forEach(function (key) {
    if (key !== "key") {
      td.helperContext.set(key, params[key]);
    }
  });
  if (util.isPromise(val)) {
    return val.then(function (data) {
      if (util.isTruthy(data)) {
        return sectionResult(bodies.main, data, td);
      } else {
        return sectionResult(bodies["else"], context, td);
      }
    })["catch"](function () {
      return sectionResult(bodies["else"], context, td);
    });
  } else {
    if (util.isTruthy(val)) {
      body = bodies.main;
      ctx = val;
    } else {
      body = bodies["else"];
      ctx = context;
    }
    var res = undefined;
    res = sectionResult(body, ctx, td);
    return res;
  }
};

var helpers = {
  exists: exists,
  notExists: notExists,
  section: section
};

module.exports = helpers;
//# sourceMappingURL=builtinHelpers.js.map