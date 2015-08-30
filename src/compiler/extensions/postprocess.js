import util from '../utils/builder';

// helper method for recursively writing elements
 function writeElements(indexes, elements, parent, out) {
  let name = (typeof parent === 'number') ? 'el' + parent : 'frag';
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
    // recurse over the children
    if (el.elements) {
      writeElements(el.elements, elements, i, out);
    }
  });
}

function writeFragments(results) {
  let fragments = results.state.entities.fragments,
      elements = results.state.entities.elements;

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
    writeElements(f.elements, elements, null, codeFragments);
    // add method footer
    codeFragments.push('return res;\n}');
    results.code.fragments.push(codeFragments.join(''));
  });
}

function writeBodyAlternates(indexes, bodys, out) {
  if (indexes && indexes.length) {
    indexes.forEach(function(i) {
      out.push(`, ${bodys[i].name}: this.r${i}.bind(this)`);
    });
  }
}
function writeBodyMains(indexes, bodys, params, out) {
  indexes.forEach(function(i) {
    let body = bodys[i];
    let key = typeof body.key === 'string' ? body.key : `td.get(c, ${JSON.stringify(body.key)})`;
    if (body.type === 'helper') {
      // helper - key, placeholder, context, params, bodies
      out.push(`td.${body.type}(${key}, root.p${body.element}, c, `);
      writeBodyParams(body.params, params, out);
      out.push(`, {main: this.r${i}.bind(this)`);
      writeBodyAlternates(body.bodies, bodys, out);
      out.push('});\n');
    } else if (body.type === 'block') {
      // block - name, idx, context, template
    } else {
      // exists - key, placeholder, bodies, context
      // notexists - key, placeholder, bodies, context
      // section - key, placeholder, bodies, context
      out.push(`td.${body.type}(${key}, root.p${body.element}, {main: this.r${i}.bind(this)`);
      writeBodyAlternates(body.bodies, bodys, out);
      out.push(', c});\n');
    }
  });
}
function writeBodyParams(indexes, params, out) {
  let keyValues = [];
  out.push('{');
  if (indexes && indexes.length) {
    indexes.forEach(function(i) {
      let p = params[i],
          value;
      // TODO: string interpolation is not supported yet e.g. param="hello {foo}"
      if (typeof p.val === 'number') {
        value = p.val;
      } else if (typeof p.val === 'string') {
        value = JSON.stringify(p.val);
      } else {
        value = `td.get(c, ${JSON.stringify(p.val)})`;
      }
      keyValues.push(`${p.key}: ${value}`);
    });
    out.push(keyValues.join(', '));
  }
  out.push('}');
}
function writeBodyRefs(references, out) {
  references.forEach(function(ref) {
    let key = typeof ref === 'string' ? key : `td.get(c, ${JSON.stringify(ref.key)})`;
    out.push(`td.${util.getTdMethodName('replaceNode')}(root.p${ref.element}, td.${util.getTdMethodName('createTextNode')}(${key}));`);
  });
}

function writeBodys(results) {
  let bodys = results.state.entities.bodys,
      params = results.state.entities.params;
  // initialize the results renderer
  results.code.renderers = [];
  bodys.forEach(function(b, idx) {
    let codeRenderer = [];
    // add method header
    codeRenderer.push(`r${idx}: function() {
      var root = this.f${b.fragment}();\n`);
    // add all references
    if (b.refs) {
      writeBodyRefs(b.refs, codeRenderer);
    }
    // add all mains
    writeBodyMains(b.mains, bodys, params, codeRenderer);
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
