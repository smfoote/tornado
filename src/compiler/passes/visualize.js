'use strict';

import visitor from '../visitor';
let generatedWalker = visitor.build({
  HTML_ELEMENT(node) {
    console.log('entering: ' + node[0]);
  },
  HTML_COMMENT(node) {
    console.log('entering: ' + node[0]);
  },
  HTML_ENTITY(node) {
    console.log('entering: ' + node[0]);
  },
  PLAIN_TEXT(node) {
    console.log('entering: ' + node[0]);
  },
  TORNADO_COMMENT(node) {
    console.log('entering: ' + node[0]);
  },
  TORNADO_BODY(node) {
    console.log('entering: ' + node[0]);
  },
  TORNADO_PARITAL(node) {
    console.log('entering: ' + node[0]);
  },
  TORNADO_REFERENCE(node) {
    console.log('entering: ' + node[0]);
  }
});

let generateVisualizer = function (ast, options) {
  console.log('ast' + JSON.stringify(ast));
  return generatedWalker(ast, options.context);
};

export default generateVisualizer;
