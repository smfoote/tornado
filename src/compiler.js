'use strict';
import Context from './compiler/context';
import escapableRaw from './compiler/passes/escapableRaw';
import buildInstructions from './compiler/passes/buildInstructions';
import generateJS from './compiler/passes/generateJS';
import postprocess from './compiler/passes/postprocess';
import visualize from './compiler/passes/visualize';


const defaultPasses = [
  [visualize], // checks
  [escapableRaw], // transforms
  [buildInstructions], // generates
  [generateJS, postprocess] // codegen
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
      name,
      instructions: []
    };
    passes.forEach(stage => {
      stage.forEach(pass =>{
        let context = new Context(results);
        pass(ast, {results, context});
      });
    });
    return results.code;
  }
};

export default compiler;
