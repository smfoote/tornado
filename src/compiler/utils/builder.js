//TODO: instead of using helper methods this should be an API that does things.
const methodNameMap = {
  register: 'r',
  get: 'g',
  createDocumentFragment: 'f',
  createTextNode: 't',
  createHTMLComment: 'c',
  createElement: 'm',
  setAttribute: 'a',
  getPartial: 'p',
  replaceNode: 'n',
  exists: 'e',
  helper: 'h',
  block: 'b',
  getNodeAtIdxPath: 'i',
  nodeToString: 's'
};
const PRODUCTION = 'production';
let mode = 'dev'; //TODO: this should be an option in the compiler

export default {
  /**
   * Return a method name based on whether we are compiling for production or dev
   * @param {String} fullName The full name of the method
   * @return {String} Return the shortened alias name or the fullName
   */
  getTdMethodName(fullName) {
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
  adjustAttrName(elType, attrName, ctx) {
    if (ctx.namespace) {
      attrName = this.svgAdjustAttrs[attrName] || attrName;
    }
    return attrName;
  }
};
