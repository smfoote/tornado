/* eslint camelcase: 0 */
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var generator = _interopRequire(require("../codeGenerator"));

var codeGenerator = {
  generatorFns: {},
  useCodeGeneratorFn: function useCodeGeneratorFn(codeGenerator) {
    this.generatorFns[codeGenerator.name] = codeGenerator.method;
  },
  useCodeGeneratorFns: function useCodeGeneratorFns(codeGenerators) {
    var _this = this;

    Object.keys(codeGenerators).forEach(function (generatorName) {
      return _this.useCodeGeneratorFn({ name: generatorName, method: codeGenerators[generatorName] });
    });
  },
  build: function build() {
    return generator.build(this.generatorFns);
  }
};

codeGenerator.useCodeGeneratorFns({
  insert_TORNADO_PARTIAL: function insert_TORNADO_PARTIAL(instruction) {
    var config = instruction.config;
    var state = instruction.state;
    var key = config.key;

    state.addBody({ key: key, type: "partial", isSelfClosing: true });
    state.leaveBody();
  },
  open_TORNADO_PARAM: function open_TORNADO_PARAM(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    var key = config.key;
    state.addParam({ key: key });
  },
  close_TORNADO_PARAM: function close_TORNADO_PARAM(instruction) {
    var state = instruction.state;

    state.leaveParam();
  },
  open_TORNADO_BODY: function open_TORNADO_BODY(instruction) {
    var config = instruction.config;
    var state = instruction.state;
    var key = config.key;
    var type = config.type;
    var name = config.name;
    var isSelfClosing = config.isSelfClosing;

    if (type === "bodies") {
      state.addBodies({ name: name });
    } else {
      state.addBody({ key: key, type: type, isSelfClosing: isSelfClosing });
    }
  },
  close_TORNADO_BODY: function close_TORNADO_BODY(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    if (config.type === "bodies") {
      state.leaveBodies();
    } else {
      state.leaveBody();
    }
  },
  insert_TORNADO_REFERENCE: function insert_TORNADO_REFERENCE(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    state.addReference(config);
  },

  open_HTML_ELEMENT: function open_HTML_ELEMENT(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    state.addElement(config);
  },
  close_HTML_ELEMENT: function close_HTML_ELEMENT(instruction) {
    var state = instruction.state;

    state.leaveElement();
  },
  open_HTML_ATTRIBUTE: function open_HTML_ATTRIBUTE(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    state.addAttr({ key: config.key });
  },
  close_HTML_ATTRIBUTE: function close_HTML_ATTRIBUTE(instruction) {
    var state = instruction.state;

    state.leaveAttr();
  },
  insert_HTML_COMMENT: function insert_HTML_COMMENT(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    var val = config.content;
    state.addHtmlComment(val);
  },
  insert_PLAIN_TEXT: function insert_PLAIN_TEXT(instruction) {
    var config = instruction.config;
    var state = instruction.state;

    var val = config.content;
    state.addPlainText(val);
  }
});

var generateJavascript = function generateJavascript(results) {
  results.code = {
    fragments: [],
    renderers: [],
    push: function push(idx, strings) {
      var fragment = strings.fragment;
      var renderer = strings.renderer;

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
    slice: function slice(type, idx, start, end) {
      if (this[type] && this[type][idx]) {
        this[type][idx] = this[type][idx].slice(start, end);
      }
    }
  };
  return codeGenerator.build()(results.instructions, results.code);
};

module.exports = generateJavascript;
//# sourceMappingURL=generateJS.js.map