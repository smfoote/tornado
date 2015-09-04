'use strict';
import Context from './compiler/context';
import escapableRaw from './compiler/extensions/escapableRaw';
import builtinHelpers from './compiler/extensions/builtinHelpers';
import htmlEntities from './compiler/extensions/htmlEntities';
import adjustAttrs from './compiler/extensions/adjustAttrs';
import buildInstructions from './compiler/extensions/buildInstructions';
import generateJS from './compiler/extensions/generateJS';
import postprocess from './compiler/extensions/postprocess';


const stages = ['checks', 'transforms', 'instructions'];
let compiler = {
  checks: [],
  transforms: [],
  instructions: [],
  codeGenerator: generateJS,
  postprocessor: postprocess,
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
    // TODO Don't mutate the results object. Have each pass return its result (and consume the
    // previous pass's result) instead.
    this.codeGenerator(results);
    this.postprocessor(results);
    return results.code;
  },
  useExtension(helper) {
    stages.forEach(passType => {
      if (helper.hasOwnProperty(passType) && Array.isArray(helper[passType])) {
        this[passType] = this[passType].concat(helper[passType]);
      }
    });
  },
  useExtensions(helpers) {
    helpers.forEach(helper => this.useExtension(helper));
  },
  useCodeGenerator(generator) {
    this.codeGenerator = generator;
  }
};

compiler.useExtensions([builtinHelpers, escapableRaw, htmlEntities, adjustAttrs, buildInstructions]);

export default compiler;
