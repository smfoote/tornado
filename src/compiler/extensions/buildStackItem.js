'use strict';

import visitor from '../visitors/visitor';
import Context from '../context';


function noop(){}

function stackPush(node, context) {
  context.stack.push(node, node.idx, function(stackItem) {
    node.stackItem = stackItem;
  });
}
function stackPop(node, context) {
  context.stack.pop(noop);
}

let enterPushLeavePop = {
  enter: stackPush,
  leave: stackPop
};

let generatedWalker = visitor.build({
  TORNADO_BODY: enterPushLeavePop,
  TORNADO_PARTIAL: enterPushLeavePop,
  TORNADO_REFERENCE: enterPushLeavePop,
  HTML_ELEMENT: enterPushLeavePop,
  HTML_ATTRIBUTE: enterPushLeavePop,
  HTML_COMMENT: enterPushLeavePop,
  PLAIN_TEXT: enterPushLeavePop
});

let buildStackItem = {
  transforms: [function (ast) {
    var context = new Context();
    return generatedWalker(ast, context);
  }]
};

export default buildStackItem;
