"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var Instruction = function Instruction(action, config) {
  var item = config.item;
  var key = config.key;
  var frameStack = config.frameStack;
  var state = item.state;
  var node = item.node;
  var namespace = item.namespace;
  var blockName = item.blockName;
  var blockIndex = item.blockIndex;

  var inner = frameStack[0] === null ? 0 : frameStack[0];
  var outer = frameStack[1] === null ? 0 : frameStack[1];
  var tdBody = inner && inner[0] !== null ? inner[0] : 0;
  var parentTdBody = outer && outer[0] !== null ? outer[0] : 0;
  var elIdx = inner && inner[1] !== null ? inner[1] : 0;
  var parentNodeIdx = outer && outer[1] !== null ? outer[1] : -1;
  var placeHolderIdx = inner && inner[2] !== null ? inner[2] : 0;
  var indexPath = "" + placeHolderIdx;

  var _node = _slicedToArray(node, 1);

  var nodeType = _node[0];

  var contents = undefined;
  var parentNodeName = parentNodeIdx === -1 ? "frag" : "el" + parentNodeIdx;
  var bodyType = undefined,
      tdMethodName = undefined,
      needsOwnMethod = undefined,
      hasTornadoRef = undefined;
  if (nodeType === "TORNADO_BODY") {
    bodyType = node[1].type || "";
    needsOwnMethod = !!(node[1].body && node[1].body.length);

    if (blockName) {
      tdMethodName = "_" + bodyType.substring(0, 1) + "_" + blockName;

      if (blockIndex !== undefined) {
        tdMethodName += blockIndex;
      }
    }
  } else if (nodeType === "HTML_ATTRIBUTE") {
    var attrVal = node[1].value;
    hasTornadoRef = attrVal && attrVal.some(function (val) {
      var type = val[0];
      return type === "TORNADO_REFERENCE" || type === "TORNADO_BODY" || type === "TORNADO_PARTIAL";
    });
  } else if (nodeType === "HTML_COMMENT" || nodeType === "PLAIN_TEXT") {
    contents = node[1].replace(/'/g, "\\'");
  }
  var instr = {
    action: action,
    nodeType: nodeType,
    bodyType: bodyType,
    blockIndex: blockIndex,
    needsOwnMethod: needsOwnMethod,
    hasTornadoRef: hasTornadoRef,
    tdMethodName: tdMethodName,
    parentTdBody: parentTdBody,
    tdBody: tdBody,
    contents: contents,
    parentNodeName: parentNodeName,
    indexPath: indexPath,
    key: key,
    state: state,
    node: node,
    namespace: namespace,
    elCount: elIdx
  };
  return instr;
};

module.exports = Instruction;
//# sourceMappingURL=Instruction.js.map