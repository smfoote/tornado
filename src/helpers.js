let emptyFrag = function() {
  return document.createDocumentFragment();
};

let truthTest = function(params, bodies, context, test) {
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
  action(context, params, bodies) {
    let {selector, type, method} = params;
    type = type || 'click';
    let frag = bodies.main(context);
    frag.querySelector(selector).addEventListener(type, context[method].bind(context));
    return frag;
  }
};

export default helpers;
