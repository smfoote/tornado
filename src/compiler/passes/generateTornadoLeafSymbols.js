/* eslint camelcase: 0 */
import util from '../utils/builder';
import {STATES} from '../utils/builder';

let tornadoLeafSymbols = {
  insert_TORNADO_PARTIAL(instruction, code) {
    let {tdBody, key} = instruction;
    let context = 'c';
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${util.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName('replaceNode')}(root.${util.getPlaceholderName(instruction)}, td.${util.getTdMethodName('getPartial')}('${key}', ${context}, this));\n`;
      code.push(tdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('getPartial')}('${key}', ${context}, this).then(function(node){return td.${util.getTdMethodName('nodeToString')}(node)}),`;
      code.push(tdBody, {renderer});
    }
  },
  insert_TORNADO_REFERENCE(instruction, code) {
    let {tdBody, key, state} = instruction;
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${util.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName('replaceNode')}(root.${util.getPlaceholderName(instruction)}, td.${util.getTdMethodName('createTextNode')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)})));\n`;
      code.push(tdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}),`;
      code.push(tdBody, {renderer});
    }
  }
};
let addTornadoLeafInstructions = function (ast, options) {
  for (let s in tornadoLeafSymbols) {
    options.results.instructions.symbolsMap[s] = tornadoLeafSymbols[s];
  }
};
export default addTornadoLeafInstructions;
