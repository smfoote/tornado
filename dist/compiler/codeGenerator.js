"use strict";
/**
 * the visitor pattern so we can map AST to functions
 */

var generator = {
  build: function build(fns) {
    var execute = function execute(instruction, code) {
      var action = instruction.action;
      var nodeType = instruction.nodeType;

      if (fns["" + action + "_" + nodeType]) {
        fns["" + action + "_" + nodeType](instruction, code);
      }
    };

    var walk = function walk(_x, code) {
      var instructions = arguments[0] === undefined ? [] : arguments[0];

      instructions.forEach(function (instruction) {
        execute.apply(null, [instruction, code]);
      });
    };

    return walk;
  }
};

module.exports = generator;
//# sourceMappingURL=codeGenerator.js.map