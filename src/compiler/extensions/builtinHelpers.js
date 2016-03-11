'use strict';
import visitor from '../visitors/visitor';

const BUILT_IN_HELPER_TYPES = ['exists', 'notExists', 'section'];

let generatedWalker = visitor.build({
  TORNADO_BODY(node) {
    node = node[1];
    if (BUILT_IN_HELPER_TYPES.indexOf(node.type) > -1) {
      node.params.push([
        'TORNADO_PARAM',
        {
          key: 'key',
          val: node.key.join('.')
        }
      ]);
      node.key = [node.type];
      node.type = 'helper';
    }
  }
});

let builtinHelpers = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

export default builtinHelpers;
