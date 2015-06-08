const IS_TORNADO = /TORNADO_/;

let Instruction = function(action, item, ctx) {
  let [nodeType, nodeInfo] = item.node;
  let key, indexPath, contents;
  if (IS_TORNADO.test(nodeType)) {
    key = nodeInfo.key;
    indexPath = item.indexPath;
  }
  if (nodeType === 'PLAIN_TEXT') {
    contents = nodeInfo;
  }
  return {
    action,
    nodeType,
    tdBody: ctx.getCurrentTdBody(),
    parentNodeName: ctx.stack.peak('parentNodeName'),
    indexPath,
    key,
    contents
  };
};

export default Instruction;
