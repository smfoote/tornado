'use strict';
import Context from './compiler/context';
import escapableRaw from './compiler/extensions/escapableRaw';
import htmlEntities from './compiler/extensions/htmlEntities';
import adjustAttrs from './compiler/extensions/adjustAttrs';
import buildInstructions from './compiler/extensions/buildInstructions';
import generateJS from './compiler/extensions/generateJS';
import postprocess from './compiler/extensions/postprocess';


const stages = ['checks', 'transforms', 'instructions', 'codegen'];
let compiler = {
  checks: [],
  transforms: [],
  instructions: [],
  codegen: [],
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
  }
};

compiler.useExtensions([escapableRaw, htmlEntities, adjustAttrs, buildInstructions, generateJS, postprocess]);

export default compiler;
