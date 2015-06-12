"use strict";

if (!Object.assign) {
  Object.defineProperty(Object, "assign", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function value(target) {
      if (target === undefined || target === null) {
        throw new TypeError("Cannot convert first argument to object");
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

var STATES = {
  OUTER_SPACE: "OUTER_SPACE",
  HTML_TAG: "HTML_TAG",
  HTML_BODY: "HTML_BODY",
  HTML_ATTRIBUTE: "HTML_ATTRIBUTE",
  ESCAPABLE_RAW: "ESCAPABLE_RAW",
  TORNADO_TAG: "TORNADO_TAG",
  TORNADO_BODY: "TORNADO_BODY"
};

var Context = function Context(results) {
  var nodeStack = [{ indexPath: [] }];
  // let refCount;
  var tornadoBodiesPointer = -1;
  var defaultState = STATES.OUTER_SPACE;

  var context = {
    blocks: {},
    state: defaultState,
    getCurrentTdBody: function getCurrentTdBody(nodeType) {
      if (nodeType === "TORNADO_BODY") {
        return tornadoBodiesPointer;
      } else {
        return this.stack.peek("tdBody");
      }
    },
    getElContainer: function getElContainer() {
      var container = this.stack.peek("parentNodeIdx");
      var nodeType = this.stack.peek("nodeType");
      if (nodeType === "TORNADO_BODY") {
        return -1;
      } else if (nodeType === "HTML_ELEMENT") {
        return container + 1;
      }
    },
    incrementCurrentTdBody: function incrementCurrentTdBody() {
      tornadoBodiesPointer++;
    },
    pushInstruction: function pushInstruction(instruction) {
      results.instructions.push(instruction);
    },
    getCurrentState: function getCurrentState() {
      var state = STATES[this.stack.peek("nodeType")] || this.stack.peek("state");
      if (!state) {
        return STATES.OUTER_SPACE;
      } else {
        return state;
      }
    },
    getNamespaceFromNode: function getNamespaceFromNode(node) {
      var nodeInfo = node[1].tag_info;
      var namespace = nodeInfo.attributes.filter(function (attr) {
        return attr[1].attrName === "xmlns";
      });
      if (namespace.length) {
        return namespace[0][1].value[0][1];
      }
      return "";
    },
    getCurrentNamespace: function getCurrentNamespace(namespace) {
      return namespace ? namespace : this.stack.peek("namespace") || "";
    },
    stack: {
      push: function push(node, index, method) {
        var nodeType = node[0];
        var parentIndexPath = this.stack.peek("indexPath");
        var isTornadoBody = nodeType === "TORNADO_BODY";
        var isParentTdBody = this.stack.peek("nodeType") === "TORNADO_BODY";
        var isAttr = nodeType === "HTML_ATTRIBUTE";
        var namespace = "";
        var parentTdBody = undefined,
            blockName = undefined,
            blockIndex = undefined;
        if (nodeType === "HTML_ELEMENT") {
          namespace = this.getNamespaceFromNode(node);
          namespace = this.getCurrentNamespace(namespace);
        }
        var indexPath = parentIndexPath.slice(0);
        var state = this.getCurrentState();
        if (isParentTdBody) {
          indexPath = [];
        }
        if (!isAttr) {
          indexPath.push(index);
        }

        if (isTornadoBody) {
          var bodyType = node[1].type;
          parentTdBody = this.stack.peek("tdBody");
          if (node[1].body && node[1].body.length) {
            this.incrementCurrentTdBody();
          }
          if (bodyType === "block" || bodyType === "inlinePartial") {
            blockName = node[1].key.join(".");
            if (bodyType === "block") {
              if (this.blocks.hasOwnProperty(blockName)) {
                blockIndex = ++this.blocks[blockName];
              } else {
                blockIndex = this.blocks[blockName] = 0;
              }
            }
          }
        }

        if (node[1].escapableRaw) {
          state = STATES.ESCAPABLE_RAW;
        }
        var stackItem = {
          node: node,
          nodeType: nodeType,
          indexPath: indexPath,
          state: state,
          previousState: this.stack.peek("state"),
          blockName: blockName,
          blockIndex: blockIndex,
          namespace: namespace,
          tdBody: this.getCurrentTdBody(nodeType),
          parentTdBody: parentTdBody,
          parentNodeIdx: this.getElContainer()
        };
        nodeStack.push(stackItem);
        method(stackItem, this);
      },
      pop: function pop(method) {
        var stackItem = this.stack.peek();
        nodeStack.pop();
        method(stackItem, this);
      },
      peek: function peek(prop) {
        var len = nodeStack.length;
        var topItem = nodeStack[len - 1];
        if (!prop) {
          return topItem;
        }
        return topItem.hasOwnProperty(prop) ? topItem[prop] : false;
      }
    }
  };

  // Give Context.stack the same prototype as Context.
  context.stack = Object.assign(Object.create(context), context.stack);

  return context;
};

module.exports = Context;
//# sourceMappingURL=context.js.map