'use strict';

import visitor from '../visitors/visitor';
import Instruction from '../utils/Instruction';
import FrameStack from '../utils/FrameStack';

function noop() {}

let instructionDefs = {
  TEMPLATE(node, ctx, frameStack) {
    frameStack.reset();
  },
  TORNADO_PARTIAL(node, ctx, frameStack) {
    // we are not creating a new tdBody for partials
    let child, parent;
    frameStack.pushPh();
    child = frameStack.current();
    frameStack.popPh();
    parent = frameStack.current();
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx}));
  },
  TORNADO_BODY: {
    enter(node, ctx, frameStack) {
      let parent = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.pushTd();
        frameStack.pushPh();
      }
      let child = frameStack.current();
      return {
        type: 'open',
        options: {key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx}
      };
    },
    leave(node, ctx, frameStack) {
      let child = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.popPh();
        frameStack.popTd();
      }
      let parent = frameStack.current();
      return {
        type: 'close',
        options: {item: node.stackItem, frameStack: [child, parent], ctx}
      };
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
    enter(node, ctx, frameStack) {
      let parent = frameStack.current();
      frameStack.pushEl();
      let child = frameStack.current();
      return {
        type: 'open',
        options: {key: node[1].tag_info.key, item: node.stackItem, frameStack: [child, parent], ctx}
      };
    },
    leave(node, ctx, frameStack){
      let item = node.stackItem;
      item.state = item.previousState;
      let child = frameStack.current();
      frameStack.popEl();
      let parent = frameStack.current();
      return {
        type: 'close',
        options: {item, frameStack: [child, parent], ctx}
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter(node, ctx, frameStack) {
      let parent = frameStack.current();
      frameStack.pushAttr();
      frameStack.pushPh();
      let child = frameStack.current();
      return {
        type: 'open',
        options: {item: node.stackItem, frameStack: [child, parent], ctx}
      };
    },
    leave(node, ctx, frameStack) {
      let child = frameStack.current();
      frameStack.popPh();
      frameStack.popAttr();
      let parent = frameStack.current();
      return {
        type: 'close',
        options: {item: node.stackItem, frameStack: [child, parent], ctx}
      };
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
          let enter = instruction.enter.apply(null, arguments);
          ctx.pushInstruction(new Instruction(enter.type, enter.options));
        } : noop,
        leave: instruction.leave ? function() {
          let ctx = arguments[1];
          let leave = instruction.leave.apply(null, arguments);
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
    let walker = visitor.build(this.instructionDefs);
    return function(ast, options) {
      return walker(ast, options.context, frameStack);
    };
  }
};

buildInstructions.addInstructions(instructionDefs);

export default buildInstructions;
