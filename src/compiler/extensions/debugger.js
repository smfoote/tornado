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

let debuggerExtension = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }],
  instructions: {
    TORNADO_DEBUGGER: {
      enter(item, ctx) {
        return {
          type: 'insert',
          options: {key: item.node[1].key, item, ctx}
        };
      }
    }
  }
};

export default debuggerExtension;
