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
    let inner, outer;
    frameStack.pushPh();
    inner = frameStack.current();
    frameStack.popPh();
    outer = frameStack.current();
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, frameStack: [inner, outer], ctx}));
  },
  TORNADO_BODY: {
    enter(node, ctx, frameStack) {
      let outer = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.pushTd();
        frameStack.pushPh();
      }
      let inner = frameStack.current();
      return {
        type: 'open',
        options: {key: node[1].key, item: node.stackItem, frameStack: [inner, outer], ctx}
      };
    },
    leave(node, ctx, frameStack) {
      let inner = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.popPh();
        frameStack.popTd();
      }
      let outer = frameStack.current();
      return {
        type: 'close',
        options: {item: node.stackItem, frameStack: [inner, outer], ctx}
      };
    }
  },
  TORNADO_REFERENCE(node, ctx, frameStack) {
    let inner, outer;
    frameStack.pushPh();
    inner = frameStack.current();
    frameStack.popPh();
    outer = frameStack.current();
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, frameStack: [inner, outer], ctx}));
  },
  TORNADO_COMMENT(node, ctx, frameStack) {
    let inner, outer;
    frameStack.pushPh();
    inner = frameStack.current();
    frameStack.popPh();
    outer = frameStack.current();
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: [inner, outer], ctx}));
  },
  HTML_ELEMENT: {
    enter(node, ctx, frameStack) {
      let outer = frameStack.current();
      frameStack.pushEl();
      let inner = frameStack.current();
      return {
        type: 'open',
        options: {key: node[1].tag_info.key, item: node.stackItem, frameStack: [inner, outer], ctx}
      };
    },
    leave(node, ctx, frameStack){
      let item = node.stackItem;
      item.state = item.previousState;
      let inner = frameStack.current();
      frameStack.popEl();
      let outer = frameStack.current();
      return {
        type: 'close',
        options: {item, frameStack: [inner, outer], ctx}
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter(node, ctx, frameStack) {
      let outer = frameStack.current();
      frameStack.pushPh();
      let inner = frameStack.current();
      return {
        type: 'open',
        options: {item: node.stackItem, frameStack: [inner, outer], ctx}
      };
    },
    leave(node, ctx, frameStack) {
      let inner = frameStack.current();
      frameStack.popPh();
      let outer = frameStack.current();
      return {
        type: 'close',
        options: {item: node.stackItem, frameStack: [inner, outer], ctx}
      };
    }
  },
  HTML_COMMENT(node, ctx, frameStack) {
    let inner = frameStack.current(),
        outer = inner;
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: [inner, outer], ctx}));
  },
  PLAIN_TEXT(node, ctx, frameStack) {
    let inner = frameStack.current(),
        outer = inner;
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: [inner, outer], ctx}));
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
