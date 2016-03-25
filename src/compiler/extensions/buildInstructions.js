'use strict';

import visitor from '../visitors/visitor';
import Instruction from '../utils/Instruction';
import FrameStack from '../utils/FrameStack';
import Stack from '../utils/Stack';

function noop() {}


function enterAll(states, stateStack) {
  states.forEach(function(s) {
    stateStack.enter(s);
  });
}
function leaveAll(states, stateStack) {
  states.forEach(function(s) {
    stateStack.leave(s);
  });
}

let instructionDefs = {
  TEMPLATE(node, ctx, frameStack, stateStack) {
    stateStack.clear();
    frameStack.reset();
  },
  TORNADO_PARTIAL(node, ctx, frameStack, stateStack) {
    // we are not creating a new tdBody for partials
    let child, parent;
    frameStack.pushPh();
    child = frameStack.current();
    frameStack.popPh();
    parent = frameStack.current();
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx, stateStack}));
  },
  TORNADO_BODY: {
    enter(node, ctx, frameStack, stateStack) {
      let parent = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.pushTd();
        frameStack.pushPh();
      }
      let child = frameStack.current();
      let out = {
        type: 'open',
        options: {key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx, stateStack}
      };
      enterAll(this.getStates(node, 'enter'), stateStack);
      return out;
    },
    leave(node, ctx, frameStack, stateStack) {
      let child = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.popPh();
        frameStack.popTd();
      }
      let parent = frameStack.current();
      leaveAll(this.getStates(node, 'leave'), stateStack);
      let out = {
        type: 'close',
        options: {item: node.stackItem, frameStack: [child, parent], ctx, stateStack}
      };
      return out;
    }
  },
  TORNADO_REFERENCE(node, ctx, frameStack) {
    let child, parent;
    frameStack.pushPh();
    child = frameStack.current();
    frameStack.popPh();
    parent = frameStack.current();
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx}));
  },
  TORNADO_COMMENT(node, ctx, frameStack) {
    let child, parent;
    frameStack.pushPh();
    child = frameStack.current();
    frameStack.popPh();
    parent = frameStack.current();
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: [child, parent], ctx}));
  },
  HTML_ELEMENT: {
    enter(node, ctx, frameStack, stateStack) {
      let parent = frameStack.current();
      frameStack.pushEl();
      let child = frameStack.current();
      let out = {
        type: 'open',
        options: {key: node[1].tag_info.key, item: node.stackItem, frameStack: [child, parent], ctx, stateStack}
      };
      enterAll(this.getStates(node, 'enter'), stateStack);
      return out;
    },
    leave(node, ctx, frameStack, stateStack){
      let item = node.stackItem;
      item.state = item.previousState;
      let child = frameStack.current();
      frameStack.popEl();
      let parent = frameStack.current();
      leaveAll(this.getStates(node, 'leave'), stateStack);
      let out = {
        type: 'close',
        options: {item, frameStack: [child, parent], ctx, stateStack}
      };
      return out;
    }
  },
  HTML_ATTRIBUTE: {
    enter(node, ctx, frameStack, stateStack) {
      let parent = frameStack.current();
      frameStack.pushAttr();
      frameStack.pushPh();
      let child = frameStack.current();
      let out = {
        type: 'open',
        options: {item: node.stackItem, frameStack: [child, parent], ctx, stateStack}
      };
      enterAll(this.getStates(node, 'enter'), stateStack);
      return out;
    },
    leave(node, ctx, frameStack, stateStack) {
      let child = frameStack.current();
      frameStack.popPh();
      frameStack.popAttr();
      let parent = frameStack.current();
      leaveAll(this.getStates(node, 'leave'), stateStack);
      let out = {
        type: 'close',
        options: {item: node.stackItem, frameStack: [child, parent], ctx, stateStack}
      };
      return out;
    }
  },
  HTML_COMMENT(node, ctx, frameStack) {
    let child = frameStack.current(),
        parent = child;
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: [child, parent], ctx}));
  },
  PLAIN_TEXT(node, ctx, frameStack) {
    let child = frameStack.current(),
        parent = child;
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: [child, parent], ctx}));
  }
};

let buildInstructions = {
  instructionDefs: {},
  addInstruction(name, instruction) {
    if (typeof instruction === 'function') {
      this.instructionDefs[name] = instruction;
    } else {
      let instructionDef = {
        enter: instruction.enter ? function() {
          let ctx = arguments[1];
          let enter = instruction.enter.apply(this, arguments);
          ctx.pushInstruction(new Instruction(enter.type, enter.options));
        } : noop,
        leave: instruction.leave ? function() {
          let ctx = arguments[1];
          let leave = instruction.leave.apply(this, arguments);
          ctx.pushInstruction(new Instruction(leave.type, leave.options));
        } : noop
      };
      this.instructionDefs[name] = instructionDef;
    }
  },
  addInstructions(instructions) {
    Object.keys(instructions).forEach(instructionName => {
      this.addInstruction(instructionName, instructions[instructionName]);
    });
  },
  generateInstructions() {
    let frameStack = new FrameStack();
    let stateStack = new Stack();
    let walker = visitor.build(this.instructionDefs);
    return function(ast, options) {
      return walker(ast, options.context, frameStack, stateStack);
    };
  }
};

buildInstructions.addInstructions(instructionDefs);

export default buildInstructions;
