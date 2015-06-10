let Instruction = function(action, config) {
  let {item, key, indexPath} = config;
  let {state, node, namespace, blockName, blockIndex, parentNodeIdx, parentTdBody, tdBody} = item;
  let [nodeType] = node;
  let parentNodeName = (parentNodeIdx === -1) ? 'frag' : `el${parentNodeIdx}`;
  let bodyType, hasElseBody, tdMethodName, needsOwnMethod;
  if (nodeType === 'TORNADO_BODY') {
    bodyType = node[1].type || '';
    hasElseBody = (node[1].bodies && node[1].bodies.length === 1 && node[1].bodies[0][1].name === 'else');
    needsOwnMethod = !!(node[1].body && node[1].body.length);

    if (blockName) {
      tdMethodName = `_${bodyType.substring(0,1)}_${blockName}`;

      if (blockIndex !== undefined) {
        tdMethodName += blockIndex;
      }
    }
  }
  indexPath = item.indexPath;
  let instr = {
    action,
    nodeType,
    bodyType,
    blockIndex,
    needsOwnMethod,
    hasElseBody,
    tdMethodName,
    parentTdBody,
    tdBody,
    parentNodeName: parentNodeName,
    indexPath,
    key,
    state,
    node,
    namespace,
    elCount: parentNodeIdx + 1
  };
  return instr;
};

export default Instruction;
