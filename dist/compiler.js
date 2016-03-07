"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Context = _interopRequire(require("./compiler/context"));

var escapableRaw = _interopRequire(require("./compiler/extensions/escapableRaw"));

var builtinHelpers = _interopRequire(require("./compiler/extensions/builtinHelpers"));

var htmlEntities = _interopRequire(require("./compiler/extensions/htmlEntities"));

var adjustAttrs = _interopRequire(require("./compiler/extensions/adjustAttrs"));

var buildInstructions = _interopRequire(require("./compiler/extensions/buildInstructions"));

var generateJS = _interopRequire(require("./compiler/extensions/generateJS"));

var postprocess = _interopRequire(require("./compiler/extensions/postprocess"));

var stages = ["checks", "transforms"];
var compiler = {
  checks: [],
  transforms: [],
  codeGenerator: generateJS,
  postprocessor: postprocess,
  buildInstructions: buildInstructions,
  compile: function compile(ast, name /*, options*/) {
    var _this = this;

    var results = {
      name: name,
      instructions: []
    };
    stages.forEach(function (stage) {
      _this[stage].forEach(function (pass) {
        var context = new Context(results);
        pass(ast, { results: results, context: context });
      });
    });

    // TODO Clean up the instructions pass
    var context = new Context(results);
    this.buildInstructions.pass(ast, { results: results, context: context });
    this.codeGenerator(results);
    this.postprocessor(results);
    return results.code;
  },
  useExtension: function useExtension(extension) {
    var _this = this;

    stages.forEach(function (passType) {
      if (extension.hasOwnProperty(passType) && Array.isArray(extension[passType])) {
        _this[passType] = _this[passType].concat(extension[passType]);
      }
    });
    if (extension.hasOwnProperty("instructions")) {
      var instructions = extension.instructions;
      this.buildInstructions.addInstructions(instructions);
    }
  },
  useExtensions: function useExtensions(extensions) {
    var _this = this;

    extensions.forEach(function (extension) {
      return _this.useExtension(extension);
    });
  },
  useCodeGenerator: function useCodeGenerator(generator) {
    this.codeGenerator = generator;
  },
  ready: function ready() {
    this.buildInstructions.pass = this.buildInstructions.generateInstructions();
  }
};

compiler.useExtensions([builtinHelpers, escapableRaw, htmlEntities, adjustAttrs, buildInstructions]);

module.exports = compiler;
//# sourceMappingURL=compiler.js.map