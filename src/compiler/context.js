if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
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

let Context = function(results) {
  let nodeStack = [{}];

  let context = {
    pushInstruction(instruction) {
      results.instructions.push(instruction);
    },
    getNamespaceFromNode(node) {
      let nodeInfo = node[1].tag_info;
      let namespace = nodeInfo.attributes.filter(attr => attr[1].attrName === 'xmlns');
      if (namespace.length) {
        return namespace[0][1].value[0][1];
      }
      return '';
    },
    getCurrentNamespace(namespace) {
      return namespace ? namespace : this.stack.peek('namespace') || '';
    },
    stack: {
      push(node, index, method) {
        let nodeType = node[0];
        let namespace = '';
        if (nodeType === 'HTML_ELEMENT') {
          namespace = this.getNamespaceFromNode(node);
        }
        if (nodeType === 'HTML_ELEMENT' || nodeType === 'HTML_ATTRIBUTE') {
          namespace = this.getCurrentNamespace(namespace);
        }

        let stackItem = {
          node,
          nodeType,
          namespace
        };
        nodeStack.push(stackItem);
        method(stackItem, this);
      },
      pop(method) {
        let stackItem = this.stack.peek();
        nodeStack.pop();
        method(stackItem, this);
      },
      peek(prop) {
        let len = nodeStack.length;
        let topItem = nodeStack[len - 1];
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

export default Context;
