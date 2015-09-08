/*eslint no-debugger:0 */

import util from './util';

/**
 * Check if a value is truthy. If the value is a promise, wait until the promise resolves,
 * then check if the resolved value is truthy.
 */
function exists(context, params, bodies, td) {
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
}

/**
 * Inverse of exists
 */
function notExists(context, params, bodies, td) {
  let mainBody = bodies.main;
  let elseBody = bodies.else;
  bodies.main = elseBody;
  bodies.else = mainBody;
  return exists(context, params, bodies, td);
}

let helpers = {
  exists,
  notExists
};

export default helpers;
