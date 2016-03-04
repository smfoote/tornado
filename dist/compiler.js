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

var stages = ["checks", "transforms", "instructions"];
var compiler = {
  checks: [],
  transforms: [],
  instructions: [],
  codeGenerator: generateJS,
  postprocessor: postprocess,
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
    // TODO Don't mutate the results object. Have each pass return its result (and consume the
    // previous pass's result) instead.
    this.codeGenerator(results);
    console.log(JSON.stringify(results.instructions, null, 2));
    this.postprocessor(results);
    return results.code;
  },
  useExtension: function useExtension(helper) {
    var _this = this;

    stages.forEach(function (passType) {
      if (helper.hasOwnProperty(passType) && Array.isArray(helper[passType])) {
        _this[passType] = _this[passType].concat(helper[passType]);
      }
    });
  },
  useExtensions: function useExtensions(helpers) {
    var _this = this;

    helpers.forEach(function (helper) {
      return _this.useExtension(helper);
    });
  },
  useCodeGenerator: function useCodeGenerator(generator) {
    this.codeGenerator = generator;
  }
};

compiler.useExtensions([builtinHelpers, escapableRaw, htmlEntities, adjustAttrs, buildInstructions]);

module.exports = compiler;
//# sourceMappingURL=compiler.js.map