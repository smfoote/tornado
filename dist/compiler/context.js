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

var Context = function Context(results) {
  var nodeStack = [{}];

  var context = {
    pushInstruction: function pushInstruction(instruction) {
      results.instructions.push(instruction);
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
        var namespace = "";
        if (nodeType === "HTML_ELEMENT") {
          namespace = this.getNamespaceFromNode(node);
        }
        if (nodeType === "HTML_ELEMENT" || nodeType === "HTML_ATTRIBUTE") {
          namespace = this.getCurrentNamespace(namespace);
        }

        var stackItem = {
          node: node,
          nodeType: nodeType,
          namespace: namespace
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