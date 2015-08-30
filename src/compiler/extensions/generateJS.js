/* eslint camelcase: 0 */
'use strict';
import generator from '../codeGenerator';

import util from '../utils/builder';
import {STATES} from '../utils/builder';


let codeGenerator = {
  generatorFns: {},
  useCodeGeneratorFn(codeGenerator) {
    this.generatorFns[codeGenerator.name] = codeGenerator.method;
  },
  useCodeGeneratorFns(codeGenerators) {
    Object.keys(codeGenerators)
    .forEach(generatorName => this.useCodeGeneratorFn({name: generatorName, method: codeGenerators[generatorName]}));
  },
  build() {
    return generator.build(this.generatorFns);
  }
};

codeGenerator.useCodeGeneratorFns({
  insert_TORNADO_PARTIAL(/*instruction, code*/) {
  },
  insert_TORNADO_PARAMS(instruction) {
    let {config, state} = instruction;
    let params = config.params;
    params.forEach(function(p) {
      state.addParam(p);
    });
  },
  open_TORNADO_BODY(instruction) {
    let {config, state} = instruction;
    let {key, type, name} = config;
    if (type === 'bodies') {
      state.addBodies({name});
    } else {
      state.addBody({key, type});
    }
  },
  close_TORNADO_BODY(instruction) {
    let {config, state} = instruction;
    if (config.type === 'bodies') {
      state.leaveBodies();
    } else {
      state.leaveBody();
    }
  },
  insert_TORNADO_REFERENCE(instruction) {
    let {config, state} = instruction;
    state.addReference(config);
  },

  open_HTML_ELEMENT(instruction) {
    let {config, state} = instruction;
    state.addElement(config);
  },
  close_HTML_ELEMENT(instruction) {
    let {state} = instruction;
    state.leaveElement();
  },
  open_HTML_ATTRIBUTE(/*instruction, code*/) {
  },
  close_HTML_ATTRIBUTE(/*instruction, code*/) {
  },
  insert_HTML_COMMENT(/*instruction, code*/) {
  },
  insert_PLAIN_TEXT(instruction) {
    let {config, state} = instruction;
    state.addElement(config);
    state.leaveElement();
  },

  createMethodHeaders(tdBody, code, methodName) {
    let suffix = methodName ? methodName : tdBody;
    let fragment = `f${suffix}: function() {
      var res = {};
      var frag = td.${util.getTdMethodName('createDocumentFragment')}();
      res.frag = frag;\n`;
    let renderer = `r${suffix}: function(c) {
      var root = this.f${suffix}();\n`;
    code.push(tdBody, {fragment, renderer});
  },

  createMethodFooters(tdBody, code) {
    let fragment = `      return res;
    }`;
    let renderer = `      return root.frag;
    }`;
    code.push(tdBody, {fragment, renderer});
  },

  createPlaceholder(instruction) {
    let placeholderName = this.getPlaceholderName(instruction);
    return `var ${placeholderName} = td.${util.getTdMethodName('createTextNode')}('');
      ${instruction.parentNodeName}.appendChild(${placeholderName});
      res.${placeholderName} = ${placeholderName};`;
  },

  getPlaceholderName(instruction) {
    let {indexPath} = instruction;
    return `p${indexPath.join('')}`;
  },

  tdBody_exists(instruction, code) {
    let {parentTdBody, tdBody, state, key, node, bodyType} = instruction;
    let bodies = node[1].bodies;
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName(bodyType)}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), root.${this.getPlaceholderName(instruction)}, ${bodiesHash}, c);\n`;
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
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    let isInHtmlAttribute = (state === STATES.HTML_ATTRIBUTE);
    let placeholderNode = isInHtmlAttribute ? 'null' : `root.${this.getPlaceholderName(instruction)}`;

    let output = `td.${util.getTdMethodName('section')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), ${placeholderNode}, ${bodiesHash}, c)`;

    if (isInHtmlAttribute) {
      let renderer = output + ',';
      code.push(parentTdBody, {renderer});
    } else {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      ${output};\n`;
      code.push(parentTdBody, {fragment, renderer});
    }
  },

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
  },

  tdBody_helper(instruction, code) {
    let {parentTdBody, tdBody, state, key, node} = instruction;
    let params = node[1].params;
    let bodies = node[1].bodies;
    let paramsHash = this.createParamsHash(params);
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName('helper')}('${key.join('.')}', root.${this.getPlaceholderName(instruction)}, c, ${paramsHash}, ${bodiesHash});\n`;
      code.push(parentTdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('helper')}('${key.join('.')}', null, c, ${paramsHash}, ${bodiesHash}),`;
      code.push(parentTdBody, {renderer});
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
        paramVal = typeof paramVal === 'number' ? paramVal : `'${paramVal}'`;
      }
      acc.push(`${paramKey}: ${paramVal}`);
      return acc;
    }, []);
    return `{${paramsHash.join(',')}}`;
  }
});

let generateJavascript = function (results) {
  results.code = {
    fragments: [],
    renderers: [],
    push(idx, strings) {
      let {fragment, renderer} = strings;
      if (idx >= this.fragments.length) {
        if (fragment) {
          this.fragments.push(fragment);
        }
        if (renderer) {
          this.renderers.push(renderer);
        }
      } else {
        if (fragment) {
          this.fragments[idx] += fragment;
        }
        if (renderer) {
          this.renderers[idx] += renderer;
        }
      }
    },
    /**
     * Remove characters from the generated code.
     * @param {String} type Either 'fragments' or 'renderers'
     * @param {Number} idx The index of the fragment or renderer from which the characters are to be removed
     * @param {Number} start The character position to start slicing from
     * @param {Number} end The character position where the slice ends
     */
    slice(type, idx, start, end) {
      if (this[type] && this[type][idx]) {
        this[type][idx] = this[type][idx].slice(start, end);
      }
    }
  };
  return codeGenerator.build()(results.instructions, results.code);
};

export default generateJavascript;
