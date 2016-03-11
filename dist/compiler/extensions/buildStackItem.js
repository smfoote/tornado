"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var Context = _interopRequire(require("../context"));

function noop() {}

function stackPush(node, context) {
  context.stack.push(node, node.idx, function (stackItem) {
    node.stackItem = stackItem;
  });
}
function stackPop(node, context) {
  context.stack.pop(noop);
}

var enterPushLeavePop = {
  enter: stackPush,
  leave: stackPop
};

var generatedWalker = visitor.build({
  TORNADO_BODY: enterPushLeavePop,
  TORNADO_PARTIAL: enterPushLeavePop,
  TORNADO_REFERENCE: enterPushLeavePop,
  HTML_ELEMENT: enterPushLeavePop,
  HTML_ATTRIBUTE: enterPushLeavePop,
  HTML_COMMENT: enterPushLeavePop,
  PLAIN_TEXT: enterPushLeavePop
});

var buildStackItem = {
  transforms: [function (ast) {
    var context = new Context();
    return generatedWalker(ast, context);
  }]
};

module.exports = buildStackItem;
//# sourceMappingURL=buildStackItem.js.map