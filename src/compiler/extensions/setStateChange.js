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
  },
  HTML_ATTRIBUTE(node) {
    this.setState(node, STATES.HTML_ATTRIBUTE);
  },
  TORNADO_BODY(node) {
    this.setState(node, STATES.TORNADO_BODY);
  }
});

let setStateChange = {
  transforms: [function (ast) {
    return generatedWalker(ast);
  }]
};

export default setStateChange;
