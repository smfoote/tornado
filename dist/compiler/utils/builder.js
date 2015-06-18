"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
//TODO: instead of using helper methods this should be an API that does things.
var STATES = {
  OUTER_SPACE: "OUTER_SPACE",
  HTML_TAG: "HTML_TAG",
  HTML_BODY: "HTML_BODY",
  HTML_ELEMENT: "HTML_BODY",
  HTML_ATTRIBUTE: "HTML_ATTRIBUTE",
  ESCAPABLE_RAW: "ESCAPABLE_RAW",
  TORNADO_TAG: "TORNADO_TAG",
  TORNADO_BODY: "TORNADO_BODY"
};
exports.STATES = STATES;
var methodNameMap = {
  register: "r",
  get: "g",
  createDocumentFragment: "f",
  createTextNode: "c",
  createElement: "m",
  setAttribute: "s",
  getPartial: "p",
  replaceNode: "n",
  exists: "e",
  helper: "h",
  block: "b",
  getNodeAtIdxPath: "i",
  nodeToString: "t"
};
var PRODUCTION = "production";
var mode = "dev"; //TODO: this should be an option in the compiler

exports["default"] = {
  /**
   * Return a method name based on whether we are compiling for production or dev
   * @param {String} fullName The full name of the method
   * @return {String} Return the shortened alias name or the fullName
   */
  getTdMethodName: function getTdMethodName(fullName) {
    if (mode === PRODUCTION) {
      return methodNameMap[fullName];
    } else {
      return fullName;
    }
  },

  /**
   * Adjust an attribute's name as necessary (e.g. SVG cares about case)
   * @param {String} elType The element's tag name
   * @param {String} attrName The attribute's name before adjustment
   * @return {String} The adjusted attribute name (or the given attribute name if no adjustment
   * is needed)
   */
  adjustAttrName: function adjustAttrName(elType, attrName, ctx) {
    if (ctx.namespace) {
      attrName = this.svgAdjustAttrs[attrName] || attrName;
    }
    return attrName;
  },

  elTypes: {
    escapableRaw: ["textarea", "title"]
  }
};
//# sourceMappingURL=builder.js.map