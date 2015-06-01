//TODO: instead of using helper methods this should be an API that does things.
export const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};
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
   * Walk through the attributes of an HTML element
   */
  walkAttrs(items = []) {
    let res = [];
    // TODO: fix this
    items.forEach((item) => {
      if (item[0] === 'PLAIN_TEXT') {
        res.push('\'' + item[1] + '\'');
      }
    });
    res = res.length ? res : ['\'\''];
    return `[${res.join(',')}]`;
  },
  buildElementAttributes(elType, attributes = [], ctx) {
    let attrs = '';
    let previousState = ctx.state;
    let tdIndex = ctx.currentIdx();
    let indexesClone = ctx.htmlBodies[tdIndex].htmlBodiesIndexes.slice(0);
    indexesClone.pop();
    ctx.state = STATES.HTML_ATTRIBUTE;
    attributes.forEach((attr) => {
      let hasRef = attr.value && attr.value.some(function(val) {
        let type = val[0];
        return type === 'TORNADO_REFERENCE' || type === 'TORNADO_BODY' || type === 'TORNADO_PARTIAL';
      });
      attr.attrName = this.adjustAttrName(elType, attr.attrName, ctx);
      if (hasRef) {
        ctx.append(null, null,`      td.${this.getTdMethodName('setAttribute')}(td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexesClone)}), '${attr.attrName}', ${this.walkAttrs(attr.value)});\n`);
      } else {
        ctx.append(null, `      el${ctx.htmlBodies[tdIndex].count}.setAttribute('${attr.attrName}', ${this.walkAttrs(attr.value)});\n`, null);
      }
    });
    ctx.state = previousState;
    return attrs;
  },
  getElContainerName(ctx) {
    let count = ctx.htmlBodies[ctx.currentIdx()].count;
    if (ctx.state === STATES.OUTER_SPACE || count === -1) {
      return 'frag';
    } else {
      return `el${count}`;
    }
  },
  createPlaceholder(ctx) {
    return `${this.getElContainerName(ctx)}.appendChild(td.${this.getTdMethodName('createTextNode')}(''))`;
  },

  setHTMLElementState(nodeInfo, ctx) {
    if (this.elTypes.escapableRaw.indexOf(nodeInfo.key) > -1) {
      ctx.state = STATES.ESCAPABLE_RAW;
    } else {
      ctx.state = STATES.HTML_BODY;
    }
    let namespace = nodeInfo.attributes.filter(attr => attr.attrName === 'xmlns');

    // namespace values cannot be dynamic.
    if (namespace.length) {
      ctx.namespace = namespace[0].value[0][1];
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
