'use strict';
import visitor from '../visitor';

let generatedWalker = visitor.build({
  TORNADO_BODY(item) {
    let {node} = item;
    let nodeInfo = node[1];
    if (nodeInfo.type === 'helper' && nodeInfo.key.join('') === 'debugger') {
      node[0] = 'TORNADO_DEBUGGER';
    }
  }
});

let escapableRaw = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

export default escapableRaw;
