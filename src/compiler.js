'use strict';
import escapableRaw from './compiler/extensions/escapableRaw';
import builtinHelpers from './compiler/extensions/builtinHelpers';
import htmlEntities from './compiler/extensions/htmlEntities';
import adjustAttrs from './compiler/extensions/adjustAttrs';
import buildInstructions from './compiler/extensions/buildInstructions';
import generateJS from './compiler/extensions/generateJS';
import postprocess from './compiler/extensions/postprocess';
import {default as StateApi} from './compiler/states/Api';


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
      instructions: [],
      state: new StateApi(),
      code: ''
    };
    stages.forEach(stage => {
      this[stage].forEach(pass =>{
        pass(ast, {results});
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
