"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

// helper method for recursively writing elements
var writeElements = (function (_writeElements) {
  var _writeElementsWrapper = function writeElements(_x, _x2, _x3, _x4) {
    return _writeElements.apply(this, arguments);
  };

  _writeElementsWrapper.toString = function () {
    return _writeElements.toString();
  };

  return _writeElementsWrapper;
})(function (indexes, elements, parent, out) {
  parent = parent ? "el" + parent : "frag";
  indexes.forEach(function (i) {
    var el = elements[i];
    if (el.type === "placeholder" || el.type === "plaintext") {
      out.push("var el" + i + " = td.createTextNode('" + el.type + "');\n");
    } else {
      out.push("var el" + i + " = td.createElement('" + el.type + "');\n");
    }
    out.push("" + parent + ".appendChild(el" + i + ");\n");
    // recurse over the children
    if (el.elements) {
      writeElements(el.elements, elements, parent, out);
    }
  });
});

var writeFragments = function writeFragments(results) {
  var fragments = results.state.entities.fragments,
      elements = results.state.entities.elements;

  // initialize the results fragment
  results.code.fragments = [];

  fragments.forEach(function (f, idx) {
    var codeFragments = [];
    // add method header
    codeFragments.push("f" + idx + ": function() {\n      var res = {};\n      var frag = td." + util.getTdMethodName("createDocumentFragment") + "();\n      res.frag = frag;\n");
    // add all elements of this fragment
    writeElements(f.elements, elements, null, codeFragments);
    // add method footer
    codeFragments.push("}");
    results.code.fragments.push(codeFragments.join(""));
  });
};

var writeBodys = function writeBodys(results) {
  var bodys = results.state.entities.bodys;
  // initialize the results renderer
  results.code.renderers = [];
  bodys.forEach(function (b, idx) {
    var codeRenderer = [];
    // add method header
    codeRenderer.push("r" + idx + ": function() {\n      var root = this.f" + b.fragment + ";\n");
    // add all mains
    // add all alternate bodies
    // add method footer
    codeRenderer.push("return root.frag\n}");
    results.code.renderers.push(codeRenderer.join(""));
  });
};

var flush = function flush(results) {
  var templateVars = [];
  if (results.extensions && results.extensions.templateVars) {
    templateVars = results.extensions.templateVars;
  }
  results.code = "(function(){\nvar frags = {},\n  " + templateVars.join("\n  ") + "\n  template = {\n    " + results.code.fragments.join(",\n    ") + ",\n    " + results.code.renderers.join(",\n    ") + "\n  };\n  template.render = template.r0;\n  td." + util.getTdMethodName("register") + "(\"" + results.name + "\", template);\n  return template;\n})();";
};

var postprocess = function postprocess(results) {
  if (results) {
    writeFragments(results);
    writeBodys(results);
    flush(results);
  }
};

module.exports = postprocess;
//# sourceMappingURL=postprocess.js.map