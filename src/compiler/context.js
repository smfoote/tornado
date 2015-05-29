const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};
const PRODUCTION = 'production';

let Context = function(results) {
  let refCount;
  let mode = 'dev';
  let tornadoBodiesPointer;
  const defaultState = STATES.OUTER_SPACE;
  const methodNameMap = {
    register: 'r',
    get: 'g',
    createDocumentFragment: 'f',
    createTextNode: 'c',
    createElement: 'm',
    setAttribute: 's',
    getPartial: 'p',
    replaceNode: 'n',
    exists: 'e',
    helper: 'h',
    block: 'b',
    getNodeAtIdxPath: 'i',
    nodeToString: 't'
  };

  /**
   * Return a method name based on whether we are compiling for production or dev
   * @param {String} fullName The full name of the method
   * @return {String} Return the shortened alias name or the fullName
   */
  this.getTdMethodName = function(fullName) {
    if (mode === PRODUCTION) {
      return methodNameMap[fullName];
    } else {
      return fullName;
    }
  };


  let init = function() {
    refCount = 0;
    this.htmlBodies = [];
    this.tornadoBodies = [];
    tornadoBodiesPointer = this.tornadoBodies.length;
    this.state = defaultState;
  };
  let pushFragment = function(fragment, append){
    if (append) {
      results.fragments[tornadoBodiesPointer] += fragment;
    } else {
      results.fragments[tornadoBodiesPointer] = fragment;
    }
  };
  let pushRenderer = function(renderer, append){
    if (append) {
      results.renderers[tornadoBodiesPointer] += renderer;
    } else {
      results.renderers[tornadoBodiesPointer] = renderer;
    }
  };
  this.push = function(name, f, r) {
    let tdIndex = tornadoBodiesPointer;
    name = name || tdIndex;
    pushFragment(f);
    pushRenderer(r);
  };
  this.append = function(name, f, r) {
    let tdIndex = tornadoBodiesPointer;
    name = name || tdIndex;
    pushFragment(f, true);
    pushRenderer(r, true);
  };
  this.currentIdx = function() {
    return tornadoBodiesPointer;
  };

  init.call(this, [results]);
};


export default Context;
