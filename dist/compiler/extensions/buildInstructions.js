"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var Instruction = _interopRequire(require("../utils/Instruction"));

var FrameStack = _interopRequire(require("../utils/FrameStack"));

var instructionDefs = {
  TEMPLATE: function TEMPLATE(node, ctx, fs) {
    fs.reset();
  },
  TORNADO_PARTIAL: function TORNADO_PARTIAL(node, ctx, fs) {
    // we are not creating a new tdBody for partials
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, frameStack: fs.current(), ctx: ctx }));
  },
  TORNADO_BODY: {
    enter: function enter(node, ctx, fs) {
      if (node[1].body && node[1].body.length) {
        fs.pushTd();
      }
      return {
        type: "open",
        options: { key: node[1].key, item: node.stackItem, frameStack: fs.current(), ctx: ctx }
      };
    },
    leave: function leave(node, ctx, fs) {
      var prev = fs.current();
      if (node[1].body && node[1].body.length) {
        fs.popTd();
      }
      return {
        type: "close",
        options: { item: node.stackItem, frameStack: prev, ctx: ctx }
      };
    }
  },
  TORNADO_REFERENCE: function TORNADO_REFERENCE(node, ctx, fs) {
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, frameStack: fs.current(), ctx: ctx }));
  },
  TORNADO_COMMENT: function TORNADO_COMMENT(node, ctx, fs) {
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: fs.current(), ctx: ctx }));
  },
  HTML_ELEMENT: {
    enter: function enter(node, ctx, fs) {
      fs.pushEl();
      return {
        type: "open",
        options: { key: node[1].tag_info.key, item: node.stackItem, frameStack: fs.current(), ctx: ctx }
      };
    },
    leave: function leave(node, ctx, fs) {
      var item = node.stackItem;
      item.state = item.previousState;
      var prev = fs.current();
      fs.popEl();
      return {
        type: "close",
        options: { item: item, frameStack: prev, ctx: ctx }
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(node, ctx, fs) {
      return {
        type: "open",
        options: { item: node.stackItem, frameStack: fs.current(), ctx: ctx }
      };
    },
    leave: function leave(node, ctx, fs) {
      return {
        type: "close",
        options: { item: node.stackItem, frameStack: fs.current(), ctx: ctx }
      };
    }
  },
  HTML_COMMENT: function HTML_COMMENT(node, ctx, fs) {
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: fs.current(), ctx: ctx }));
  },
  PLAIN_TEXT: function PLAIN_TEXT(node, ctx, fs) {
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: fs.current(), ctx: ctx }));
  }
};

var buildInstructions = {
  instructionDefs: {},
  addInstruction: function addInstruction(name, instruction) {
    if (typeof instruction === "function") {
      this.instructionDefs[name] = instruction;
    } else {
      var instructionDef = {
        enter: instruction.enter ? function () {
          var ctx = arguments[1];
          var enter = instruction.enter.apply(null, arguments);
          ctx.pushInstruction(new Instruction(enter.type, enter.options));
        } : null,
        leave: instruction.leave ? function () {
          var ctx = arguments[1];
          var leave = instruction.leave.apply(null, arguments);
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
    var frameStack = new FrameStack();
    var walker = visitor.build(this.instructionDefs);
    return function (ast, options) {
      return walker(ast, options.context, frameStack);
    };
  }
};

buildInstructions.addInstructions(instructionDefs);

module.exports = buildInstructions;
//# sourceMappingURL=buildInstructions.js.map