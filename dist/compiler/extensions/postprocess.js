"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

// helper method for recursively writing elements
function writeElements(indexes, elements, parent, out) {
  var name = typeof parent === "number" ? "el" + parent : "frag";
  indexes.forEach(function (i) {
    var el = elements[i];
    if (el.type === "placeholder") {
      out.push("res.p" + i + " = td.createTextNode('" + el.type + "');\n");
    } else if (el.type === "plaintext") {
      out.push("var el" + i + " = td.createTextNode('" + el.type + "');\n");
    } else {
      out.push("var el" + i + " = td.createElement('" + el.type + "-" + el.key + "');\n");
    }
    out.push("" + name + ".appendChild(el" + i + ");\n");
    // recurse over the children
    if (el.elements) {
      writeElements(el.elements, elements, i, out);
    }
  });
}

function writeFragments(results) {
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
}

function writeBodyAlternates(indexes, bodys, out) {
  if (indexes.length) {
    indexes.forEach(function (i) {
      out.push(", " + bodys[i].name + ": this.r" + i + ".bind(this)");
    });
  }
}
function writeBodyMains(indexes, bodys, params, out) {
  indexes.forEach(function (i) {
    var body = bodys[i];
    var key = typeof body.key === "string" ? body.key : "td.get(c, " + JSON.stringify(body.key) + ")";
    if (body.type === "helper") {
      // helper - key, placeholder, context, params, bodies
      out.push("td." + body.type + "(" + key + ", root.p" + body.element + ", c, ");
      writeBodyParams(body.params, params, out);
      out.push(", {main: this.r" + i + ".bind(this)");
      writeBodyAlternates(body.bodies, bodys, out);
      out.push("});\n");
    } else if (body.type === "block") {} else {
      // exists - key, placeholder, bodies, context
      // notexists - key, placeholder, bodies, context
      // section - key, placeholder, bodies, context
      out.push("td." + body.type + "(" + key + ", root.p" + body.element + ", {main: this.r" + i + ".bind(this)");
      writeBodyAlternates(body.bodies, bodys, out);
      out.push(", c});\n");
    }
  });
}
function writeBodyParams(indexes, params, out) {
  var keyValues = [];
  out.push("{");
  if (indexes.length) {
    indexes.forEach(function (i) {
      var p = params[i],
          value = undefined;
      //TODO: string interpolation is not supported yet e.g. param="hello {foo}"
      value = typeof p.value === "string" ? p.value : "td.get(c, " + JSON.stringify(p.value) + ")";
      keyValues.push("" + p.key + ": " + value);
    });
    out.push(keyValues.join(", "));
  }
  out.push("}");
}
function writeBodyRefs(references, out) {
  references.forEach(function (ref) {
    var key = typeof ref === "string" ? key : "td.get(c, " + JSON.stringify(ref.key) + ")";
    out.push("td." + util.getTdMethodName("replaceNode") + "(root.p" + ref.element + ", td." + util.getTdMethodName("createTextNode") + "(" + key + "));");
  });
}

function writeBodys(results) {
  var bodys = results.state.entities.bodys,
      params = results.state.entities.params;
  // initialize the results renderer
  results.code.renderers = [];
  bodys.forEach(function (b, idx) {
    var codeRenderer = [];
    // add method header
    codeRenderer.push("r" + idx + ": function() {\n      var root = this.f" + b.fragment + ";\n");
    // add all references
    if (b.refs) {
      writeBodyRefs(b.refs, codeRenderer);
    }
    // add all mains
    writeBodyMains(b.mains, bodys, params, codeRenderer);
    // add method footer
    codeRenderer.push("return root.frag;\n}");
    results.code.renderers.push(codeRenderer.join(""));
  });
}

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

// block - name, idx, context, template
//# sourceMappingURL=postprocess.js.map