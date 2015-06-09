'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let generator = {
  build(fns) {
    let execute = function(instruction, code) {
      let {action, nodeType} = instruction;
      if (fns[`${action}_${nodeType}`]) {
        fns[`${action}_${nodeType}`](instruction, code);
      }
    };

    let walk = function(instructions=[], code) {
      instructions.forEach((instruction) => {
        execute.apply(null, [instruction, code]);
      });
    };

    return walk;
  }
};

export default generator;
