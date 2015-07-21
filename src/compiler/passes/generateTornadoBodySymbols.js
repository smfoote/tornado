/* eslint camelcase: 0 */
'use strict';

import util from '../utils/builder';
import {STATES} from '../utils/builder';

let noop = function() {};

function createMethodHeaders(tdBody, code, methodName) {
  let suffix = methodName ? methodName : tdBody;
  let fragment = `f${suffix}: function() {
    var res = {};
    var frag = td.${util.getTdMethodName('createDocumentFragment')}();
    res.frag = frag;\n`;
  let renderer = `r${suffix}: function(c) {
    var root = this.f${suffix}();\n`;
  code.push(tdBody, {fragment, renderer});
}
function createMethodFooters(tdBody, code) {
  let fragment = `      return res;
  }`;
  let renderer = `      return root.frag;
  }`;
  code.push(tdBody, {fragment, renderer});
}

function createParamsHash(params) {
  let paramsHash = params.reduce((acc, param) => {
    let paramVal = param[1].val;
    let paramKey = param[1].key;
    if (Array.isArray(paramVal)) {
      paramVal = `td.${util.getTdMethodName('get')}(c, ${JSON.stringify(paramVal[1].key)})`;
    } else {
      paramVal = typeof paramVal === 'number' ? paramVal : `'${paramVal}'`;
    }
    acc.push(`${paramKey}: ${paramVal}`);
    return acc;
  }, []);
  return `{${paramsHash.join(',')}}`;
}
function createBodiesHash(tdBody, bodies, mainBody) {
  let bodiesHash = bodies.reduce((acc, body, idx) => {
    let bodyName = body[1].name;
    acc.push(`${bodyName}: this.r${tdBody + idx + 1}.bind(this)`);
    return acc;
  }, []);
  if (mainBody && mainBody.length) {
    bodiesHash.push(`main: this.r${tdBody}.bind(this)`);
  }
  return `{${bodiesHash.join(',')}}`;
}

let tornadoBodySymbols = {
  open_TORNADO_BODY(instruction, code) {
    let {tdBody, bodyType, tdMethodName, needsOwnMethod} = instruction;
    if (needsOwnMethod) {
      createMethodHeaders(tdBody, code, tdMethodName);
    }
    let buildTdBodyCode = (this[`tdBody_${bodyType}`] || noop).bind(this);
    buildTdBodyCode(instruction, code);
  },
  close_TORNADO_BODY(instruction, code) {
    let {tdBody, needsOwnMethod, tdMethodName} = instruction;
    if (needsOwnMethod) {
      createMethodFooters(tdBody, code, tdMethodName);
    }
  },
  tdBody_exists(instruction, code) {
    let {parentTdBody, tdBody, state, key, node, bodyType} = instruction;
    let bodies = node[1].bodies;
    let bodiesHash = createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${util.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName(bodyType)}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), root.${util.getPlaceholderName(instruction)}, ${bodiesHash}, c);\n`;
      code.push((parentTdBody), {renderer, fragment});
    } else {
      let renderer = `td.${util.getTdMethodName(bodyType)}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), null, ${bodiesHash}, c),`;
      code.push((parentTdBody), {renderer});
    }
  },

  tdBody_notExists(instruction, code) {
    this.tdBody_exists(instruction, code);
  },

  tdBody_section(instruction, code) {
    let {parentTdBody, tdBody, state, key, node} = instruction;
    let bodies = node[1].bodies;
    let bodiesHash = createBodiesHash(tdBody, bodies, node[1].body);
    let isInHtmlAttribute = (state === STATES.HTML_ATTRIBUTE);
    let placeholderNode = isInHtmlAttribute ? 'null' : `root.${util.getPlaceholderName(instruction)}`;

    let output = `td.${util.getTdMethodName('section')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), ${placeholderNode}, ${bodiesHash}, c)`;

    if (isInHtmlAttribute) {
      let renderer = output + ',';
      code.push(parentTdBody, {renderer});
    } else {
      let fragment = `      ${util.createPlaceholder(instruction)};\n`;
      let renderer = `      ${output};\n`;
      code.push(parentTdBody, {fragment, renderer});
    }
  },

  tdBody_block(instruction, code) {
    let {parentTdBody, state, key, blockIndex} = instruction;
    let blockName = key.join('.');
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${util.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName('replaceNode')}(root.${util.getPlaceholderName(instruction)}, td.${util.getTdMethodName('block')}('${blockName}', ${blockIndex}, c, this));\n`;
      code.push(parentTdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('nodeToString')}(td.${util.getTdMethodName('block')}('${blockName}', ${blockIndex}, c, this)),`;
      code.push(parentTdBody, {renderer});
    }
  },

  tdBody_helper(instruction, code) {
    let {parentTdBody, tdBody, state, key, node} = instruction;
    let params = node[1].params;
    let bodies = node[1].bodies;
    let paramsHash = createParamsHash(params);
    let bodiesHash = createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${util.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName('helper')}('${key.join('.')}', root.${util.getPlaceholderName(instruction)}, c, ${paramsHash}, ${bodiesHash});\n`;
      code.push(parentTdBody, {fragment, renderer});
    }
  }
};

let addTornadoBodyInstructions = function (ast, options) {
  for (let s in tornadoBodySymbols) {
    options.results.instructions.symbolsMap[s] = tornadoBodySymbols[s];
  }
};
export default addTornadoBodyInstructions;
