"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var util = _interopRequire(require("../utils/builder"));

var createMethodHeaders = function createMethodHeaders(name, context) {
  name = name || context.currentIdx();
  var f = "f" + name + ": function() {\n    var frag = td." + util.getTdMethodName("createDocumentFragment") + "();\n";
  var r = "r" + name + ": function(c) {\n    var root = frags.frag" + name + " || this.f" + name + "();\n    root = root.cloneNode(true);\n";
  context.push(name, f, r);
};
exports.createMethodHeaders = createMethodHeaders;
var preprocess = function preprocess(ast, options) {
  var context = options.context;
  if (context) {
    // do some initialization stuff
    context.tdBodies.push({ parentIndex: null });
    context.htmlBodies.push({ count: -1, htmlBodiesIndexes: [0] });
    createMethodHeaders(null, context);
  }
};

exports["default"] = preprocess;
//# sourceMappingURL=preprocess.js.map