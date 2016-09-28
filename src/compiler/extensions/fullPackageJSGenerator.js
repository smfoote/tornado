/* eslint camelcase: 0 */
'use strict';
import generator from '../codeGenerator';

import util from '../utils/builder';

const noop = ()=>{};

let generatorFns = {
  open_TORNADO_BODY(instruction, code) {
    let {tdBody, bodyType, needsOwnMethod} = instruction;
    let tdMethodName;
    if (needsOwnMethod) {
      this.createMethodHeaders(tdBody, code, tdMethodName);
    }
    let buildTdBodyCode = (this[`tdBody_${bodyType}`] || noop).bind(this);
    buildTdBodyCode(instruction, code);
  },
  close_TORNADO_BODY(instruction, code) {
    let {tdBody, needsOwnMethod} = instruction;
    if (needsOwnMethod) {
      this.createMethodFooters(tdBody, code);
    }
  },
  insert_TORNADO_REFERENCE(instruction, code) {
    let {tdBody, key, state} = instruction;
    if (!util.inHtmlAttribute(state)) {
      const oldNode = `root.${this.getPlaceholderName(instruction)}`;
      const newNode = `d.createTextNode(${this.createReference(key)})`;
      let fragment = `      ${this.createPlaceholder(instruction)}\n`;
      let renderer = `      ${oldNode}.parentNode.replaceChild(${newNode}, ${oldNode});\n`;
      code.push(tdBody, {fragment, renderer});
    } else {
      let renderer = `${this.createReference(key)},`;
      code.push(tdBody, {renderer});
    }
  },

  open_HTML_ELEMENT(instruction, code) {
    let {tdBody, elCount, state, key, namespace} = instruction;
    namespace = namespace ? `, '${namespace}'` : '';
    if (!util.inHtmlAttribute(state)) {
      let fragment = `      var el${elCount} = d.createElement('${key}'${namespace});\n`;
      code.push(tdBody, {fragment});
    }
  },
  close_HTML_ELEMENT(instruction, code) {
    let {state, parentNodeName, elCount, tdBody} = instruction;
    if (util.inEscapableRaw(state)) {
      let fragment = `      el${elCount - 1}.defaultValue += td.${util.getTdMethodName('nodeToString')}(el${elCount});\n`;
      code.push(tdBody, {fragment});
    } else if (!util.inHtmlAttribute(state)) {
      let fragment = `      ${parentNodeName}.appendChild(el${elCount});\n`;
      code.push(tdBody, {fragment});
    }
  },
  open_HTML_ATTRIBUTE(instruction, code) {
    let {tdBody, node, hasTornadoRef, parentNodeName} = instruction;
    let attrInfo = node[1];
    let placeholderName = this.getPlaceholderName(instruction);
    let fragment = `      res.${placeholderName} = ${parentNodeName};\n`;
    let renderer = `      root.${placeholderName}.setAttribute('${attrInfo.attrName}',`;
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
      renderer = `].join(''));\n`;
    } else {
      renderer = ');\n';
    }
    // Remove the trailing comma from the last item in the array
    code.slice('renderers', tdBody, 0, -1);
    code.push(tdBody, {renderer});
  },
  insert_HTML_COMMENT(instruction, code) {
    let {tdBody, parentNodeName, contents} = instruction;
    let fragment = `      ${parentNodeName}.appendChild(d.createHTMLComment('${contents}'));\n`;
    code.push(tdBody, {fragment});
  },
  insert_PLAIN_TEXT(instruction, code) {
    let {tdBody, parentNodeName, contents, state} = instruction;
    if (!util.inHtmlAttribute(state)) {
      let fragment = `      ${parentNodeName}.appendChild(d.createTextNode('${contents}'));\n`;
      code.push(tdBody, {fragment});
    } else {
      let renderer = `'${contents}',`;
      code.push(tdBody, {renderer});
    }
  },

  createReference(key) {
    if (key.length) {
      return key.map((k, idx) => {
        const aggregateKey = key.slice(0, idx + 1).reduce((acc, val) => {
          return `${acc}['${val}']`;
        }, '');
        return `c${aggregateKey}`;
      }).join(' && ');
    } else {
      return 'c';
    }
  },

  createMethodHeaders(tdBody, code, methodName) {
    let suffix = methodName ? methodName : tdBody;
    let fragment = `f${suffix}: function() {
      var res = {};
      var frag = d.createDocumentFragment();
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
    return `var ${placeholderName} = d.createTextNode('');
      ${instruction.parentNodeName}.appendChild(${placeholderName});
      res.${placeholderName} = ${placeholderName};`;
  },

  getPlaceholderName(instruction) {
    let {indexPath} = instruction;
    return `p${indexPath}`;
  },

  tdBody_exists(instruction, code) {
    let {parentTdBody, tdBody, state, key, node} = instruction;
    let bodies = node[1].bodies;
    if (!util.inHtmlAttribute(state)) {
      const oldNode = `root.${this.getPlaceholderName(instruction)}`;
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      if (${this.createReference(key)}) {
        ${oldNode}.parentNode.replaceChild(this.r${tdBody}(c), ${oldNode});
      }`;
      if (bodies.length && bodies[0][1].name === 'else') {
        renderer += ` else {
        ${oldNode}.parentNode.replaceChild(this.r${tdBody + 1}(c), ${oldNode});
      }`;
      }
      renderer += '\n';
      code.push((parentTdBody), {renderer, fragment});
    } else {
      let elseBody = `''`;
      if (bodies.length && bodies[0][1].name === 'else') {
        elseBody = `nodeToString(this.r${tdBody + 1}(c))`;
      }
      let renderer = `(${this.createReference(key)} ? nodeToString(this.r${tdBody}(c)) : ${elseBody}),`;
      code.push((parentTdBody), {renderer});
    }
  },

  tdBody_notExists(instruction, code) {
    let {parentTdBody, tdBody, state, key, node, bodyType} = instruction;
    let bodies = node[1].bodies;
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (!util.inHtmlAttribute(state)) {
      const oldNode = `root.${this.getPlaceholderName(instruction)}`;
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      if (!(${this.createReference(key)})) {
        ${oldNode}.parentNode.replaceChild(this.r${tdBody}(c), ${oldNode});
      }`;
      if (bodies.length && bodies[0][1].name === 'else') {
        renderer += ` else {
        ${oldNode}.parentNode.replaceChild(this.r${tdBody + 1}(c), ${oldNode});
      }`;
      }
      renderer += '\n';
      code.push((parentTdBody), {renderer, fragment});
    } else {
      let renderer = `td.${util.getTdMethodName(bodyType)}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), null, ${bodiesHash}, c),`;
      code.push((parentTdBody), {renderer});
    }
  },

  tdBody_section(instruction, code) {
    let {parentTdBody, tdBody, state, key, node} = instruction;
    let bodies = node[1].bodies;
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    let isInHtmlAttribute = util.inHtmlAttribute(state);
    let placeholderNode = isInHtmlAttribute ? 'null' : `root.${this.getPlaceholderName(instruction)}`;

    let output = `td.${util.getTdMethodName('section')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(key)}), ${placeholderNode}, ${bodiesHash}, c)`;

    if (isInHtmlAttribute) {
      let renderer = output + ',';
      code.push(parentTdBody, {renderer});
    } else {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      if (Array.isArray(${this.createReference(key)})) {
        const frag = document.createDocumentFragment();
        (${this.createReference(key)}).map(item => {
          frag.appendChild(this.r${tdBody}(item));
        });
        ${placeholderNode}.parentNode.replaceChild(frag, ${placeholderNode});
      } else {

      }\n`;
      code.push(parentTdBody, {fragment, renderer});
    }
  },

  tdBody_block(instruction, code) {
    let {parentTdBody, state, key, tdBody} = instruction;
    let blockName = key.join('.');
    if (!util.inHtmlAttribute(state)) {
      let fragment = `      ${this.createPlaceholder(instruction)};\n`;
      let renderer = `      td.${util.getTdMethodName('replaceNode')}(root.${this.getPlaceholderName(instruction)}, td.${util.getTdMethodName('block')}('${blockName}', ${tdBody}, c, this));\n`;
      code.push(parentTdBody, {fragment, renderer});
    } else {
      let renderer = `td.${util.getTdMethodName('nodeToString')}(td.${util.getTdMethodName('block')}('${blockName}', ${tdBody}, c, this)),`;
      code.push(parentTdBody, {renderer});
    }
  },

  tdBody_helper(instruction, code) {
    let {parentTdBody, tdBody, state, key, node} = instruction;
    let params = node[1].params;
    let bodies = node[1].bodies;
    let paramsHash = this.createParamsHash(params);
    let bodiesHash = this.createBodiesHash(tdBody, bodies, node[1].body);
    if (!util.inHtmlAttribute(state)) {
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
};

let codeGenerator = {
  generatorFns: {},
  useCodeGeneratorFn(codeGenerator) {
    this.generatorFns[codeGenerator.name] = codeGenerator.method;
  },
  useCodeGeneratorFns(codeGenerators) {
    Object.keys(codeGenerators)
    .forEach(generatorName => this.useCodeGeneratorFn({name: generatorName, method: codeGenerators[generatorName]}));
  },
  prepareGenerator() {
    return function(results) {
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
      return generator.build(this.generatorFns)(results.instructions, results.code);
    };
  }
};

codeGenerator.useCodeGeneratorFns(generatorFns);

export default codeGenerator;
