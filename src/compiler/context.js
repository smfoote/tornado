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

const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};

let Context = function(results) {
  let nodeStack = [{}];
  const defaultState = STATES.OUTER_SPACE;

  let context = {
    blocks: {},
    state: defaultState,
    pushInstruction(instruction) {
      results.instructions.push(instruction);
    },
    getCurrentState() {
      let state = STATES[this.stack.peek('nodeType')] || this.stack.peek('state');
      if (!state) {
        return STATES.OUTER_SPACE;
      } else {
        return state;
      }
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
        let isTornadoBody = (nodeType === 'TORNADO_BODY');
        let namespace = '';
        let blockName, blockIndex;
        if (nodeType === 'HTML_ELEMENT') {
          namespace = this.getNamespaceFromNode(node);
        }
        if (nodeType === 'HTML_ELEMENT' || nodeType === 'HTML_ATTRIBUTE') {
          namespace = this.getCurrentNamespace(namespace);
        }
        let state = this.getCurrentState();

        if (isTornadoBody) {
          let bodyType = node[1].type;
          if (bodyType === 'block' || bodyType === 'inlinePartial') {
            blockName = node[1].key.join('.');
            if (bodyType === 'block') {
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
        let stackItem = {
          node,
          nodeType,
          state,
          previousState: this.stack.peek('state'),
          blockName,
          blockIndex,
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
