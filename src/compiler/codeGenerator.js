'use strict';
/**
 * the visitor pattern so we can map AST to functions
 */

let generator = {
  build(fns) {
    let execute = function(instruction, code) {
      let {action} = instruction;
      if (fns[`${action}`]) {
        fns[`${action}`](instruction, code);
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
