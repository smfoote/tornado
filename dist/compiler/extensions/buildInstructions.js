"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitors/visitor"));

var Instruction = _interopRequire(require("../utils/Instruction"));

var FrameStack = _interopRequire(require("../utils/FrameStack"));

function noop() {}

var instructionDefs = {
  TEMPLATE: function TEMPLATE(node, ctx, frameStack) {
    frameStack.reset();
  },
  TORNADO_PARTIAL: function TORNADO_PARTIAL(node, ctx, frameStack) {
    // we are not creating a new tdBody for partials
    var child = undefined,
        parent = undefined;
    frameStack.pushPh();
    child = frameStack.current();
    frameStack.popPh();
    parent = frameStack.current();
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx: ctx }));
  },
  TORNADO_BODY: {
    enter: function enter(node, ctx, frameStack) {
      var parent = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.pushTd();
        frameStack.pushPh();
      }
      var child = frameStack.current();
      return {
        type: "open",
        options: { key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx: ctx }
      };
    },
    leave: function leave(node, ctx, frameStack) {
      var child = frameStack.current();
      if (node[1].body && node[1].body.length) {
        frameStack.popPh();
        frameStack.popTd();
      }
      var parent = frameStack.current();
      return {
        type: "close",
        options: { item: node.stackItem, frameStack: [child, parent], ctx: ctx }
      };
    }
  },
  TORNADO_REFERENCE: function TORNADO_REFERENCE(node, ctx, frameStack) {
    var child = undefined,
        parent = undefined;
    frameStack.pushPh();
    child = frameStack.current();
    frameStack.popPh();
    parent = frameStack.current();
    ctx.pushInstruction(new Instruction("insert", { key: node[1].key, item: node.stackItem, frameStack: [child, parent], ctx: ctx }));
  },
  TORNADO_COMMENT: function TORNADO_COMMENT(node, ctx, frameStack) {
    var child = undefined,
        parent = undefined;
    frameStack.pushPh();
    child = frameStack.current();
    frameStack.popPh();
    parent = frameStack.current();
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: [child, parent], ctx: ctx }));
  },
  HTML_ELEMENT: {
    enter: function enter(node, ctx, frameStack) {
      var parent = frameStack.current();
      frameStack.pushEl();
      var child = frameStack.current();
      return {
        type: "open",
        options: { key: node[1].tag_info.key, item: node.stackItem, frameStack: [child, parent], ctx: ctx }
      };
    },
    leave: function leave(node, ctx, frameStack) {
      var item = node.stackItem;
      item.state = item.previousState;
      var child = frameStack.current();
      frameStack.popEl();
      var parent = frameStack.current();
      return {
        type: "close",
        options: { item: item, frameStack: [child, parent], ctx: ctx }
      };
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(node, ctx, frameStack) {
      var parent = frameStack.current();
      frameStack.pushAttr();
      frameStack.pushPh();
      var child = frameStack.current();
      return {
        type: "open",
        options: { item: node.stackItem, frameStack: [child, parent], ctx: ctx }
      };
    },
    leave: function leave(node, ctx, frameStack) {
      var child = frameStack.current();
      frameStack.popPh();
      frameStack.popAttr();
      var parent = frameStack.current();
      return {
        type: "close",
        options: { item: node.stackItem, frameStack: [child, parent], ctx: ctx }
      };
    }
  },
  HTML_COMMENT: function HTML_COMMENT(node, ctx, frameStack) {
    var child = frameStack.current(),
        parent = child;
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: [child, parent], ctx: ctx }));
  },
  PLAIN_TEXT: function PLAIN_TEXT(node, ctx, frameStack) {
    var child = frameStack.current(),
        parent = child;
    ctx.pushInstruction(new Instruction("insert", { item: node.stackItem, frameStack: [child, parent], ctx: ctx }));
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
        } : noop,
        leave: instruction.leave ? function () {
          var ctx = arguments[1];
          var leave = instruction.leave.apply(null, arguments);
          ctx.pushInstruction(new Instruction(leave.type, leave.options));
        } : noop
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