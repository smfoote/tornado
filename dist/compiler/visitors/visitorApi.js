"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var assign = _interopRequire(require("lodash.assign"));

var EMPTY_NODE_TYPE = "NIL";

var api = {
  enterState: function enterState(node, state) {
    if (node.__enterStates && node.__enterStates.length) {
      node.__enterStates.push(state);
    } else {
      node.__enterStates = [state];
    }
  },
  leaveState: function leaveState(node, state) {
    if (node.__leaveStates && node.__leaveStates.length) {
      node.__leaveStates.push(state);
    } else {
      node.__leaveStates = [state];
    }
  },
  getStates: function getStates(node, direction) {
    return node["__" + direction + "States"] || [];
  },
  rename: function rename(node, newName) {
    node[0] = newName;
  },
  copyNode: function copyNode(node) {
    return assign([], node);
  },
  setToString: function setToString(node, str) {
    node.__str = str;
  },
  toString: function toString(node) {
    return node.__str;
  },
  removeChildren: function removeChildren(node) {
    node.splice(1);
  },
  replaceNode: function replaceNode(node, options) {
    var type = options.type,
        data = options.data;
    this.rename(node, type);
    this.setData(node, data);
  },
  removeNode: function removeNode(node) {
    // kinda hacks
    //  we need node = null;
    //  this doesn't handle fixing the meta information of first last and parent
    this.replaceNode(node, {
      type: EMPTY_NODE_TYPE,
      data: null
    });
  },
  addFirstChild: function addFirstChild(node, options) {
    var type = options.type,
        optionNode = options.node,
        data = options.data,
        newNode;
    newNode = optionNode || [EMPTY_NODE_TYPE];
    if (type) {
      this.rename(newNode, type);
    }
    if (data) {
      this.setData(newNode, data);
    }
    node.splice(1, 0, newNode);
  },
  addSibling: function addSibling(node, options) {
    var type = options.type,
        optionNode = options.node,
        data = options.data,
        newNode;
    newNode = optionNode || [EMPTY_NODE_TYPE];
    if (type) {
      this.rename(newNode, type);
    }
    if (data) {
      this.setData(newNode, data);
    }
    var parent = node.parent,
        index = node.index;
    if (parent) {
      parent.splice(index + 1, 0, newNode);
    }
  },
  setData: function setData(node, data) {
    node.__data = data;
  },
  toData: function toData(node) {
    return node.__data;
  }
};
module.exports = api;
//# sourceMappingURL=visitorApi.js.map