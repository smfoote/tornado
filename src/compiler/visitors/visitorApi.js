import assign from 'lodash.assign';
let EMPTY_NODE_TYPE = 'NIL';

let api = {
  setState: function(node, state) {
    if (node.__states && node.__states.length) {
      node.__states.push(state);
    } else {
      node.__states = [state];
    }
  },
  getStates: function(node) {
    return node.__states || [];
  },
  rename: function(node, newName) {
    node[0] = newName;
  },
  copyNode: function(node) {
    return assign([], node);
  },
  setToString: function(node, str) {
    node.__str = str;
  },
  toString: function(node) {
    return node.__str;
  },
  removeChildren: function(node) {
    node.splice(1);
  },
  replaceNode: function(node, options) {
    var type = options.type,
        data = options.data;
    this.rename(node, type);
    this.setData(node, data);
  },
  removeNode: function(node) {
    // kinda hacks
    //  we need node = null;
    //  this doesn't handle fixing the meta information of first last and parent
    this.replaceNode(node, {
      type: EMPTY_NODE_TYPE,
      data: null
    });
  },
  addFirstChild: function(node, options) {
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
  addSibling: function(node, options) {
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
  setData: function(node, data) {
    node.__data = data;
  },
  toData: function(node) {
    return node.__data;
  }
};
export default api;
