"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var Instruction = _interopRequire(require("../utils/Instruction"));

var instructionDefs = {
  TORNADO_PARTIAL: function TORNADO_PARTIAL(node, ctx) {
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, ctx: ctx }));
  },
  TORNADO_BODY: {
    enter: function enter(node, ctx) {
      return {
        type: "open",
        options: { key: node[1].key, item: node.stackItem, ctx: ctx }
      };
    },
    leave: function leave(node, ctx) {
      return {
        type: "close",
        options: { item: node.stackItem, ctx: ctx }
      };
    }
  },
  TORNADO_REFERENCE: function TORNADO_REFERENCE(node, ctx) {
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, ctx: ctx }));
  },
  TORNADO_COMMENT: function TORNADO_COMMENT(node, ctx) {
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, ctx: ctx }));
  },
  HTML_ELEMENT: {
    enter: function enter(node, ctx) {
      return {
        type: "open",
        options: { key: node[1].tag_info.key, item: node.stackItem, ctx: ctx }
      };
    },
    leave: function leave(node, ctx) {
      var item = node.stackItem;
      item.state = item.previousState;
      return {
        type: "close",
        options: { item: item, ctx: ctx }
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(node, ctx) {
      return {
        type: "open",
        options: { item: node.stackItem, ctx: ctx }
      };
    },
    leave: function leave(node, ctx) {
      return {
        type: "close",
        options: { item: node.stackItem, ctx: ctx }
      };
    }
  },
  HTML_COMMENT: function HTML_COMMENT(node, ctx) {
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, ctx: ctx }));
  },
  PLAIN_TEXT: function PLAIN_TEXT(node, ctx) {
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, ctx: ctx }));
  }
};

var buildInstructions = {
  instructionDefs: {},
  addInstruction: function addInstruction(name, instruction) {
    if (typeof instruction === "function") {
      this.instructionDefs[name] = instruction;
    } else {
      var instructionDef = {
        enter: instruction.enter ? function (node, ctx) {
          var enter = instruction.enter(node, ctx);
          ctx.pushInstruction(new Instruction(enter.type, enter.options));
        } : null,
        leave: instruction.leave ? function (node, ctx) {
          var leave = instruction.leave(node, ctx);
          ctx.pushInstruction(new Instruction(leave.type, leave.options));
        } : null
      };
      this.instructionDefs[name] = instructionDef;
    }
  },
  addInstructions: function addInstructions(instructions) {
    var _this = this;

    Object.keys(instructions).forEach(function (instructionName) {
      _this.addInstruction(instructionName, instructions[instructionName]);
    });
  },
  generateInstructions: function generateInstructions() {
    var walker = visitor.build(this.instructionDefs);
    return function (ast, options) {
      return walker(ast, options.context);
    };
  }
};

buildInstructions.addInstructions(instructionDefs);

module.exports = buildInstructions;
//# sourceMappingURL=buildInstructions.js.map