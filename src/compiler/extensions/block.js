/* eslint camelcase: 0 */

'use strict';
import util,{STATES} from '../utils/builder';

let blockExtension = {
  codeGen: {
    tdBody_block(instruction, code) {
      let {parentTdBody, state, key, blockIndex} = instruction;
      let blockName = key.join('.');

      if (state !== STATES.HTML_ATTRIBUTE) {
        let fragment = `      ${this.createPlaceholder(instruction)};\n`;
        let renderer = `      td.${util.getTdMethodName('replaceNode')}(root.${this.getPlaceholderName(instruction)}, td.${util.getTdMethodName('block')}('${blockName}', ${blockIndex}, c, this));\n`;
        code.push(parentTdBody, {fragment, renderer});
      } else {
        let renderer = `td.${util.getTdMethodName('nodeToString')}(td.${util.getTdMethodName('block')}('${blockName}', ${blockIndex}, c, this)),`;
        code.push(parentTdBody, {renderer});
      }
    }
  }
};

export default blockExtension;
