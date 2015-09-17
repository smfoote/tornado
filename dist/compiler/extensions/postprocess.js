"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

var SQ = /'/g;
function toStringLiteral(val) {
  return typeof val === "string" ? "'" + val.replace(SQ, "\\'") + "'" : val;
}

function writeVals(indexes, entities, out) {
  var vals = entities.vals,
      refs = entities.refs,
      bodys = entities.bodys;
  if (indexes && indexes.length) {
    indexes.forEach(function (i) {
      var v = vals[i];
      var outBodyMap = [];
      if (v.type === "plaintext") {
        out.push(toStringLiteral(v.content));
      } else if (v.type === "placeholder") {
        // TODO: string interpolation is not supported yet e.g. paramOrAttr="hello {foo}"
        switch (v.to) {
          case "refs":
            // a generic writeRef Method instead?
            var ref = refs[v.id];
            out.push("td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(ref.key) + ")");
            break;
          case "bodys":
            var o = [];
            var body = bodys[v.id];
            var key = undefined;
            /* make a generic writeBody method that can handle from fragments and renderer? */
            if (body.type === "helper") {
              // helper - key, placeholder, context, params, bodies
              key = typeof body.key === "string" ? body.key : body.key.join(".");
              o.push("td." + util.getTdMethodName(body.type) + "(" + toStringLiteral(key) + ", null, c, ");
              writeBodyParams(body.params, entities, o);
              outBodyMap.push("main: this.r" + v.id + ".bind(this)");
              writeBodyAlternates(body.bodies, entities, outBodyMap);
              o.push(", {" + outBodyMap.join(",") + "})");
            } else if (body.type === "block") {
              // block - name, idx, context, template
              key = typeof body.key === "string" ? body.key : body.key.join(".");
              out.push("td." + util.getTdMethodName("block") + "(" + toStringLiteral(key) + ", null, " + v.id + ", c, this)");
            } else if (body.type === "inlinePartial") {} else if (body.type === "partial") {
              key = typeof body.key === "string" ? body.key : body.key.join(".");
              out.push("td." + util.getTdMethodName("getPartial") + "(" + toStringLiteral(key) + ", null, c, this)");
            } else {
              key = typeof body.key === "string" ? body.key : "td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(body.key) + ")";
              // exists - key, placeholder, bodies, context
              // notexists - key, placeholder, bodies, context
              // section - key, placeholder, bodies, context
              o.push("td." + util.getTdMethodName(body.type) + "(" + key + ", null, {");
              outBodyMap.push("main: this.r" + v.id + ".bind(this)");
              writeBodyAlternates(body.bodies, entities, outBodyMap);
              o.push("${outBodyMap.join(", ")}}, c)");
            }
            out.push(o.join(""));
            break;
          default:
            throw "not_implemented";
        }
      }
    });
  }
}
function writeAttributeValues(attrValues, entities, out) {
  var allVals = [];
  writeVals(attrValues, entities, allVals);
  out.push(allVals.join(","));
}
function writeAttributes(attrIndexes, entities, out, parentEl) {
  var attrs = entities.attrs;
  attrIndexes.forEach(function (ithAttr) {
    var a = attrs[ithAttr];
    out.push("td." + util.getTdMethodName("setAttribute") + "(el" + parentEl + ", " + toStringLiteral(a.key) + ", ");
    var aVals = a.vals;
    if (aVals && aVals.length) {
      out.push("[");
      writeAttributeValues(a.vals, entities, out);
      out.push("]");
    } else {
      // for boolean properties like checked="checked"
      out.push(toStringLiteral(a.key));
    }
    out.push(");\n");
  });
}
// recursively writing elements
function writeElements(indexes, entities, out, parent) {
  var elements = entities.elements,
      attrs = entities.attrs;

  indexes.forEach(function (i) {
    var el = elements[i];
    // depth first so recurse over the children
    if (el.elements && el.elements.length) {
      writeElements(el.elements, entities, out, i);
    }

    var elAttrs = el.attrs;
    var name = "el" + i;
    // write this element
    if (el.type === "placeholder") {
      out.push("var el" + i + " = res.p" + i + " = td." + util.getTdMethodName("createTextNode") + "('');\n");
    } else if (el.type === "plaintext") {
      out.push("var el" + i + " = td." + util.getTdMethodName("createTextNode") + "(" + toStringLiteral(el.content) + ");\n");
    } else if (el.type === "htmlComment") {
      out.push("var el" + i + " = td." + util.getTdMethodName("createHTMLComment") + "(" + toStringLiteral(el.content) + ");\n");
    } else {
      out.push("var el" + i + " = td." + util.getTdMethodName("createElement") + "(" + toStringLiteral(el.key));
      if (typeof el.namespace === "number") {
        var vals = attrs[el.namespace].vals;
        var valsOut = [];
        if (vals && vals.length) {
          out.push(", ");
          writeVals(vals, entities, valsOut);
          out.push(valsOut.join(""));
        }
      }

      out.push(");\n");
    }
    // write attributes
    if (elAttrs && elAttrs.length) {
      writeAttributes(elAttrs, entities, out, i);
    }

    if (el.elements && el.elements.length) {
      if (el.escapableRaw) {
        el.elements.forEach(function (j) {
          out.push("" + name + ".defaultValue += td." + util.getTdMethodName("nodeToString") + "(el" + j + ");\n");
        });
      } else {
        el.elements.forEach(function (j) {
          out.push("" + name + ".appendChild(el" + j + ");\n");
        });
      }
    }
  });
  // append all indexes to fragment
  if (!parent) {
    indexes.forEach(function (i) {
      out.push("frag.appendChild(el" + i + ");\n");
    });
  }
}

