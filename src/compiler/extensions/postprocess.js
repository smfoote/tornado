import util from '../utils/builder';

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
    flush(results);
  }
};

export default postprocess;
