/* eslint camelcase: 0 */
'use strict';

import util from '../utils/builder';
import {STATES} from '../utils/builder';

let htmlSymbols = {
  open_HTML_ELEMENT(instruction, code) {
    let {state, tdBody, elCount, key, namespace} = instruction;
    namespace = namespace ? `, '${namespace}'` : '';
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      var el${elCount} = td.${util.getTdMethodName('createElement')}('${key}'${namespace});\n`;
      code.push(tdBody, {fragment});
    }
  },
  close_HTML_ELEMENT(instruction, code) {
    let {state, parentNodeName, elCount, tdBody} = instruction;
    if (state === STATES.ESCAPABLE_RAW) {
      let fragment = `      el${elCount - 1}.defaultValue += td.${util.getTdMethodName('nodeToString')}(el${elCount});\n`;
      code.push(tdBody, {fragment});
    } else if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${parentNodeName}.appendChild(el${elCount});\n`;
      code.push(tdBody, {fragment});
    }
  },
  open_HTML_ATTRIBUTE(instruction, code) {
    let {tdBody, node, hasTornadoRef, parentNodeName} = instruction;
    let attrInfo = node[1];
    let placeholderName = util.getPlaceholderName(instruction);
    let fragment = `      res.${placeholderName} = ${parentNodeName};\n`;
    let renderer = `      td.${util.getTdMethodName('setAttribute')}`;
    renderer += `(root.${placeholderName}, '${attrInfo.attrName}', `;
    if (hasTornadoRef) {
      renderer += '[';
    } else {
      renderer += '';
    }
    code.push(tdBody, {fragment, renderer});
  },
  close_HTML_ATTRIBUTE(instruction, code) {
    let {tdBody, hasTornadoRef} = instruction;
    let renderer;
    if (hasTornadoRef) {
      renderer = ']);\n';
    } else {
      renderer = ');\n';
    }
    // Remove the trailing comma from the last item in the array
    code.slice('renderers', tdBody, 0, -1);
    code.push(tdBody, {renderer});
  },
  insert_HTML_COMMENT(instruction, code) {
    let {tdBody, parentNodeName, contents} = instruction;
    let fragment = `      ${parentNodeName}.appendChild(td.${util.getTdMethodName('createHTMLComment')}('${contents}'));\n`;
    code.push(tdBody, {fragment});
  },
  insert_PLAIN_TEXT(instruction, code) {
    let {tdBody, parentNodeName, contents} = instruction;
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${parentNodeName}.appendChild(td.${util.getTdMethodName('createTextNode')}('${contents}'));\n`;
      code.push(tdBody, {fragment});
    } else {
      let renderer = `'${contents}',`;
      code.push(tdBody, {renderer});
    }
  }
};


let addHtmlInstructions = function (ast, options) {
  for (let s in htmlSymbols) {
    options.results.instructions.symbolsMap[s] = htmlSymbols[s];
  }
};
export default addHtmlInstructions;
