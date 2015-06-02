'use strict';
import Context from './compiler/context';
import preprocess from './compiler/passes/preprocess';
// import generateJS from './compiler/passes/generate';
import postprocess from './compiler/passes/postprocess';
import visualize from './compiler/passes/visualize';


const defaultPasses = [
  [visualize], // checks
  [], // transforms
  [preprocess, postprocess] // generates
];
let compiler = {
  compile(ast, name, options) {
    let passes;

    if (options && options.passes) {
      passes = options.passes;
      // merge defaults into passes
      for (let key in defaultPasses) {
        if (defaultPasses.hasOwnProperty(key) && !passes.hasOwnProperty(key)) {
          passes[key] = defaultPasses[key];
        }
      }
    } else {
      passes = defaultPasses;
    }
    let results = {
      fragments: [],
      renderers: []
    };
    let context = new Context(results);
    passes.forEach(stage => {
      stage.forEach(pass =>{
        pass(ast, {results, context});
      });
    });
    console.log('code:   ' + results.code);
    return results.code;
  }
};

export default compiler;
