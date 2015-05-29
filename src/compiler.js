'use strict';
import Context from './compiler/context';
import preprocess from './compiler/passes/preprocess';
import generateJS from './compiler/passes/generate';
import postprocess from './compiler/passes/postprocess';


const defaultPasses = [
  [], // checks
  [], // transforms
  [preprocess, generateJS, postprocess] // generates
];
let compiler = {
  compile(ast, name, options) {
    let passes = options && options.passes || defaultPasses;
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
    return results.code;
  }
};

export default compiler;
