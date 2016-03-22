let Instruction = function(action, config) {
  let {item, key, frameStack} = config;
  let {node, namespace} = item;
  let child = frameStack[0] === null ? 0 : frameStack[0];
  let parent = frameStack[1] === null ? 0 : frameStack[1];
  let tdBody = ( child && child[0] !== null ) ? child[0] : 0;
  let parentTdBody = ( parent && parent[0] !== null ) ? parent[0] : 0;
  let elIdx = ( child && child[1] !== null ) ? child[1] : 0;
  let parentNodeIdx = ( parent && parent[1] !== null ) ? parent[1] : -1;
  let placeHolderIdx = (child && child[2] !== null) ? child[2] : 0;
  let indexPath = '' + placeHolderIdx;
  let attrIdx = ( parent && parent[3] !== null ) ? parent[3] : null;

  let [nodeType] = node;
  let contents;
  let parentNodeName = (parentNodeIdx === -1) ? 'frag' : `el${parentNodeIdx}`;
  let bodyType, needsOwnMethod, hasTornadoRef;
  if (nodeType === 'TORNADO_BODY') {
    bodyType = node[1].type || '';
    needsOwnMethod = !!(node[1].body && node[1].body.length);
  } else if (nodeType === 'HTML_ATTRIBUTE') {
    let attrVal = node[1].value;
    hasTornadoRef = attrVal && attrVal.some(val => {
      let type = val[0];
      return type === 'TORNADO_REFERENCE' || type === 'TORNADO_BODY' || type === 'TORNADO_PARTIAL';
    });
  } else if (nodeType === 'HTML_COMMENT' || nodeType === 'PLAIN_TEXT') {
    contents = node[1].replace(/'/g, "\\'");
  }
  let instr = {
    action,
    nodeType,
    bodyType,
    needsOwnMethod,
    hasTornadoRef,
    parentTdBody,
    tdBody,
    contents,
    parentNodeName: parentNodeName,
    indexPath,
    key,
    node,
    namespace,
    elCount: elIdx,
    attrIdx
  };
  return instr;
};

export default Instruction;
