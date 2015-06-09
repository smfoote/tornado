// import util from './utils/builder';
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
  let nodeStack = [{indexPath: []}];
  // let refCount;
  let tornadoBodiesPointer = -1;
  const defaultState = STATES.OUTER_SPACE;

  let context = {
    blocks: {},
    state: defaultState,
    getCurrentTdBody(nodeType) {
      if (nodeType === 'TORNADO_BODY') {
        return tornadoBodiesPointer;
      } else {
        return this.stack.peek('tdBody');
      }
    },
    getElContainer() {
      let container = this.stack.peek('parentNodeIdx');
      let nodeType = this.stack.peek('nodeType');
      if (nodeType === 'TORNADO_BODY') {
        return -1;
      } else if (nodeType === 'HTML_ELEMENT') {
        return container + 1;
      }
    },
    incrementCurrentTdBody() {
      tornadoBodiesPointer++;
    },
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
        let parentIndexPath = this.stack.peek('indexPath');
        let isTornadoBody = (nodeType === 'TORNADO_BODY');
        let isParentTdBody = (this.stack.peek('nodeType') === 'TORNADO_BODY');
        let isAttr = (nodeType === 'HTML_ATTRIBUTE');
        let namespace = '';
        let parentTdBody, blockName, blockIndex;
        if (nodeType === 'HTML_ELEMENT') {
          namespace = this.getNamespaceFromNode(node);
          namespace = this.getCurrentNamespace(namespace);
        }
        let indexPath = parentIndexPath.slice(0);
        let state = this.getCurrentState();
        if (isParentTdBody) {
          indexPath = [];
        }
        if (!isAttr) {
          indexPath.push(index);
        }

        if (isTornadoBody) {
          let bodyType = node[1].type;
          parentTdBody = this.stack.peek('tdBody');
          if (node[1].body && node[1].body.length) {
            this.incrementCurrentTdBody();
          }
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
          indexPath,
          state,
          previousState: this.stack.peek('state'),
          blockName,
          blockIndex,
          namespace,
          tdBody: this.getCurrentTdBody(nodeType),
          parentTdBody,
          parentNodeIdx: this.getElContainer()
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
