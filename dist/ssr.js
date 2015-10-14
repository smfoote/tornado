"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var simpleDom = _interopRequire(require("simple-dom"));

global.document = new simpleDom.Document();

Object.defineProperty(simpleDom.Element.prototype, "innerHTML", {
  get: function get() {
    var serializer = new simpleDom.HTMLSerializer(simpleDom.voidMap);
    return this.firstChild ? serializer.serialize(this.firstChild) : "";
  }
});

simpleDom.Node.prototype.replaceChild = function (newNode, oldNode) {
  this.insertBefore(newNode, oldNode);
  this.removeChild(oldNode);
};

var tdSSR = {
  render: function render(template, context) {
    var frag = template.render(context);
    var outer = document.createElement("div");
    outer.appendChild(frag);
    return outer.innerHTML;
  }
};

module.exports = tdSSR;
//# sourceMappingURL=ssr.js.map