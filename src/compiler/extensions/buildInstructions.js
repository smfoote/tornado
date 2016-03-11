'use strict';

import visitor from '../visitors/visitor';
import Instruction from '../utils/Instruction';

let instructionDefs = {
  TORNADO_PARTIAL(node, ctx) {
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, ctx}));
  },
  TORNADO_BODY: {
    enter(node, ctx) {
      return {
        type: 'open',
        options: {key: node[1].key, item: node.stackItem, ctx}
      };
    },
    leave(node, ctx) {
      return {
        type: 'close',
        options: {item: node.stackItem, ctx}
      };
    }
  },
  TORNADO_REFERENCE(node, ctx) {
    ctx.pushInstruction(new Instruction('insert', {key: node[1].key, item: node.stackItem, ctx}));
  },
  TORNADO_COMMENT(node, ctx) {
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, ctx}));
  },
  HTML_ELEMENT: {
    enter(node, ctx) {
      return {
        type: 'open',
        options: {key: node[1].tag_info.key, item: node.stackItem, ctx}
      };
    },
    leave(node, ctx){
      var item = node.stackItem;
      item.state = item.previousState;
      return {
        type: 'close',
        options: {item, ctx}
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter(node, ctx) {
      return {
        type: 'open',
        options: {item: node.stackItem, ctx}
      };
    },
    leave(node, ctx) {
      return {
        type: 'close',
        options: {item: node.stackItem, ctx}
      };
    }
  },
  HTML_COMMENT(node, ctx) {
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, ctx}));
  },
  PLAIN_TEXT(node, ctx) {
    ctx.pushInstruction(new Instruction('insert', {item: node.stackItem, ctx}));
  }
};

let buildInstructions = {
  instructionDefs: {},
  addInstruction(name, instruction) {
    if (typeof instruction === 'function') {
      this.instructionDefs[name] = instruction;
    } else {
      let instructionDef = {
        enter: instruction.enter ? (node, ctx) => {
          let enter = instruction.enter(node, ctx);
          ctx.pushInstruction(new Instruction(enter.type, enter.options));
        } : null,
        leave: instruction.leave ? (node, ctx) => {
          let leave = instruction.leave(node, ctx);
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
    let walker = visitor.build(this.instructionDefs);
    return function(ast, options) {
      return walker(ast, options.context);
    };
  }
};

buildInstructions.addInstructions(instructionDefs);

export default buildInstructions;
