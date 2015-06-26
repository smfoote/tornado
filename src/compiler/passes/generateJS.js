/* eslint camelcase: 0 */
'use strict';

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
};

export default generateJavascript;
