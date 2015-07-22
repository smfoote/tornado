/*eslint no-debugger:0 */

import util from './util';

let emptyFrag = function() {
  return document.createDocumentFragment();
};

let truthTest = function(context, params, bodies, helperContext, test) {
  let {key, val} = params;
  let selectState = helperContext.get('$selectState');
  if (!key && selectState) {
    key = selectState.key;
  }
  util.assert(key !== undefined, '@eq, @ne, @lt, @lte, @gt, @gte require a `key` parameter in themselves or in a parent helper');
  util.assert(val !== undefined, '@eq, @ne, @lt, @lte, @gt, @gte require a `val` parameter');
  let {main} = bodies;
  let elseBody = bodies.else;
  if (key && val) {
    if (test(key, val)) {
      let res;
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
  eq(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, (left, right) => {
      return left === right;
    });
  },
  ne(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, (left, right) => {
      return left !== right;
    });
  },
  gt(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, (left, right) => {
      return left > right;
    });
  },
  lt(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, (left, right) => {
      return left < right;
    });
  },
  gte(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, (left, right) => {
      return left >= right;
    });
  },
  lte(context, params, bodies, helperContext) {
    return truthTest(context, params, bodies, helperContext, (left, right) => {
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
  },
  select(context, params, bodies, helperContext) {
    let {key} = params;
    util.assert(key !== undefined, '@select helper requires a `key` parameter');
    helperContext.set('selectState', {
      key: key,
      isResolved: false
    });
    return bodies.main(context);
  },
  default(context, params, bodies, helperContext) {
    let selectState = helperContext.get('$selectState');
    if (selectState && !selectState.isResolved) {
      return bodies.main(context);
    }
  }
};

export default helpers;
