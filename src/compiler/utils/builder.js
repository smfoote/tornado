//TODO: instead of using helper methods this should be an API that does things.
export const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ELEMENT: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};
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
  },


  elTypes: {
    escapableRaw: ['textarea', 'title']
  },

  /**
   * whether we are in an html_attribute given the current state
   * NOTE: when we see a tornado body previous states are reset.
   * @param {Array} state  the current stateStack
   * @return {Boolean}
   */
  inHtmlAttribute: function(state) {
    let lastTornadoBodyIdx = state.lastIndexOf(STATES.TORNADO_BODY),
        lastHtmlAttributeIdx = state.lastIndexOf(STATES.HTML_ATTRIBUTE);
    return lastHtmlAttributeIdx > lastTornadoBodyIdx;
  },

  /**
   * whether we are in an escapable_raw given the current state
   * NOTE: when we see a tornado body previous states are reset.
   * @param {Array} state  the current stateStack
   * @return {Boolean}
   */
  inEscapableRaw: function(state) {
    let lastTornadoBodyIdx = state.lastIndexOf(STATES.TORNADO_BODY),
        lastEscapableRawIdx = state.lastIndexOf(STATES.ESCAPABLE_RAW);
    return lastEscapableRawIdx > lastTornadoBodyIdx;
  }



};
