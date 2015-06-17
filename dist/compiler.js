"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Context = _interopRequire(require("./compiler/context"));

var escapableRaw = _interopRequire(require("./compiler/passes/escapableRaw"));

var htmlEntities = _interopRequire(require("./compiler/passes/htmlEntities"));

var adjustAttrs = _interopRequire(require("./compiler/passes/adjustAttrs"));

var buildInstructions = _interopRequire(require("./compiler/passes/buildInstructions"));

var generateJS = _interopRequire(require("./compiler/passes/generateJS"));

var postprocess = _interopRequire(require("./compiler/passes/postprocess"));

// import visualize from './compiler/passes/visualize';

var defaultPasses = [[], // checks
[escapableRaw, htmlEntities, adjustAttrs], // transforms
[buildInstructions], // generates
[generateJS, postprocess] // codegen
];
var compiler = {
  compile: function compile(ast, name, options) {
    var passes = undefined;

    if (options && options.passes) {
      passes = options.passes;
      // merge defaults into passes
      for (var key in defaultPasses) {
        if (defaultPasses.hasOwnProperty(key) && !passes.hasOwnProperty(key)) {
          passes[key] = defaultPasses[key];
        }
      }
    } else {
      passes = defaultPasses;
    }
    var results = {
      name: name,
      instructions: []
    };
    passes.forEach(function (stage) {
      stage.forEach(function (pass) {
        var context = new Context(results);
        pass(ast, { results: results, context: context });
      });
    });
    return results.code;
  }
};

module.exports = compiler;
//# sourceMappingURL=compiler.js.map