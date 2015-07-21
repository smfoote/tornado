"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

var generator = _interopRequire(require("../codeGenerator"));

var flush = function flush(results) {
  results.code = "(function(){\nvar frags = {},\n  template = {\n    " + results.code.fragments.join(",\n    ") + ",\n    " + results.code.renderers.join(",\n    ") + "\n  };\n  template.render = template.r0;\n  td." + util.getTdMethodName("register") + "(\"" + results.name + "\", template);\n  return template;\n})();";
};

var postprocess = function postprocess(ast, options) {
  var results = options.results;
  var symbolsMap = options.results.instructions.symbolsMap;
  var codeGenerator = generator.build(symbolsMap);
  codeGenerator(options.results.instructions, options.results.code);

  if (results) {
    flush(results);
  }
};

module.exports = postprocess;
//# sourceMappingURL=postprocess.js.map