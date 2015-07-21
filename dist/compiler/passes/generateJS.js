/* eslint camelcase: 0 */
"use strict";

var generateJavascript = function generateJavascript(ast, options) {
  options.results.code = {
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
    slice: function slice(type, idx, start, end) {
      if (this[type] && this[type][idx]) {
        this[type][idx] = this[type][idx].slice(start, end);
      }
    }
  };
};

module.exports = generateJavascript;
//# sourceMappingURL=generateJS.js.map