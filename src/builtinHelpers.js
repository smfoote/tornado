import util from './util';

/**
 * Check if a value is truthy. If the value is a promise, wait until the promise resolves,
 * then check if the resolved value is truthy.
 */
let exists = function exists(context, params, bodies, td) {
  let key = params.key.split('.');
  let val = td.get(context, key);
  if (util.isPromise(val)) {
    return val.then(data => {
      if (util.isTruthy(data)) {
        if (bodies.main) {
          return bodies.main(context);
        }
      } else if (bodies.else) {
        return bodies.else(context);
      }
    }).catch(() => {
      if (bodies.else) {
        return bodies.else(context);
      }
    });
  } else {
    if (util.isTruthy(val)) {
      if (bodies.main) {
        return bodies.main(context);
      }
    } else if (bodies.else) {
      return bodies.else(context);
    }
  }
};

/**
 * Inverse of exists
 */
let notExists = function notExists(context, params, bodies, td) {
  let mainBody = bodies.main;
  let elseBody = bodies.else;
  bodies.main = elseBody;
  bodies.else = mainBody;
  return exists(context, params, bodies, td);
};


/**
 * Break out the logic of whether the rendering context of a section is an Array
 * @param {Function} body The appropriate body rendering function to be rendered with `val`.
 * @param {*} ctx The context to be used to render the body
 * @return {DocumentFragment}
 */
let sectionResult = function(body, ctx, td) {
  if (!body) {
    return '';
  }
  if (Array.isArray(ctx)) {
    let frag = td.createDocumentFragment();
    td.helperContext.set('len', ctx.length);
    for (let i = 0, item; (item = ctx[i]); i++) {
      td.helperContext.set('idx', i);
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
let section = function section(context, params, bodies, td) {
  let key = params.key.split('.');
  let val = td.get(context, key);
  let body, ctx;
  Object.keys(params).forEach((key) => {
    if (key !== 'key') {
      td.helperContext.set(key, params[key]);
    }
  });
  if (util.isPromise(val)) {
    return val.then(data => {
      if (util.isTruthy(data)) {
        return sectionResult(bodies.main, data, td);
      } else {
        return sectionResult(bodies.else, context, td);
      }
    }).catch(() => {
      return sectionResult(bodies.else, context, td);
    });
  } else {
    if (util.isTruthy(val)) {
      body = bodies.main;
      ctx = val;
    } else {
      body = bodies.else;
      ctx = context;
    }
    let res;
    res = sectionResult(body, ctx, td);
    return res;
  }
};

let helpers = {
  exists,
  notExists,
  section
};

export default helpers;
