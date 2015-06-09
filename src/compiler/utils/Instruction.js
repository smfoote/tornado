let Instruction = function(action, config) {
  let {item, ctx, key, indexPath} = config;
  let {state, node, namespace, parentNodeName} = item;
  let [nodeType] = node;
  indexPath = item.indexPath;
  let instr = {
    action,
    nodeType,
    tdBody: ctx.getCurrentTdBody(),
    parentNodeName: parentNodeName,
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
