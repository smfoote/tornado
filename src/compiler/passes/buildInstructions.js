'use strict';

import visitor from '../visitor';
import Instruction from '../utils/Instruction';

let generateWalker = visitor.build({
  TORNADO_PARTIAL: {
    enter(item, ctx) {
      // let meta = item.node[1];
      // let params = meta.params;
      // if (params.length === 1 && params[0].key === 'context') {
      //   context = `td.${util.getTdMethodName('get')}(c, ${params[0].val})`;
      // }
      ctx.pushInstruction(new Instruction('insert', item, ctx));
    }
  },
  TORNADO_BODY: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('open', item, ctx));
    },
    leave(item, ctx) {
      ctx.pushInstruction(new Instruction('close', item, ctx));
    }
  },
  TORNADO_REFERENCE: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', item, ctx));
    }
  },
  TORNADO_COMMENT: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', item, ctx));
    }
  },
  HTML_ELEMENT: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('open', item, ctx));
    },
    leave(item, ctx){
      ctx.pushInstruction(new Instruction('close', item, ctx));
    }
  },
  HTML_ATTRIBUTE: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('open', item, ctx));
    }
  },
  PLAIN_TEXT: {
    enter(item, ctx) {
      ctx.pushInstruction(new Instruction('insert', item, ctx));
    }
  }
});

let generateInstructions = function (ast, options) {
  return generateWalker(ast, options.context);
};

export default generateInstructions;
