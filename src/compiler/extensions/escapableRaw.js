'use strict';
import visitor from '../visitors/visitor';
import {STATES} from '../utils/builder';

const escapableRawEls = ['textarea', 'title'];
let generatedWalker = visitor.build({
  HTML_ELEMENT(node) {
    let key = node[1].tag_info.key;
    if (escapableRawEls.indexOf(key) > -1) {
      this.setState(node, STATES.ESCAPABLE_RAW);
    }
  }
});

let escapableRaw = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

export default escapableRaw;
