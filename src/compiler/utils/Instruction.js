let Instruction = function(action, config) {
  let {item, key, frameStack} = config;
  let {state, node, namespace} = item;
  let inner = frameStack[0] === null ? 0 : frameStack[0];
  let outer = frameStack[1] === null ? 0 : frameStack[1];
  let tdBody = ( inner && inner[0] !== null ) ? inner[0] : 0;
  let parentTdBody = ( outer && outer[0] !== null ) ? outer[0] : 0;
  let elIdx = ( inner && inner[1] !== null ) ? inner[1] : 0;
  let parentNodeIdx = ( outer && outer[1] !== null ) ? outer[1] : -1;
  let placeHolderIdx = (inner && inner[2] !== null) ? inner[2] : 0;
  let indexPath = '' + placeHolderIdx;

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
    state,
    node,
    namespace,
    elCount: elIdx
  };
  return instr;
};

export default Instruction;
