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
    var inner = fs.current(),
        outer = inner;
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, frameStack: [inner, outer], ctx: ctx }));
  },
  TORNADO_BODY: {
    enter: function enter(node, ctx, fs) {
      var outer = fs.current();
      if (node[1].body && node[1].body.length) {
        fs.pushTd();
      }
      var inner = fs.current();
      return {
        type: "open",
        options: { key: node[1].key, item: node.stackItem, frameStack: [inner, outer], ctx: ctx }
      };
    },
    leave: function leave(node, ctx, fs) {
      var inner = fs.current();
      if (node[1].body && node[1].body.length) {
        fs.popTd();
      }
      var outer = fs.current();
      return {
        type: "close",
        options: { item: node.stackItem, frameStack: [inner, outer], ctx: ctx }
      };
    }
  },
  TORNADO_REFERENCE: function TORNADO_REFERENCE(node, ctx, fs) {
    var inner = fs.current(),
        outer = inner;
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, frameStack: [inner, outer], ctx: ctx }));
  },
  TORNADO_COMMENT: function TORNADO_COMMENT(node, ctx, fs) {
    var inner = fs.current(),
        outer = inner;
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: [inner, outer], ctx: ctx }));
  },
  HTML_ELEMENT: {
    enter: function enter(node, ctx, fs) {
      var outer = fs.current();
      fs.pushEl();
      var inner = fs.current();
      return {
        type: "open",
        options: { key: node[1].tag_info.key, item: node.stackItem, frameStack: [inner, outer], ctx: ctx }
      };
    },
    leave: function leave(node, ctx, fs) {
      var item = node.stackItem;
      item.state = item.previousState;
      var inner = fs.current();
      fs.popEl();
      var outer = fs.current();
      return {
        type: "close",
        options: { item: item, frameStack: [inner, outer], ctx: ctx }
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(node, ctx, fs) {
      var inner = fs.current(),
          outer = inner;
      return {
        type: "open",
        options: { item: node.stackItem, frameStack: [inner, outer], ctx: ctx }
      };
    },
    leave: function leave(node, ctx, fs) {
      var inner = fs.current(),
          outer = inner;
      return {
        type: "close",
        options: { item: node.stackItem, frameStack: [inner, outer], ctx: ctx }
      };
    }
  },
  HTML_COMMENT: function HTML_COMMENT(node, ctx, fs) {
    var inner = fs.current(),
        outer = inner;
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: [inner, outer], ctx: ctx }));
  },
  PLAIN_TEXT: function PLAIN_TEXT(node, ctx, fs) {
    var inner = fs.current(),
        outer = inner;
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: [inner, outer], ctx: ctx }));
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