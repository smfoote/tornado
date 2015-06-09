'use strict';

import visitor from '../visitor';
let generatedWalker = visitor.build({
  HTML_ELEMENT(item) {
    let {node} = item;
    console.log('entering: ' + node[0]);
  },
  HTML_COMMENT(item) {
    let {node} = item;
    console.log('entering: ' + node[0]);
  },
  HTML_ENTITY(item) {
    let {node} = item;
    console.log('entering: ' + node[0]);
  },
  PLAIN_TEXT(item) {
    let {node} = item;
    console.log('entering: ' + node[0]);
  },
  TORNADO_COMMENT(item) {
    let {node} = item;
    console.log('entering: ' + node[0]);
  },
  TORNADO_BODY(item) {
    let {node} = item;
    console.log('entering: ' + node[0]);
  },
  TORNADO_PARTIAL(item) {
    let {node} = item;
    console.log('entering: ' + node[0]);
  },
  TORNADO_REFERENCE(node) {
    console.log('entering: ' + node[0]);
  }
});

let generateVisualizer = function (ast, options) {
  return generatedWalker(ast, options.context);
};

export default generateVisualizer;
