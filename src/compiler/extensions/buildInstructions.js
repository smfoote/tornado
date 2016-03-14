'use strict';

import visitor from '../visitors/visitor';
import Instruction from '../utils/Instruction';
import FrameStack from '../utils/FrameStack';

let instructionDefs = {
  TEMPLATE(node, ctx, fs) {
    fs.reset();
  },
  TORNADO_PARTIAL(node, ctx, fs) {
    // we are not creating a new tdBody for partials
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, frameStack: fs.current(), ctx}));
  },
  TORNADO_BODY: {
    enter(node, ctx, fs) {
      if (node[1].body && node[1].body.length) {
        fs.pushTd();
      }
      return {
        type: 'open',
        options: {key: node[1].key, item: node.stackItem, frameStack: fs.current(), ctx}
      };
    },
    leave(node, ctx, fs) {
      let prev = fs.current();
      if (node[1].body && node[1].body.length) {
        fs.popTd();
      }
      return {
        type: 'close',
        options: {item: node.stackItem, frameStack: prev, ctx}
      };
    }
  },
  TORNADO_REFERENCE(node, ctx, fs) {
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, frameStack: fs.current(), ctx}));
  },
  TORNADO_COMMENT(node, ctx, fs) {
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: fs.current(), ctx}));
  },
  HTML_ELEMENT: {
    enter(node, ctx, fs) {
      fs.pushEl();
      return {
        type: 'open',
        options: {key: node[1].tag_info.key, item: node.stackItem, frameStack: fs.current(), ctx}
      };
    },
    leave(node, ctx, fs){
      let item = node.stackItem;
      item.state = item.previousState;
      let prev = fs.current();
      fs.popEl();
      return {
        type: 'close',
        options: {item, frameStack: prev, ctx}
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter(node, ctx, fs) {
      return {
        type: 'open',
        options: {item: node.stackItem, frameStack: fs.current(), ctx}
      };
    },
    leave(node, ctx, fs) {
      return {
        type: 'close',
        options: {item: node.stackItem, frameStack: fs.current(), ctx}
      };
    }
  },
  HTML_COMMENT(node, ctx, fs) {
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: fs.current(), ctx}));
  },
  PLAIN_TEXT(node, ctx, fs) {
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, frameStack: fs.current(), ctx}));
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
        } : null,
        leave: instruction.leave ? function() {
          let ctx = arguments[1];
          let leave = instruction.leave.apply(null, arguments);
          ctx.pushInstruction(new Instruction(leave.type, leave.options));
        } : null
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
