/*eslint no-debugger:0 */

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
  highlight(context, params) {
    let {text, highlights} = params;
    let frag = document.createDocumentFragment();
    let sortedHighlights = highlights.sort((a, b) => { return a.end - b.end; });
    let strParts = [];
    let prevEnd = 0;
    let hl;
    for (let i = 0; hl = sortedHighlights[i]; i++) {
      strParts.push({type: 'plain', val: text.slice(prevEnd, hl.start)});
      strParts.push({type: 'bold', val: text.slice(hl.start, hl.end)});
      prevEnd = hl.end;
    }
    strParts.push({type: 'plain', val: text.slice(prevEnd, text.length)});
    strParts.forEach(part => {
      if (part.type === 'plain') {
        if (part.val.length) {
          frag.appendChild(document.createTextNode(part.val));
        }
      } else {
        let el = document.createElement('b');
        el.appendChild(document.createTextNode(part.val));
        frag.appendChild(el);
      }
    });
    return frag;
  }
};

export default helpers;
