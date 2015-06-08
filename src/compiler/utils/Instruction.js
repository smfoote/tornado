let Instruction = function(action, config) {
  let {item, ctx, key, indexPath} = config;
  let {state, node, namespace} = item;
  let [nodeType] = node;
  indexPath = item.indexPath;
  let instr = {
    action,
    nodeType,
    tdBody: ctx.getCurrentTdBody(),
    parentNodeName: ctx.stack.peek('parentNodeName'),
    indexPath,
    key,
    state,
    node,
    namespace,
    elCount: item.elCount
  };
  return instr;
};

export default Instruction;
