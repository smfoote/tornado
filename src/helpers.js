/*eslint no-debugger:0 */

import util from './util';

let emptyFrag = function() {
  return document.createDocumentFragment();
};

let truthTest = function(params, bodies, context, test) {
  util.assert(params.val !== undefined, 'The `val` param is required for @eq, @ne, @lt, @lte, @gt, and @gte');
  let {key, val} = params;
  let {main} = bodies;
  let elseBody = bodies.else;
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

let helpers = {
  sep(context, params, bodies, helperContext) {
    if (helperContext.get('$idx') < helperContext.get('$len') - 1) {
      return bodies.main(context);
    }
  },
  first(context, params, bodies, helperContext) {
    if (helperContext.get('$idx') === 0) {
      return bodies.main(context);
    }
  },
  last(context, params, bodies, helperContext) {
    if (helperContext.get('$idx') === helperContext.get('$len') - 1) {
      return bodies.main(context);
    }
  },
  eq(context, params, bodies) {
    return truthTest(params, bodies, context, (left, right) => {
      return left === right;
    });
  },
  ne(context, params, bodies) {
    return truthTest(params, bodies, context, (left, right) => {
      return left !== right;
    });
  },
  gt(context, params, bodies) {
    return truthTest(params, bodies, context, (left, right) => {
      return left > right;
    });
  },
  lt(context, params, bodies) {
    return truthTest(params, bodies, context, (left, right) => {
      return left < right;
    });
  },
  gte(context, params, bodies) {
    return truthTest(params, bodies, context, (left, right) => {
      return left >= right;
    });
  },
  lte(context, params, bodies) {
    return truthTest(params, bodies, context, (left, right) => {
      return left <= right;
    });
  },
  contextDump(context, params) {
    let formattedContext = JSON.stringify(context, null, 2);
    if (params.to === 'console') {
      console.log(formattedContext);
    } else {
      let frag = document.createDocumentFragment();
      let pre = document.createElement('pre');
      pre.appendChild(document.createTextNode(formattedContext));
      frag.appendChild(pre);
      return frag;
    }
  },
  debugger() {
    debugger;
  }
};

export default helpers;
