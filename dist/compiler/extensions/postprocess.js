"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("../utils/builder"));

var flush = function flush(results) {
  var templateVars = [];
  if (results.extensions && results.extensions.templateVars) {
    templateVars = results.extensions.templateVars;
  }
  results.code = "(function(){\nvar frags = {},\n  " + templateVars.join("\n  ") + "\n  template = {\n    " + results.code.fragments.join(",\n    ") + ",\n    " + results.code.renderers.join(",\n    ") + "\n  };\n  template.render = template.r0;\n  td." + util.getTdMethodName("register") + "(\"" + results.name + "\", template);\n  return template;\n})();";
};

var postprocess = function postprocess(results) {
  if (results) {
    flush(results);
  }
};

module.exports = postprocess;
//# sourceMappingURL=postprocess.js.map