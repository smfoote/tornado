'use strict';
import visitor from '../visitor';

let generatedWalker = visitor.build({
  TORNADO_REFERENCE(item) {
    let {node} = item;
    node = node[1];
    let sepParam = node.params.filter(param => param[1].key === 'sep')
                          .reduce(((acc, param) => param[1]), null);
    if (sepParam && sepParam.val !== '.') {
      node.key = node.key.join('.').split(sepParam.val);
    }
  }
});

let builtinHelpers = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

export default builtinHelpers;
