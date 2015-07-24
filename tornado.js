"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var parser = _interopRequire(require("./dist/parser"));

var compiler = _interopRequire(require("./dist/compiler"));

var tornado = {
  compile: function compile(templateString, name, options) {
    return compiler.compile(parser.parse(templateString), name, options);
  }
};

module.exports = tornado;
//# sourceMappingURL=tornado.js.map