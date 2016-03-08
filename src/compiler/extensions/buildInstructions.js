'use strict';

import visitor from '../visitor';
import Instruction from '../utils/Instruction';

let instructionDefs = {
  TORNADO_PARTIAL: {
    enter(item, ctx) {
      return {
        type: 'insert',
        options: {key: item.node[1].key, item, ctx}
      };
    }
  },
  TORNADO_BODY: {
    enter(item, ctx) {
      return {
        type: 'open',
        options: {key: item.node[1].key, item, ctx}
      };
    },
    leave(item, ctx) {
      return {
        type: 'close',
        options: {item, ctx}
      };
    }
  },
  TORNADO_REFERENCE: {
    enter(item, ctx) {
      return {
        type: 'insert',
        options: {key: item.node[1].key, item, ctx}
      };
    }
  },
  TORNADO_COMMENT: {
    enter(item, ctx) {
      return {
        type: 'insert',
        options: {item, ctx}
      };
    }
  },
  HTML_ELEMENT: {
    enter(item, ctx) {
      return {
        type: 'open',
        options: {key: item.node[1].tag_info.key, item, ctx}
      };
    },
    leave(item, ctx){
      item.state = item.previousState;
      return {
        type: 'close',
        options: {item, ctx}
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter(item, ctx) {
      return {
        type: 'open',
        options: {item, ctx}
      };
    },
    leave(item, ctx) {
      return {
        type: 'close',
        options: {item, ctx}
      };
    }
  },
  HTML_COMMENT: {
    enter(item, ctx) {
      return {
        type: 'insert',
        options: {item, ctx}
      };
    }
  },
  PLAIN_TEXT: {
    enter(item, ctx) {
      return {
        type: 'insert',
        options: {item, ctx}
      };
    }
  }
};

let buildInstructions = {
  instructionDefs: {},
  addInstruction(name, instruction) {
    let instructionDef = {
      enter: instruction.enter ? (item, ctx) => {
        let enter = instruction.enter(item, ctx);
        ctx.pushInstruction(new Instruction(enter.type, enter.options));
      } : null,
      leave: instruction.leave ? (item, ctx) => {
        let leave = instruction.leave(item, ctx);
        ctx.pushInstruction(new Instruction(leave.type, leave.options));
      } : null
    };
    this.instructionDefs[name] = instructionDef;
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
