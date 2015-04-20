"use strict";

var STATES = {
  OUTER_SPACE: "OUTER_SPACE",
  HTML_TAG: "HTML_TAG",
  HTML_BODY: "HTML_BODY",
  HTML_ATTRIBUTE: "HTML_ATTRIBUTE",
  TORNADO_TAG: "TORNADO_TAG",
  TORNADO_BODY: "TORNADO_BODY"
};
var elIndex = -1;
var compiler = {
  compile: function compile(ast, name) {
    this.context = {
      tornadoBodiesIndex: 0,
      elsWithRefs: [],
      htmlBodiesIndexes: [],
      htmlBodiesCount: -1,
      refCount: 0,
      blocks: {},
      state: STATES.OUTER_SPACE
    };
    this.fragments = "f" + this.context.tornadoBodiesIndex + ": function() {\n      var frag = document.createDocumentFragment();\n      var cache = {frag: frag}\n";
    this.renderers = "r" + this.context.tornadoBodiesIndex + ": function(c) {\n      var root = frags.frag" + this.context.tornadoBodiesIndex + " || this.f" + this.context.tornadoBodiesIndex + "();\n";
    this.walk(ast);
    return "(function(){\n  \"use strict\";\n  var frags = {},\n  t = {\n    " + this.fragments + "\n    " + this.renderers + "\n    render: null\n  };\n  t.render = t.r0;\n  td.register(\"" + name + "\", t);\n  return t;\n})();";
  },
  step: function step(node) {
    if (node[0] && this[node[0]]) {
      this[node[0]](node);
    }
  },
  walk: function walk() {
    var _this = this;

    var nodes = arguments[0] === undefined ? [] : arguments[0];

    nodes.forEach(function (n) {
      return _this.step(n);
    });
    this.fragments = "" + this.fragments + "      return cache;\n  },\n";
    this.renderers = "" + this.renderers + "      return root.frag;\n    },";
  },
  walkContents: function walkContents() {
    var _this = this;

    var nodes = arguments[0] === undefined ? [] : arguments[0];

    var indexes = this.context.htmlBodiesIndexes;
    nodes.forEach(function (n) {
      _this.step(n);
      console.log("indexes before: " + JSON.stringify(indexes));
      indexes[indexes.length - 1]++;
      console.log("indexes after: " + JSON.stringify(indexes));
    });
  },
  buildElementAttributes: function buildElementAttributes() {
    var attributes = arguments[0] === undefined ? [] : arguments[0];

    var attrs = "";
    var previousState = this.context.state;
    this.context.state = STATES.HTML_ATTRIBUTE;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = attributes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var attr = _step.value;

        attrs += "el" + this.context.htmlBodiesCount + ".setAttribute('" + attr.attrName + "', '" + this.walk(attr.value) + "');";
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"]) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    this.context.state = previousState;
    return attrs;
  },
  getElContainerName: function getElContainerName() {
    var count = this.context.htmlBodiesCount;
    if (this.context.state === STATES.OUTER_SPACE || count === -1) {
      return "frag";
    } else {
      return "el" + count;
    }
  },
  TORNADO_BODY: function TORNADO_BODY(node) {
    this.context.nextTdBody = node[1].body;
    return "";
  },
  TORNADO_REFERENCE: function TORNADO_REFERENCE(node) {
    var indexes = this.context.htmlBodiesIndexes;
    var idx = indexes[indexes.length - 1]++;
    var refCount = this.context.refCount++;
    if (this.context.state === STATES.HTML_BODY) {
      var containerName = this.getElContainerName();
      this.fragments = "" + this.fragments + "      cache.ref" + refCount + " = " + containerName + ";\n      " + this.getElContainerName() + ".appendChild(document.createComment(''));\n";
      this.renderers = "" + this.renderers + "      root.ref" + refCount + ".replaceChildAtIdx(" + idx + ", document.createTextNode(td.get(c, " + JSON.stringify(node[1].key) + ")));\n";
    }
  },
  HTML_ELEMENT: function HTML_ELEMENT(node) {
    var nodeInfo = node[1].tag_info;
    var nodeContents = node[1].tag_contents;
    this.context.state = STATES.HTML_BODY;
    this.context.htmlBodiesIndexes.push(0);
    var count = ++this.context.htmlBodiesCount;
    console.log(nodeInfo.key);
    console.log(JSON.stringify(this.context.htmlBodiesIndexes));
    this.fragments = "" + this.fragments + "      var el" + count + " = document.createElement(\"" + nodeInfo.key + "\");" + this.buildElementAttributes(nodeInfo.attributes) + "\n";
    this.walkContents(nodeContents);
    this.context.htmlBodiesIndexes.pop();
    this.context.htmlBodiesCount--;
    this.fragments = "" + this.fragments + "      " + this.getElContainerName() + ".appendChild(el" + (this.context.htmlBodiesCount + 1) + ");\n";
  },
  PLAIN_TEXT: function PLAIN_TEXT(node) {
    if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return node[1];
    } else if (this.context.state === STATES.HTML_BODY) {
      this.fragments = "" + this.fragments + "      " + this.getElContainerName() + ".appendChild(document.createTextNode('" + node[1] + "'));\n";
    }
  }
};

module.exports = compiler;
//# sourceMappingURL=compiler.js.map