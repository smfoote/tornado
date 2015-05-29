'use strict';
import Context from './compiler/context';
let preprocess = require('./compiler/passes/preprocess');
let generateJS = require('./compiler/passes/generate');

const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};

let flush = function(results, context) {
  return `(function(){
var frags = {},
  template = {
    ${results.fragments.join(',\n    ')},
    ${results.renderers.join(',\n    ')}
  };
  template.render = template.r0;
  td.${context.getTdMethodName('register')}("${name}", template);
  return template;
})();`;
};

const defaultPasses = [
  [], // checks
  [], // transforms
  [preprocess] // generates
];
let compiler = {
  compile(ast, name, options) {
    let passes = options && options.passes || defaultPasses;
    let results = {
      fragments: [],
      renderers: []
    };
    let context = new Context(results);
    // this.context = {
      // tornadoBodies: [{parentIndex: null}],
      // tornadoBodiesCurrentIndex: 0,
      // htmlBodies: [{count: -1, htmlBodiesIndexes: [0]}],
      // refCount: 0,
      // blocks: {},
      // state: STATES.OUTER_SPACE
    // };
    this.createMethodHeaders(null, context);
    passes.forEach(stage => {
      stage.forEach(pass =>{
        pass(ast, {results, context});
      });
    });
    this.createMethodFooters(null, context);
    return flush(results, context);
  },
  /**
   * Walk through the attributes of an HTML element
   */
  walkAttrs(items = []) {
    let res = [];
    items.forEach((item) => {
      res.push(this.step(item));
    });
    res = res.length ? res : ['\'\''];
    return `[${res.join(',')}]`;
  },
  buildElementAttributes(elType, attributes = []) {
    let attrs = '';
    let previousState = this.context.state;
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let indexesClone = this.context.htmlBodies[tdIndex].htmlBodiesIndexes.slice(0);
    indexesClone.pop();
    this.context.state = STATES.HTML_ATTRIBUTE;
    attributes.forEach((attr) => {
      let hasRef = attr.value && attr.value.some(function(val) {
        let type = val[0];
        return type === 'TORNADO_REFERENCE' || type === 'TORNADO_BODY' || type === 'TORNADO_PARTIAL';
      });
      attr.attrName = this.adjustAttrName(elType, attr.attrName);
      if (hasRef) {
        this.renderers[tdIndex] += `      td.${this.getTdMethodName('setAttribute')}(td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexesClone)}), '${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
      } else {
        this.fragments[tdIndex] += `      el${this.context.htmlBodies[tdIndex].count}.setAttribute('${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
      }
    });
    this.context.state = previousState;
    return attrs;
  },
  getElContainerName() {
    let count = this.context.htmlBodies[this.context.tornadoBodiesCurrentIndex].count;
    if (this.context.state === STATES.OUTER_SPACE || count === -1) {
      return 'frag';
    } else {
      return `el${count}`;
    }
  },
  createPlaceholder() {
    return `${this.getElContainerName()}.appendChild(td.${this.getTdMethodName('createTextNode')}(''))`;
  },

  setHTMLElementState(nodeInfo) {
    if (this.elTypes.escapableRaw.indexOf(nodeInfo.key) > -1) {
      this.context.state = STATES.ESCAPABLE_RAW;
    } else {
      this.context.state = STATES.HTML_BODY;
    }
    let namespace = nodeInfo.attributes.filter(attr => attr.attrName === 'xmlns');

    // namespace values cannot be dynamic.
    if (namespace.length) {
      this.context.namespace = namespace[0].value[0][1];
    }
  },
  createMethodHeaders(name, context) {
    name = name || context.currentIdx();
    let f = `f${name}: function() {
      var frag = td.${context.getTdMethodName('createDocumentFragment')}();\n`;
    let r = `r${name}: function(c) {
      var root = frags.frag${name} || this.f${name}();
      root = root.cloneNode(true);\n`;
    context.push(name, f, r);
  },
  createMethodFooters(name, context) {
    let f = `      frags.frag${name} = frag;
      return frag;
    }`;
    let r = `      return root;
    }`;
    context.append(name, f, r);
  },

  /**
   * Adjust an attribute's name as necessary (e.g. SVG cares about case)
   * @param {String} elType The element's tag name
   * @param {String} attrName The attribute's name before adjustment
   * @return {String} The adjusted attribute name (or the given attribute name if no adjustment
   * is needed)
   */
  adjustAttrName(elType, attrName) {
    if (this.context.namespace) {
      attrName = this.svgAdjustAttrs[attrName] || attrName;
    }
    return attrName;
  },


  elTypes: {
    escapableRaw: ['textarea', 'title']
  },
  svgAdjustAttrs: {
    'attributename': 'attributeName',
    'attributetype': 'attributeType',
    'basefrequency': 'baseFrequency',
    'baseprofile': 'baseProfile',
    'calcmode': 'calcMode',
    'clippathunits': 'clipPathUnits',
    'diffuseconstant': 'diffuseConstant',
    'edgemode': 'edgeMode',
    'filterunits': 'filterUnits',
    'glyphref': 'glyphRef',
    'gradienttransform': 'gradientTransform',
    'gradientunits': 'gradientUnits',
    'kernelmatrix': 'kernelMatrix',
    'kernelunitlength': 'kernelUnitLength',
    'keypoints': 'keyPoints',
    'keysplines': 'keySplines',
    'keytimes': 'keyTimes',
    'lengthadjust': 'lengthAdjust',
    'limitingconeangle': 'limitingConeAngle',
    'markerheight': 'markerHeight',
    'markerunits': 'markerUnits',
    'markerwidth': 'markerWidth',
    'maskcontentunits': 'maskContentUnits',
    'maskunits': 'maskUnits',
    'numoctaves': 'numOctaves',
    'pathlength': 'pathLength',
    'patterncontentunits': 'patternContentUnits',
    'patterntransform': 'patternTransform',
    'patternunits': 'patternUnits',
    'pointsatx': 'pointsAtX',
    'pointsaty': 'pointsAtY',
    'pointsatz': 'pointsAtZ',
    'preservealpha': 'preserveAlpha',
    'preserveaspectratio': 'preserveAspectRatio',
    'primitiveunits': 'primitiveUnits',
    'refx': 'refX',
    'refy': 'refY',
    'repeatcount': 'repeatCount',
    'repeatdur': 'repeatDur',
    'requiredextensions': 'requiredExtensions',
    'requiredfeatures': 'requiredFeatures',
    'specularconstant': 'specularConstant',
    'specularexponent': 'specularExponent',
    'spreadmethod': 'spreadMethod',
    'startoffset': 'startOffset',
    'stddeviation': 'stdDeviation',
    'stitchtiles': 'stitchTiles',
    'surfacescale': 'surfaceScale',
    'systemlanguage': 'systemLanguage',
    'tablevalues': 'tableValues',
    'targetx': 'targetX',
    'targety': 'targetY',
    'textlength': 'textLength',
    'viewbox': 'viewBox',
    'viewtarget': 'viewTarget',
    'xchannelselector': 'xChannelSelector',
    'ychannelselector': 'yChannelSelector',
    'zoomandpan': 'zoomAndPan'
  }
};

export default compiler;
