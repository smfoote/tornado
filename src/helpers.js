/*eslint no-debugger:0 */

import util from './util';

let emptyFrag = function() {
  return document.createDocumentFragment();
};

const MATH_OPERATOR_MAP = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '%': 'mod'
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
  },
  math(context, params, bodies, helperContext) {
    let {a, b, operator, round} = params;
    let {main} = bodies;
    let res;

    util.assert(a !== undefined, '@math requires the `a` parameter');
    util.assert(operator !== undefined, '@math requires the `operator` parameter');

    if (Object.keys(MATH_OPERATOR_MAP).indexOf(operator) > -1) {
      operator = MATH_OPERATOR_MAP[operator];
    }

    a = parseFloat(a);
    b = parseFloat(b);

    switch (operator) {
      case 'add':
        res = a + b;
        break;
      case 'subtract':
        res = a - b;
        break;
      case 'multiply':
        res = a * b;
        break;
      case 'divide':
        util.assert(b !== 0, 'Division by 0 is not allowed, not even in Tornado');
        res = a / b;
        break;
      case 'mod':
        util.assert(b !== 0, 'Division by 0 is not allowed, not even in Tornado');
        res = a % b;
        break;
      case 'ceil':
      case 'floor':
      case 'round':
      case 'abs':
        res = Math[operator](a);
        break;
      case 'toint':
        res = parseInt(a, 10);
        break;
      default:
        // TODO replace this with proper error handling
        console.log(`@math does not support ${operator} operator`);
    }
    if (round) {
      res = Math.round(res);
    }
    if (main) {
      helperContext.set('selectState', {
        key: res,
        isResolved: false
      });
      return bodies.main(context);
    } else {
      return emptyFrag().appendChild(document.createTextNode(res));
    }
  },
  repeat(context, params, bodies, helperContext) {
    let {count} = params;
    let {main} = bodies;
    util.assert(typeof count === 'number' && count >= 0, '@repeat requires the `count` param, and it must be a number 0 or greater.');
    let frag = emptyFrag();
    helperContext.set('len', count);
    for (let i = 0; i < count; i++) {
      helperContext.set('idx', i);
      frag.appendChild(main(context));
    }
    return frag;
  }
};

export default helpers;