function writeFragmentsToResults(results) {
  var fragments = results.state.entities.fragments,
      entities = results.state.entities;

  // initialize the results fragment
  results.code.fragments = [];

  fragments.forEach(function (f, idx) {
    var out = [];
    // add method header
    out.push("f" + idx + ": function(c) {\n      var res = {};\n      var frag = td." + util.getTdMethodName("createDocumentFragment") + "();\n      res.frag = frag;\n");
    // add all elements of this fragment
    writeElements(f.elements, entities, out);
    // add method footer
    out.push("return res;\n}");
    results.code.fragments.push(out.join(""));
  });
}

function writeBodyAlternates(indexes, entities, out) {
  var bodys = entities.bodys;
  if (indexes && indexes.length) {
    indexes.forEach(function (i) {
      out.push("" + bodys[i].name + ": this.r" + i + ".bind(this)");
    });
  }
}
function writeBodyMains(indexes, entities, out) {
  indexes.forEach(function (i) {
    var bodys = entities.bodys;
    var body = bodys[i];
    var key = undefined;
    var outBodyMap = [];
    var placeholderEl = typeof body.from.id === "number" ? "root.p" + body.from.id : "null";
    // avoid writing body into fragments which is handled by writeval
    if (body.from.type !== "vals") {
      if (body.type === "helper") {
        // helper - key, placeholder, context, params, bodies
        key = typeof body.key === "string" ? body.key : body.key.join(".");
        out.push("td." + util.getTdMethodName(body.type) + "(" + toStringLiteral(key) + ", " + placeholderEl + ", c, ");
        writeBodyParams(body.params, entities, out);
        if (!body.isSelfClosing) {
          outBodyMap.push("main: this.r" + i + ".bind(this)");
        }
        writeBodyAlternates(body.bodies, entities, outBodyMap);
        out.push(", {" + outBodyMap.join(", ") + "});\n");
      } else if (body.type === "block") {
        // block - name, placeholderNode, idx, context, template
        key = typeof body.key === "string" ? body.key : body.key.join(".");
        out.push("td." + util.getTdMethodName("block") + "(" + toStringLiteral(key) + ", " + placeholderEl + ", " + i + ", c, this);\n");
      } else if (body.type === "inlinePartial") {} else if (body.type === "partial") {
        key = typeof body.key === "string" ? body.key : body.key.join(".");
        out.push("td." + util.getTdMethodName("getPartial") + "(" + toStringLiteral(key) + ", " + placeholderEl + ", c, this);\n");
      } else {
        key = typeof body.key === "string" ? body.key : "td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(body.key) + ")";
        // exists - key, placeholder, bodies, context
        // notexists - key, placeholder, bodies, context
        // section - key, placeholder, bodies, context
        out.push("td." + util.getTdMethodName(body.type) + "(" + key + ", " + placeholderEl + ", {");
        if (!body.isSelfClosing) {
          outBodyMap.push("main: this.r" + i + ".bind(this)");
        }
        writeBodyAlternates(body.bodies, entities, outBodyMap);
        out.push("${outBodyMap.join(", ")}}, c);\n");
      }
    }
  });
}
function writeBodyParams(indexes, entities, out) {
  var params = entities.params;
  var writtenParams = [];
  if (indexes && indexes.length) {
    indexes.forEach(function (i) {
      var p = params[i],
          vals = [];
      vals.push(toStringLiteral(p.key) + ":");
      if (p.vals) {
        writeVals(p.vals, entities, vals);
      }
      writtenParams.push(vals.join(" "));
    });
  }
  out.push("{" + writtenParams.join(",") + "}");
}
function writeBodyRefs(references, entities, out) {
  var refs = entities.refs;
  references.forEach(function (rId) {
    var ref = refs[rId];
    var key = typeof ref === "string" ? key : "td." + util.getTdMethodName("get") + "(c, " + JSON.stringify(ref.key) + ")";
    // write references based on type
    switch (ref.from.type) {
      case "bodys":
      case "elements":
        out.push("td." + util.getTdMethodName("replaceNode") + "(root.p" + ref.from.id + ", td." + util.getTdMethodName("createTextNode") + "(" + key + "));\n");
        break;
    }
  });
}

function writeBodysToResults(results) {
  var entities = results.state.entities;
  var bodys = entities.bodys;
  // initialize the results renderer
  results.code.renderers = [];
  bodys.forEach(function (b, idx) {
    var codeRenderer = [],
        suffix = idx;
    // add method header
    if (b.type === "block") {
      suffix = "_b_" + b.key.join(".") + "" + idx;
    } else if (b.type === "inlinePartial") {
      suffix = "_i_" + (typeof b.key === "string" ? b.key : b.key.join("."));
    }
    codeRenderer.push("r" + suffix + ": function(c) {\n      var root = this.f" + b.fragment + "(c);\n");
    // add all references
    if (b.refs && b.refs.length) {
      writeBodyRefs(b.refs, entities, codeRenderer);
    }
    // add all mains
    if (b.mains && b.mains.length) {
      writeBodyMains(b.mains, entities, codeRenderer);
    }
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
    writeFragmentsToResults(results);
    writeBodysToResults(results);
    flush(results);
  }
};

module.exports = postprocess;

// inline partial - happens at runtime in block

// inline partial - happens at runtime in block
//# sourceMappingURL=postprocess.js.map