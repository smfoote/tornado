import util from '../utils/builder';

// helper method for recursively writing elements
 function writeElements(indexes, elements, parent, out) {
  let name = typeof parent === 'number' ? 'el' + parent : 'frag';
  indexes.forEach(function(i) {
    let el = elements[i];
    if (el.type === 'placeholder' || el.type === 'plaintext') {
      out.push(`var el${i} = td.createTextNode('${el.type}-${el.content}');\n`);
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
    codeFragments.push('}');
    results.code.fragments.push(codeFragments.join(''));
  });
}

function writeBodys(results) {
  let bodys = results.state.entities.bodys;
  // initialize the results renderer
  results.code.renderers = [];
  bodys.forEach(function(b, idx) {
    let codeRenderer = [];
    // add method header
    codeRenderer.push(`r${idx}: function() {
      var root = this.f${b.fragment};\n`);
    // add all mains
    // add all alternate bodies
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
