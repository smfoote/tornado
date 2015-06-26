import util from '../utils/builder';
import generator from '../codeGenerator';

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


let postprocess = function(ast, options) {
  let results = options.results;
  let symbolsMap = options.results.instructions.symbolsMap;
  let codeGenerator = generator.build(symbolsMap);
  codeGenerator(options.results.instructions, options.results.code);

  if (results) {
    flush(results);
  }
};

export default postprocess;
