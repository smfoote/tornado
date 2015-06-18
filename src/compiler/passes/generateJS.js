/* eslint camelcase: 0 */
'use strict';
import generator from '../codeGenerator';

import util from '../utils/builder';
import {STATES} from '../utils/builder';

let noop = function() {};

let codeGenerator = generator.build({
  insert_TORNADO_PARTIAL(instruction, code) {
    let {indexPath, tdBody, key} = instruction;
    let context = 'c';
    let indexHash = indexPath.join('');
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      var p${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)});
      td.${util.getTdMethodName('replaceNode')}(p${indexHash}, td.${util.getTdMethodName('getPartial')}('${key}', ${context}, this));\n`;
      code.push(tdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('getPartial')}('${key}', ${context}, this).then(function(node){return td.${util.getTdMethodName('nodeToString')}(node)}),`;
      code.push(tdBody, {renderer});
    }
  },
  open_TORNADO_BODY(instruction, code) {
    let {tdBody, bodyType, tdMethodName, needsOwnMethod} = instruction;
    if (needsOwnMethod) {
      this.createMethodHeaders(tdBody, code, tdMethodName);
    }
    let buildTdBodyCode = (this[`tdBody_${bodyType}`] || noop).bind(this);
    buildTdBodyCode(instruction, code);
  },
  close_TORNADO_BODY(instruction, code) {
    let {tdBody, needsOwnMethod, tdMethodName} = instruction;
    if (needsOwnMethod) {
      this.createMethodFooters(tdBody, code, tdMethodName);
    }
  },
  insert_TORNADO_REFERENCE(instruction, code) {
    let {tdBody, key, indexPath, state} = instruction;
    let indexHash = indexPath.join('');
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      var p${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)});
        td.${util.getTdMethodName('replaceNode')}(p${indexHash}, td.${util.getTdMethodName('createTextNode')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)})));\n`;
      code.push(tdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}),`;
      code.push(tdBody, {renderer});
    }
  },

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
    let {tdBody, indexPath, node, hasTornadoRef} = instruction;
    let attrInfo = node[1];
    let renderer = `      td.${util.getTdMethodName('setAttribute')}`;
    renderer += `(td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)}), '${attrInfo.attrName}', `;
    if (hasTornadoRef) {
      renderer += '[';
    } else {
      renderer += '';
    }
    code.push(tdBody, {renderer});
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
  insert_PLAIN_TEXT(instruction, code) {
    let {tdBody, parentNodeName, node} = instruction;
    let contents = node[1].replace(/'/g, "\\'");
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${parentNodeName}.appendChild(td.${util.getTdMethodName('createTextNode')}('${contents}'));\n`;
      code.push(tdBody, {fragment});
    } else {
      let renderer = `'${contents}',`;
      code.push(tdBody, {renderer});
    }
  },

  createMethodHeaders(tdBody, code, methodName) {
    let suffix = methodName ? methodName : tdBody;
    let fragment = `f${suffix}: function() {
      var frag = td.${util.getTdMethodName('createDocumentFragment')}();\n`;
    let renderer = `r${suffix}: function(c) {
      var root = frags.frag${suffix} || this.f${suffix}();
      root = root.cloneNode(true);\n`;
    code.push(tdBody, {fragment, renderer});
  },

  createMethodFooters(tdBody, code, methodName) {
    let suffix = methodName ? methodName : tdBody;
    let fragment = `      frags.frag${suffix} = frag;
      return frag;
    }`;
    let renderer = `      return root;
    }`;
    code.push(tdBody, {fragment, renderer});
  },

  createPlaceholder(instruction) {
    return `${instruction.parentNodeName}.appendChild(td.${util.getTdMethodName('createTextNode')}(''))`;
  },

  tdBody_exists(instruction, code) {
    let {parentTdBody, tdBody, indexPath, state, key, node, bodyType} = instruction;
    let indexHash = indexPath.join('');
    let bodies = node[1].bodies;
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      var p${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)});
      td.${util.getTdMethodName(bodyType)}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), p${indexHash}, ${bodiesHash}, c);\n`;
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
    let {parentTdBody, tdBody, indexPath, state, key, node} = instruction;
    let indexHash = indexPath.join('');
    let bodies = node[1].bodies;
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    let isInHtmlAttribute = (state === STATES.HTML_ATTRIBUTE);
    let placeholderNode = isInHtmlAttribute ? 'null' : `p${indexHash}`;

    let output = `td.${util.getTdMethodName('section')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), ${placeholderNode}, ${bodiesHash}, c)`;

    if (isInHtmlAttribute) {
      let renderer = output + ',';
      code.push(parentTdBody, {renderer});
    } else {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      var p${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)});
      ${output};\n`;
      code.push(parentTdBody, {fragment, renderer});
    }
  },

  tdBody_block(instruction, code) {
    let {parentTdBody, indexPath, state, key, blockIndex} = instruction;
    let indexHash = indexPath.join('');
    let blockName = key.join('.');
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      var p${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)});
      td.${util.getTdMethodName('replaceNode')}(p${indexHash}, td.${util.getTdMethodName('block')}('${blockName}', ${blockIndex}, c, this));\n`;
      code.push(parentTdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('nodeToString')}(td.${util.getTdMethodName('block')}('${blockName}', ${blockIndex}, c, this)),`;
      code.push(parentTdBody, {renderer});
    }
  },

  tdBody_helper(instruction, code) {
    let {parentTdBody, tdBody, indexPath, state, key, node} = instruction;
    let indexHash = indexPath.join('');
    let params = node[1].params;
    let bodies = node[1].bodies;
    let paramsHash = this.createParamsHash(params);
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      var p${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)});
      td.${util.getTdMethodName('helper')}('${key.join('.')}', p${indexHash}, c, ${paramsHash}, ${bodiesHash});\n`;
      code.push(parentTdBody, {fragment, renderer});
    }
  },

  createBodiesHash(tdBody, bodies, mainBody) {
    let bodiesHash = bodies.reduce((acc, body, idx) => {
      let bodyName = body[1].name;
      acc.push(`${bodyName}: this.r${tdBody + idx + 1}.bind(this)`);
      return acc;
    }, []);
    if (mainBody && mainBody.length) {
      bodiesHash.push(`main: this.r${tdBody}.bind(this)`);
    }
    return `{${bodiesHash.join(',')}}`;
  },

  createParamsHash(params) {
    let paramsHash = params.reduce((acc, param) => {
      let paramVal = param[1].val;
      let paramKey = param[1].key;
      if (Array.isArray(paramVal)) {
        paramVal = `td.${util.getTdMethodName('get')}(c, ${JSON.stringify(paramVal[1].key)})`;
      } else {
        paramVal = `'${paramVal}'`;
      }
      acc.push(`${paramKey}: ${paramVal}`);
      return acc;
    }, []);
    return `{${paramsHash.join(',')}}`;
  }
});

let generateJavascript = function (ast, options) {
  options.results.code = {
    fragments: [],
    renderers: [],
    push(idx, strings) {
      let {fragment, renderer} = strings;
      if (idx >= this.fragments.length) {
        if (fragment) this.fragments.push(fragment);
        if (renderer) this.renderers.push(renderer);
      } else {
        if (fragment) this.fragments[idx] += fragment;
        if (renderer) this.renderers[idx] += renderer;
      }
    },
    slice(type, idx, start, end) {
      if (this[type] && this[type][idx]) {
        this[type][idx] = this[type][idx].slice(start, end);
      }
    }
  };
  return codeGenerator(options.results.instructions, options.results.code);
};

export default generateJavascript;
