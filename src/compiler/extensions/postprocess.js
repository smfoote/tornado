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

let postprocess = {
  codegen: [function(ast, options) {
    let results = options.results;
    if (results) {
      flush(results);
    }
  }]
};

export default postprocess;
