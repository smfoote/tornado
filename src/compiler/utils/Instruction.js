let Instruction = function(action, config) {
  let {item, key, indexPath} = config;
  let {state, node, namespace, blockName, blockIndex, parentNodeIdx, parentTdBody, tdBody} = item;
  let [nodeType] = node;
  let parentNodeName = (parentNodeIdx === -1) ? 'frag' : `el${parentNodeIdx}`;
  let bodyType, tdMethodName, needsOwnMethod, hasTornadoRef;
  if (nodeType === 'TORNADO_BODY') {
    bodyType = node[1].type || '';
    needsOwnMethod = !!(node[1].body && node[1].body.length);

    if (blockName) {
      tdMethodName = `_${bodyType.substring(0,1)}_${blockName}`;

      if (blockIndex !== undefined) {
        tdMethodName += blockIndex;
      }
    }
  } else if (nodeType === 'HTML_ATTRIBUTE') {
    let attrVal = node[1].value;
    hasTornadoRef = attrVal && attrVal.some(val => {
      let type = val[0];
      return type === 'TORNADO_REFERENCE' || type === 'TORNADO_BODY' || type === 'TORNADO_PARTIAL';
    });
  }
  indexPath = item.indexPath;
  let instr = {
    action,
    nodeType,
    bodyType,
    blockIndex,
    needsOwnMethod,
    hasTornadoRef,
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
