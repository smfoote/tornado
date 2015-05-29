import util from '../utils/builder';

let flush = function(results) {
  results.code = `(function(){
var frags = {},
  template = {
    ${results.fragments.join(',\n    ')},
    ${results.renderers.join(',\n    ')}
  };
  template.render = template.r0;
  td.${util.getTdMethodName('register')}("${name}", template);
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
  let context = options.context;
  let results = options.results;
  if (context) {
    createMethodFooters(null, context);
  }
  if (context && results) {
    flush(results, context);
  }
};

export default postprocess;
