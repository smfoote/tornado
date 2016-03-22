"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var Instruction = function Instruction(action, config) {
  var item = config.item;
  var key = config.key;
  var frameStack = config.frameStack;
  var node = item.node;
  var namespace = item.namespace;

  var child = frameStack[0] === null ? 0 : frameStack[0];
  var parent = frameStack[1] === null ? 0 : frameStack[1];
  var tdBody = child && child[0] !== null ? child[0] : 0;
  var parentTdBody = parent && parent[0] !== null ? parent[0] : 0;
  var elIdx = child && child[1] !== null ? child[1] : 0;
  var parentNodeIdx = parent && parent[1] !== null ? parent[1] : -1;
  var placeHolderIdx = child && child[2] !== null ? child[2] : 0;
  var indexPath = "" + placeHolderIdx;
  var attrIdx = parent && parent[3] !== null ? parent[3] : null;

  var _node = _slicedToArray(node, 1);

  var nodeType = _node[0];

  var contents = undefined;
  var parentNodeName = parentNodeIdx === -1 ? "frag" : "el" + parentNodeIdx;
  var bodyType = undefined,
      needsOwnMethod = undefined,
      hasTornadoRef = undefined;
  if (nodeType === "TORNADO_BODY") {
    bodyType = node[1].type || "";
    needsOwnMethod = !!(node[1].body && node[1].body.length);
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
    needsOwnMethod: needsOwnMethod,
    hasTornadoRef: hasTornadoRef,
    parentTdBody: parentTdBody,
    tdBody: tdBody,
    contents: contents,
    parentNodeName: parentNodeName,
    indexPath: indexPath,
    key: key,
    node: node,
    namespace: namespace,
    elCount: elIdx,
    attrIdx: attrIdx
  };
  return instr;
};

module.exports = Instruction;
//# sourceMappingURL=Instruction.js.map