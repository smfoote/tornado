"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

var flush = function flush(results) {
  results.code = "(function(){\nvar frags = {},\n  template = {\n    " + results.code.fragments.join(",\n    ") + ",\n    " + results.code.renderers.join(",\n    ") + "\n  };\n  template.render = template.r0;\n  td." + util.getTdMethodName("register") + "(\"" + results.name + "\", template);\n  return template;\n})();";
};

var postprocess = {
  codegen: [function (ast, options) {
    var results = options.results;
    if (results) {
      flush(results);
    }
  }]
};

module.exports = postprocess;
//# sourceMappingURL=postprocess.js.map