import util from '../utils/builder';

  function writeAttributeValues(attrValues, entities, out) {
    let vals = entities.vals;
    let allVals = [];
    attrValues.forEach(function(ithVal) {
      let v = vals[ithVal];
      if (v.type === 'plaintext') {
        allVals.push(v.content);
      }
    });
    out.push(allVals.join(','));
  }
  function writeAttributes(attrIndexes, entities, parentEl, out) {
    let attrs = entities.attrs;
    attrIndexes.forEach(function(ithAttr) {
      let a = attrs[ithAttr];
      out.push(`el${parentEl}.setAttribute('${a.key}', `);
      let aVals = a.vals;
      if (aVals && aVals.length) {
        out.push('[');
        writeAttributeValues(a.vals, entities, out);
        out.push(']');
      } else {
        out.push('${a.key}');
      }
      out.push(');');
    });
  }
// helper method for recursively writing elements
 function writeElements(indexes, entities, parent, out) {
  let name = (typeof parent === 'number') ? 'el' + parent : 'frag';
  let elements = entities.elements;

  indexes.forEach(function(i) {
    let el = elements[i];
    if (el.type === 'placeholder') {
      out.push(`var el${i} = res.p${i} = td.createTextNode('${el.type}');\n`);
    } else if (el.type === 'plaintext') {
      out.push(`var el${i} = td.createTextNode('${el.type}');\n`);
    } else {
      out.push(`var el${i} = td.createElement('${el.type}-${el.key}');\n`);
    }
    out.push(`${name}.appendChild(el${i});\n`);
    // write attributes
    let elAttrs = el.attrs;
    if (elAttrs && elAttrs.length) {
      writeAttributes(elAttrs, entities, i, out);
    }
    // recurse over the children
    if (el.elements) {
      writeElements(el.elements, entities, i, out);
    }
  });
}

function writeFragments(results) {
  let fragments = results.state.entities.fragments,
      entities = results.state.entities;

  // initialize the results fragment
  results.code.fragments = [];

  fragments.forEach(function(f, idx) {
    let codeFragments = [];
    // add method header
    codeFragments.push(`f${idx}: function() {
      var res = {};
      var frag = td.${util.getTdMethodName('createDocumentFragment')}();
      res.frag = frag;\n`);
    // add all elements of this fragment
    writeElements(f.elements, entities, null, codeFragments);
    // add method footer
    codeFragments.push('return res;\n}');
    results.code.fragments.push(codeFragments.join(''));
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
    if (body.type === 'helper') {
      // helper - key, placeholder, context, params, bodies
      out.push(`td.${body.type}(${key}, root.p${body.element}, c, `);
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
      out.push(`td.${body.type}(${key}, root.p${body.element}, {main: this.r${i}.bind(this)`);
      writeBodyAlternates(body.bodies, entities, out);
      out.push(', c});\n');
    }
  });
}
function writeBodyParamValues(indexes, entities, out) {
  let vals = entities.vals,
      refs = entities.refs;
  if (indexes && indexes.length) {
    indexes.forEach(function(i) {
      let v = vals[i];
      if (v.type === 'plaintext') {
        out.push(v.content);
      } else if (v.type === 'placeholder') {
        // TODO: string interpolation is not supported yet e.g. param="hello {foo}"
        //TODO: some generic resolvePlaceholder method
        if (v.to === 'refs') {
          // a generic writeRef Method instead?
          let ref = refs[v.id];
          out.push(`td.get(c, ${JSON.stringify(ref.key)})`);
        } else {
          throw 'NOT_IMPLEMENTED';
        }
      }

    });
  }
}
function writeBodyParams(indexes, entities, out) {
  let params = entities.params;
  let writtenParams = {};
  if (indexes && indexes.length) {
    indexes.forEach(function(i) {
      let p = params[i],
          vals = [];
      if (p.vals) {
        writeBodyParamValues(p.vals, entities, vals);
      } else {
        vals.push("''");
      }
      writtenParams[p.key] = vals.join(' ');
    });
  }
  out.push(JSON.stringify(writtenParams));
}
function writeBodyRefs(references, entities, out) {
  references.forEach(function(ref) {
    let key = typeof ref === 'string' ? key : `td.get(c, ${JSON.stringify(ref.key)})`;
    // write references based on type
    // switch (ref.from.type) {
      // case 'elements':
        // break;
      // default:
    // }
    out.push(`td.${util.getTdMethodName('replaceNode')}(root.p${ref.element}, td.${util.getTdMethodName('createTextNode')}(${key}));`);
  });
}

function writeBodys(results) {
  let entities = results.state.entities;
  let bodys = entities.bodys;
  // initialize the results renderer
  results.code.renderers = [];
  bodys.forEach(function(b, idx) {
    let codeRenderer = [];
    // add method header
    codeRenderer.push(`r${idx}: function() {
      var root = this.f${b.fragment}();\n`);
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
    writeFragments(results);
    writeBodys(results);
    flush(results);
  }
};

export default postprocess;
