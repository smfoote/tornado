'use strict';

import visitor from '../visitor';
import Instruction from '../utils/Instruction';

let generateWalker = visitor.build({
  TORNADO_PARTIAL: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', {key: item.node[1].key, item, ctx}));
    }
  },
  TORNADO_BODY: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('open', {key: item.node[1].key, item, ctx}));
    },
    leave(item, ctx) {
      ctx.pushInstruction(new Instruction('close', {item, ctx}));
    }
  },
  TORNADO_DEBUGGER: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', {key: item.node[1].key, item, ctx}));
    }
  },
  TORNADO_REFERENCE: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', {key: item.node[1].key, item, ctx}));
    }
  },
  TORNADO_COMMENT: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', {item, ctx}));
    }
  },
  HTML_ELEMENT: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('open', {key: item.node[1].tag_info.key, item, ctx}));
    },
    leave(item, ctx){
      item.state = item.previousState;
      ctx.pushInstruction(new Instruction('close', {item, ctx}));
    }
  },
  HTML_ATTRIBUTE: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('open', {item, ctx}));
    },
    leave(item, ctx) {
      ctx.pushInstruction(new Instruction('close', {item, ctx}));
    }
  },
  HTML_COMMENT: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', {item, ctx}));
    }
  },
  PLAIN_TEXT: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', {item, ctx}));
    }
  }
});

let generateInstructions = {
  instructions: [function (ast, options) {
    return generateWalker(ast, options.context);
  }]
};

export default generateInstructions;
