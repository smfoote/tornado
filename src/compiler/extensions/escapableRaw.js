'use strict';
import util from '../utils/builder';

import visitor from '../visitor';
let generatedWalker = visitor.build({
  HTML_ELEMENT(item) {
    let {node} = item;
    let key = node[1].tag_info.key;
    if (util.elTypes.escapableRaw.indexOf(key) > -1) {
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
