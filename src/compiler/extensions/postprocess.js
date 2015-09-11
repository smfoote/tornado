import util from '../utils/builder';

function toStringLiteral(val) {
  return `'${val.replace('\'', '\\\'')}'`;
}

function writeVals(indexes, entities, out) {
  let vals = entities.vals,
      refs = entities.refs,
      bodys = entities.bodys;
  if (indexes && indexes.length) {
    indexes.forEach(function(i) {
      let v = vals[i];
      if (v.type === 'plaintext') {
        out.push(toStringLiteral(v.content));
      } else if (v.type === 'placeholder') {
        // TODO: string interpolation is not supported yet e.g. paramOrAttr="hello {foo}"
        switch (v.to) {
          case 'refs':
            // a generic writeRef Method instead?
            let ref = refs[v.id];
            out.push(`td.get(c, ${JSON.stringify(ref.key)})`);
            break;
          case 'bodys':
            let o = [];
            let body = bodys[v.id];
            let key = typeof body.key === 'string' ? body.key : `td.get(c, ${JSON.stringify(body.key)})`;
            /* make a generic writeBody method that can handle from fragments and renderer? */
            if (body.type === 'helper') {
              // helper - key, placeholder, context, params, bodies
              o.push(`td.${body.type}(${key}, null, c, `);
              writeBodyParams(body.params, entities, o);
              o.push(`, {main: this.r${i}.bind(this)`);
              writeBodyAlternates(body.bodies, entities, o);
              o.push('})');
            } else if (body.type === 'block') {
              // block - name, idx, context, template
            } else {
              // exists - key, placeholder, bodies, context
              // notexists - key, placeholder, bodies, context
              // section - key, placeholder, bodies, context
              o.push(`td.${body.type}(${key}, null, {main: this.r${i}.bind(this)`);
              writeBodyAlternates(body.bodies, entities, out);
              o.push('}, c)');
            }
            out.push(o.join(''));
            break;
          default:
            throw 'not_implemented';
        }
      }

    });
  }
}
function writeAttributeValues(attrValues, entities, out) {
  let allVals = [];
  writeVals(attrValues, entities, allVals);
  out.push(allVals.join(','));
}
function writeAttributes(attrIndexes, entities, out, parentEl) {
  let attrs = entities.attrs;
  attrIndexes.forEach(function(ithAttr) {
    let a = attrs[ithAttr];
    out.push(`td.${util.getTdMethodName('setAttribute')}(el${parentEl}, '${a.key}', `);
    let aVals = a.vals;
    if (aVals && aVals.length) {
      out.push('[');
      writeAttributeValues(a.vals, entities, out);
      out.push(']');
    } else {
      // for boolean properties like checked="checked"
      out.push('${a.key}');
    }
    out.push(');\n');
  });
}
// recursively writing elements
function writeElements(indexes, entities, out, parent) {
  let name = (typeof parent === 'number') ? 'el' + parent : 'frag';
  let elements = entities.elements;

  indexes.forEach(function(i) {
    let el = elements[i];
    if (el.type === 'placeholder') {
      out.push(`var el${i} = res.p${i} = td.createTextNode('');\n`);
    } else if (el.type === 'plaintext') {
      out.push(`var el${i} = td.createTextNode(${toStringLiteral(el.content)});\n`);
    } else {
      out.push(`var el${i} = td.createElement(${toStringLiteral(el.key)});\n`);
    }
    out.push(`${name}.appendChild(el${i});\n`);
    // write attributes
    let elAttrs = el.attrs;
    if (elAttrs && elAttrs.length) {
      writeAttributes(elAttrs, entities, out, i);
    }
    // recurse over the children
    if (el.elements) {
      writeElements(el.elements, entities, out, i);
    }
  });
}

function writeFragmentsToResults(results) {
  let fragments = results.state.entities.fragments,
      entities = results.state.entities;

  // initialize the results fragment
  results.code.fragments = [];

  fragments.forEach(function(f, idx) {
    let out = [];
    // add method header
    out.push(`f${idx}: function(c) {
      var res = {};
      var frag = td.${util.getTdMethodName('createDocumentFragment')}();
      res.frag = frag;\n`);
    // add all elements of this fragment
    writeElements(f.elements, entities, out);
    // add method footer
    out.push('return res;\n}');
    results.code.fragments.push(out.join(''));
  });
}

