import util from '../utils/builder';

let flush = function(results) {
  results.code = `(function(){
var frags = {},
  template = {
    ${results.code.fragments.join(',\n    ')},
    ${results.code.renderers.join(',\n    ')}
  };
  template.render = template.r0;
  td.${util.getTdMethodName('register')}("${results.name}", template);
  return template;
})();`;
};
export let createMethodFooters = function(name, context) {
  let f = `      frags.frag${name} = frag;
    return frag;
  }`;
  let r = `      return root;
  }`;
  context.append(name, f, r);
};

let postprocess = function(ast, options) {
  let results = options.results;
  if (results) {
    flush(results);
  }
};

export default postprocess;
