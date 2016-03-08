"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var Instruction = _interopRequire(require("../utils/Instruction"));

var instructionDefs = {
  TORNADO_PARTIAL: {
    enter: function enter(item, ctx) {
      return {
        type: "insert",
        options: { key: item.node[1].key, item: item, ctx: ctx }
      };
    }
  },
  TORNADO_BODY: {
    enter: function enter(item, ctx) {
      return {
        type: "open",
        options: { key: item.node[1].key, item: item, ctx: ctx }
      };
    },
    leave: function leave(item, ctx) {
      return {
        type: "close",
        options: { item: item, ctx: ctx }
      };
    }
  },
  TORNADO_REFERENCE: {
    enter: function enter(item, ctx) {
      return {
        type: "insert",
        options: { key: item.node[1].key, item: item, ctx: ctx }
      };
    }
  },
  TORNADO_COMMENT: {
    enter: function enter(item, ctx) {
      return {
        type: "insert",
        options: { item: item, ctx: ctx }
      };
    }
  },
  HTML_ELEMENT: {
    enter: function enter(item, ctx) {
      return {
        type: "open",
        options: { key: item.node[1].tag_info.key, item: item, ctx: ctx }
      };
    },
    leave: function leave(item, ctx) {
      item.state = item.previousState;
      return {
        type: "close",
        options: { item: item, ctx: ctx }
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(item, ctx) {
      return {
        type: "open",
        options: { item: item, ctx: ctx }
      };
    },
    leave: function leave(item, ctx) {
      return {
        type: "close",
        options: { item: item, ctx: ctx }
      };
    }
  },
  HTML_COMMENT: {
    enter: function enter(item, ctx) {
      return {
        type: "insert",
        options: { item: item, ctx: ctx }
      };
    }
  },
  PLAIN_TEXT: {
    enter: function enter(item, ctx) {
      return {
        type: "insert",
        options: { item: item, ctx: ctx }
      };
    }
  }
};

var buildInstructions = {
  instructionDefs: {},
  addInstruction: function addInstruction(name, instruction) {
    var instructionDef = {
      enter: instruction.enter ? function (item, ctx) {
        var enter = instruction.enter(item, ctx);
        ctx.pushInstruction(new Instruction(enter.type, enter.options));
      } : null,
      leave: instruction.leave ? function (item, ctx) {
        var leave = instruction.leave(item, ctx);
        ctx.pushInstruction(new Instruction(leave.type, leave.options));
      } : null
    };
    this.instructionDefs[name] = instructionDef;
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