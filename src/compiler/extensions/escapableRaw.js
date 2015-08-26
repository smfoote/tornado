'use strict';
import visitor from '../visitor';

const escapableRawEls = ['textarea', 'title'];
let generatedWalker = visitor.build({
  HTML_ELEMENT(item) {
    let {node} = item;
    let key = node[1].tag_info.key;
    if (escapableRawEls.indexOf(key) > -1) {
      node[1].escapableRaw = true;
    }
  }
});

let escapableRaw = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

export default escapableRaw;
