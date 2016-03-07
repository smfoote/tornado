'use strict';
import Context from './compiler/context';
import escapableRaw from './compiler/extensions/escapableRaw';
import builtinHelpers from './compiler/extensions/builtinHelpers';
import htmlEntities from './compiler/extensions/htmlEntities';
import adjustAttrs from './compiler/extensions/adjustAttrs';
import buildInstructions from './compiler/extensions/buildInstructions';
import generateJS from './compiler/extensions/generateJS';
import postprocess from './compiler/extensions/postprocess';


const stages = ['checks', 'transforms'];
let compiler = {
  checks: [],
  transforms: [],
  codeGenerator: generateJS,
  postprocessor: postprocess,
  buildInstructions,
  compile(ast, name/*, options*/) {
    let results = {
      name,
      instructions: []
    };
    stages.forEach(stage => {
      this[stage].forEach(pass =>{
        let context = new Context(results);
        pass(ast, {results, context});
      });
    });

    // TODO Clean up the instructions pass
    let context = new Context(results);
    this.buildInstructions.pass(ast, {results, context});
    this.codeGenerator(results);
    this.postprocessor(results);
    return results.code;
  },
  useExtension(extension) {
    stages.forEach(passType => {
      if (extension.hasOwnProperty(passType) && Array.isArray(extension[passType])) {
        this[passType] = this[passType].concat(extension[passType]);
      }
    });
    if (extension.hasOwnProperty('instructions')) {
      let instructions = extension.instructions;
      this.buildInstructions.addInstructions(instructions);
    }
  },
  useExtensions(extensions) {
    extensions.forEach(extension => this.useExtension(extension));
  },
  useCodeGenerator(generator) {
    this.codeGenerator = generator;
  },
  ready() {
    this.buildInstructions.pass = this.buildInstructions.generateInstructions();
  }
};

compiler.useExtensions([builtinHelpers, escapableRaw, htmlEntities, adjustAttrs, buildInstructions]);

export default compiler;
