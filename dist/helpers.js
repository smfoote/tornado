/*eslint no-debugger:0 */

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
  highlight: function highlight(context, params) {
    var text = params.text;
    var highlights = params.highlights;

    var frag = document.createDocumentFragment();
    var sortedHighlights = highlights.sort(function (a, b) {
      return a.end - b.end;
    });
    var strParts = [];
    var prevEnd = 0;
    var hl = undefined;
    for (var i = 0; hl = sortedHighlights[i]; i++) {
      strParts.push({ type: "plain", val: text.slice(prevEnd, hl.start) });
      strParts.push({ type: "bold", val: text.slice(hl.start, hl.end) });
      prevEnd = hl.end;
    }
    strParts.push({ type: "plain", val: text.slice(prevEnd, text.length) });
    strParts.forEach(function (part) {
      if (part.type === "plain") {
        if (part.val.length) {
          frag.appendChild(document.createTextNode(part.val));
        }
      } else {
        var el = document.createElement("b");
        el.appendChild(document.createTextNode(part.val));
        frag.appendChild(el);
      }
    });
    return frag;
  }
};

module.exports = helpers;
//# sourceMappingURL=helpers.js.map