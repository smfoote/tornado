"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var Instruction = _interopRequire(require("../utils/Instruction"));

var generateWalker = visitor.build({
  TORNADO_PARTIAL: {
    enter: function enter(item, ctx) {
      // let meta = item.node[1];
      // let params = meta.params;
      // if (params.length === 1 && params[0].key === 'context') {
      //   context = `td.${util.getTdMethodName('get')}(c, ${params[0].val})`;
      // }
      ctx.pushInstruction(new Instruction("insert", { key: item.node[1].key, item: item, ctx: ctx }));
    }
  },
  TORNADO_BODY: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("open", { key: item.node[1].key, item: item, ctx: ctx }));
    },
    leave: function leave(item, ctx) {
      ctx.pushInstruction(new Instruction("close", { item: item, ctx: ctx }));
    }
  },
  TORNADO_REFERENCE: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { key: item.node[1].key, item: item, ctx: ctx }));
    }
  },
  TORNADO_COMMENT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { item: item, ctx: ctx }));
    }
  },
  HTML_ELEMENT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("open", { key: item.node[1].tag_info.key, item: item, ctx: ctx }));
    },
    leave: function leave(item, ctx) {
      item.state = item.previousState;
      ctx.pushInstruction(new Instruction("close", { item: item, ctx: ctx }));
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("open", { item: item, ctx: ctx }));
    },
    leave: function leave(item, ctx) {
      ctx.pushInstruction(new Instruction("close", { item: item, ctx: ctx }));
    }
  },
  HTML_COMMENT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { item: item, ctx: ctx }));
    }
  },
  PLAIN_TEXT: {
    enter: function enter(item, ctx) {
      ctx.pushInstruction(new Instruction("insert", { item: item, ctx: ctx }));
    }
  }
});

var generateInstructions = {
  instructions: [function (ast, options) {
    return generateWalker(ast, options.context);
  }]
};

module.exports = generateInstructions;
//# sourceMappingURL=buildInstructions.js.map