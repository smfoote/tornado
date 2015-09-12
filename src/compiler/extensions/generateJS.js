/* eslint camelcase: 0 */
'use strict';
import generator from '../codeGenerator';


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
  insert_TORNADO_PARTIAL(instruction) {
    let {config, state} = instruction;
    let {key} = config;
    state.addBody({key, type: 'inlinePartial'});
    state.leaveBody();
  },
  open_TORNADO_PARAM(instruction) {
    let {config, state} = instruction;
    let key = config.key;
    state.addParam({key});
  },
  close_TORNADO_PARAM(instruction) {
    let {state} = instruction;
    state.leaveParam();
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
  open_HTML_ATTRIBUTE(instruction) {
    let {config, state} = instruction;
    state.addAttr({key: config.key});
  },
  close_HTML_ATTRIBUTE(instruction) {
    let {state} = instruction;
    state.leaveAttr();
  },
  insert_HTML_COMMENT(/*instruction, code*/) {
  },
  insert_PLAIN_TEXT(instruction) {
    let {config, state} = instruction;
    let val = config.content;
    state.addPlainText(val);
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
