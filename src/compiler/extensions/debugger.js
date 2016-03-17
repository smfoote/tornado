/* eslint camelcase: 0 */

'use strict';
import visitor from '../visitors/visitor';

let generatedWalker = visitor.build({
  TORNADO_BODY(node) {
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
      enter(node, ctx, frameStack) {
        let inner = frameStack.current(),
            outer = inner;
        return {
          type: 'insert',
          options: {key: node[1].key, frameStack: [inner, outer], item: node.stackItem, ctx}
        };
      }
    }
  },
  codeGen: {
    insert_TORNADO_DEBUGGER(instruction, code) {
      let {tdBody} = instruction;
      let renderer = '      debugger;\n';
      code.push(tdBody, {renderer});
    }
  }
};

export default debuggerExtension;