function writeBodyAlternates(indexes, entities, out) {
  let bodys = entities.bodys;
  if (indexes && indexes.length) {
    indexes.forEach(function(i) {
      out.push(`, ${bodys[i].name}: this.r${i}.bind(this)`);
    });
  }
}
function writeBodyMains(indexes, entities, out) {
  indexes.forEach(function(i) {
    let bodys = entities.bodys;
    let body = bodys[i];
    let key = typeof body.key === 'string' ? body.key : `td.get(c, ${JSON.stringify(body.key)})`;
    let placeholderEl = typeof body.from.id === 'number' ? `root.p${body.from.id}` : 'null';
    if (body.type === 'helper') {
      // helper - key, placeholder, context, params, bodies
      out.push(`td.${body.type}(${key}, ${placeholderEl}, c, `);
      writeBodyParams(body.params, entities, out);
      out.push(`, {main: this.r${i}.bind(this)`);
      writeBodyAlternates(body.bodies, entities, out);
      out.push('});\n');
    } else if (body.type === 'block') {
      // block - name, idx, context, template
    } else {
      // exists - key, placeholder, bodies, context
      // notexists - key, placeholder, bodies, context
      // section - key, placeholder, bodies, context
      out.push(`td.${body.type}(${key}, ${placeholderEl}, {main: this.r${i}.bind(this)`);
      writeBodyAlternates(body.bodies, entities, out);
      out.push('}, c);\n');
    }
  });
}
function writeBodyParams(indexes, entities, out) {
  let params = entities.params;
  let writtenParams = {};
  if (indexes && indexes.length) {
    indexes.forEach(function(i) {
      let p = params[i],
          vals = [];
      if (p.vals) {
        writeVals(p.vals, entities, vals);
      } else {
        vals.push("''");
      }
      writtenParams[p.key] = vals.join(' ');
    });
  }
  out.push(JSON.stringify(writtenParams));
}
function writeBodyRefs(references, entities, out) {
  let refs = entities.refs;
  references.forEach(function(rId) {
    let ref = refs[rId];
    let key = typeof ref === 'string' ? key : `td.get(c, ${JSON.stringify(ref.key)})`;
    // write references based on type
    switch (ref.from.type) {
      case 'bodys':
      case 'elements':
        out.push(`td.${util.getTdMethodName('replaceNode')}(root.p${ref.from.id}, td.${util.getTdMethodName('createTextNode')}(${key}));\n`);
        break;
    }
  });
}

function writeBodysToResults(results) {
  let entities = results.state.entities;
  let bodys = entities.bodys;
  // initialize the results renderer
  results.code.renderers = [];
  bodys.forEach(function(b, idx) {
    let codeRenderer = [];
    // add method header
    codeRenderer.push(`r${idx}: function(c) {
      var root = this.f${b.fragment}(c);\n`);
    // add all references
    if (b.refs) {
      writeBodyRefs(b.refs, entities, codeRenderer);
    }
    // add all mains
    writeBodyMains(b.mains, entities, codeRenderer);
    // add method footer
    codeRenderer.push('return root.frag;\n}');
    results.code.renderers.push(codeRenderer.join(''));

  });
}

let flush = function(results) {
  let templateVars = [];
  if (results.extensions && results.extensions.templateVars) {
    templateVars = results.extensions.templateVars;
  }
  results.code = `(function(){
var frags = {},
  ${templateVars.join('\n  ')}
  template = {
    ${results.code.fragments.join(',\n    ')},
    ${results.code.renderers.join(',\n    ')}
  };
  template.render = template.r0;
  td.${util.getTdMethodName('register')}("${results.name}", template);
  return template;
})();`;
};

let postprocess = function(results) {
  if (results) {
    writeFragmentsToResults(results);
    writeBodysToResults(results);
    flush(results);
  }
};

export default postprocess;
