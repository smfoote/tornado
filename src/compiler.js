const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};
let elIndex = -1;
let compiler = {
  compile(ast, name) {
    this.context = {
      tornadoBodies: [{parentIndex: null}],
      tornadoBodiesCurrentIndex: 0,
      htmlBodies: [{count: -1, htmlBodiesIndexes: [0]}],
      refCount: 0,
      blocks: {},
      state: STATES.OUTER_SPACE
    };
    this.fragments = [];
    this.renderers = [];
    this.createMethodHeaders();
    this.walk(ast);
    this.createMethodFooters();
    return `(function(){
  "use strict";
  var frags = {},
  t = {
    ${this.fragments.join(',\n    ')},
    ${this.renderers.join(',\n    ')}
  };
  t.render = t.r0;
  td.register("${name}", t);
  return t;
})();`;
  },
  step(node) {

    if (node[0] && this[node[0]]) {
      let val = this[node[0]](node);
      let indexes = this.context.htmlBodies[this.context.tornadoBodiesCurrentIndex];
      return val;
    }
  },
  walk(nodes = []) {
    nodes.forEach((n) => {
      this.step(n);
      let indexes = this.context.htmlBodies[this.context.tornadoBodiesCurrentIndex].htmlBodiesIndexes;
      indexes[indexes.length - 1]++;
    });
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
    let refCount = this.context.refCount;
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
        this.renderers[tdIndex] += `      td.setAttribute(td.getNodeAtIdxPath(root, ${JSON.stringify(indexesClone)}), '${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
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
    return `${this.getElContainerName()}.appendChild(document.createTextNode(''))`;
  },
  TORNADO_PARTIAL(node) {
    let meta = node[1];
    let params = meta.params;
    let context = 'c';
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
    let indexHash = indexes.join('');
    if (params.length === 1 && params[0].key === 'context') {
      context = `td.get(c, ${params[0].val})`;
    }
    if (this.context.state !== STATES.HTML_ATTRIBUTE) {
      this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
      this.renderers[tdIndex] += `      var oldNode${indexHash} = td.getNodeAtIdxPath(root, ${JSON.stringify(indexes)});
      td.replaceNode(oldNode${indexHash}, td.getPartial('${meta.name}', ${context}, this));\n`;
    } else {
      return `td.getPartial('${meta.name}', ${context}, this).then(function(node){return td.nodeToString(node)})`;
    }
  },
  TORNADO_BODY(node) {
    let bodyInfo = node[1];
    let previousState = this.context.state;
    let createMethods = !!bodyInfo.body.length;
    let methodName, blockName, blockIndex;

    if (bodyInfo.type === 'block' || bodyInfo.type === 'inlinePartial') {
      blockName = bodyInfo.key.join('.');
      methodName = `_${bodyInfo.type.substring(0,1)}_${blockName}`;
    }

    if (bodyInfo.type === 'block') {
      let blocks = this.context.blocks;
      if (blocks.hasOwnProperty(blockName)) {
        blockIndex = ++blocks[blockName];
      } else {
        blockIndex = blocks[blockName] = 0;
      }
      bodyInfo.blockIndex = blockIndex;
      bodyInfo.blockName = blockName;
      methodName += blockIndex;
    }

    // Set up the body in the parent fragment and renderer
    let renderVal = this.tornadoBodies[bodyInfo.type].bind(this)(bodyInfo);

    if (createMethods) {
      // Build the fragment and renderer, then walk the bodies.
      this.context.tornadoBodies.push({parentIndex: this.context.tornadoBodiesCurrentIndex});
      let tdIndex = this.context.tornadoBodiesCurrentIndex = this.context.tornadoBodies.length - 1;
      this.context.refCount++;
      this.context.htmlBodies.push({count: -1, htmlBodiesIndexes: [0]});

      // Open the functions
      this.createMethodHeaders(methodName);

      this.context.state = STATES.OUTER_SPACE;
      this.walk(bodyInfo.body);
      this.context.state = previousState;

      if (bodyInfo.bodies) {
        bodyInfo.bodies.forEach((body) => this.TORNADO_BODY(body));
      }

      // Close the functions
      this.createMethodFooters();
      this.context.tornadoBodiesCurrentIndex = this.context.tornadoBodies[tdIndex].parentIndex;
    }
    return renderVal;
  },
  TORNADO_REFERENCE(node) {
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
    let indexHash = indexes.join('');
    let refCount = this.context.refCount++;
    let containerName = this.getElContainerName();
    if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
      this.renderers[tdIndex] += `      var oldNode${indexHash} = td.getNodeAtIdxPath(root, ${JSON.stringify(indexes)});
      td.replaceNode(oldNode${indexHash}, td.createTextNode(td.get(c, ${JSON.stringify(node[1].key)})));\n`;
    } else if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return `td.get(c, ${JSON.stringify(node[1].key)})`;
    }
  },
  HTML_ELEMENT(node) {
    let nodeInfo = node[1].tag_info;
    let nodeContents = node[1].tag_contents;
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let previousState = this.context.state;
    this.setHTMLElementState(nodeInfo);
    let isNamespaceRoot = nodeInfo.attributes.some(attr => attr.attrName === 'xmlns');
    let namespace = this.context.namespace ? `, '${this.context.namespace}'` : '';
    this.context.htmlBodies[tdIndex].htmlBodiesIndexes.push(0);
    let count = ++this.context.htmlBodies[tdIndex].count;
    this.fragments[tdIndex] += `      var el${count} = td.createElement('${nodeInfo.key}'${namespace});\n`;
    this.buildElementAttributes(nodeInfo.key, nodeInfo.attributes);
    this.walk(nodeContents);
    this.context.htmlBodies[tdIndex].htmlBodiesIndexes.pop();
    this.context.htmlBodies[tdIndex].count--;
    this.context.state = previousState;
    if (isNamespaceRoot) {
      this.context.namespace = null;
    }
    if (this.context.state === STATES.ESCAPABLE_RAW) {
      this.fragments[tdIndex] += `      el${this.context.htmlBodies[tdIndex].count}.defaultValue += td.nodeToString(el${this.context.htmlBodies[tdIndex].count + 1});\n`;
    } else {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(el${this.context.htmlBodies[tdIndex].count + 1});\n`;
    }
  },
  PLAIN_TEXT(node) {
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
    if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return '\'' + node[1] + '\'';
    } else if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(document.createTextNode('${node[1].replace(/'/g, "\\'")}'));\n`;
    } else if (this.context.state === STATES.ESCAPABLE_RAW) {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.defaultValue += '${node[1].replace(/'/g, "\\'")}';\n`;
    }
  },
  tornadoBodies: {
    exists(node, reverse) {
      let refCount = this.context.refCount;
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let maxTdIndex = this.context.tornadoBodies.length - 1;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let indexHash = indexes.join('');
      let containerName = this.getElContainerName();
      let hasElseBody = (node.bodies.length === 1 && node.bodies[0][1].name === 'else');
      if (this.context.state !== STATES.HTML_ATTRIBUTE) {
        let primaryBody = reverse ? `.catch(function(err) {
        td.replaceNode(oldNode${indexHash}, this.r${maxTdIndex + 1}(c));
        throw(err);
      }.bind(this))` :
        `.then(function() {
        td.replaceNode(oldNode${indexHash}, this.r${maxTdIndex + 1}(c));
      }.bind(this))`;
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      var oldNode${indexHash} = td.getNodeAtIdxPath(root, ${JSON.stringify(indexes)});
      td.exists(td.get(c, ${JSON.stringify(node.key)}))${primaryBody}`;
        if (hasElseBody) {
          let elseBody = reverse ? `.then(function() {
        td.replaceNode(oldNode${indexHash}, this.r${maxTdIndex + 2}(c));
      }.bind(this))` :
          `.catch(function(err) {
        td.replaceNode(oldNode${indexHash}, this.r${maxTdIndex + 2}(c));
        throw(err);
      }.bind(this))`;
          this.renderers[tdIndex] += `\n      ${elseBody};\n`;
        } else {
          this.renderers[tdIndex] += ';\n';
        }
      } else {
        let primaryBody = reverse ? `.catch(function() {
      return td.nodeToString(this.r${maxTdIndex + 1}(c));
    }.bind(this))` :
    `.then(function() {
      return td.nodeToString(this.r${maxTdIndex + 1}(c));
    }.bind(this))`;

        let returnVal = `td.exists(td.get(c, ${JSON.stringify(node.key)}))${primaryBody}`;
        if (hasElseBody) {
          let elseBody = reverse ? `.then(function() {
      return td.nodeToString(this.r${maxTdIndex + 2}(c));
    }.bind(this))` :
          `.catch(function() {
      return td.nodeToString(this.r${maxTdIndex + 2}(c));
    }.bind(this))`;
          returnVal += elseBody;
        }
        return returnVal;
      }
    },

    notExists(node) {
      return this.tornadoBodies.exists.bind(this)(node, true);
    },

    section(node) {
      let maxTdIndex = this.context.tornadoBodies.length - 1;
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let indexHash = indexes.join('');
      let hasElseBody = (node.bodies.length === 1 && node.bodies[0][1].name === 'else');
      let isInHtmlAttribute = (this.context.state === STATES.HTML_ATTRIBUTE);
      let tdBodyIncrease = 1;
      let beforeLoop, loopAction, afterLoop, notArrayAction, elseBodyAction;
      if (isInHtmlAttribute) {
        beforeLoop = 'var attrs = [];';
        loopAction = `attrs.push(td.nodeToString(this.r${maxTdIndex + tdBodyIncrease}(item)));`;
        afterLoop = `return Promise.all(attrs).then(function(vals) {
            return vals.join('');
          });`;
        notArrayAction = `return td.nodeToString(this.r${maxTdIndex + 1}(val));`;
        elseBodyAction = `return td.nodeToString(this.r${maxTdIndex + 2}(c));`;
      } else {
        beforeLoop = 'let frag = document.createDocumentFragment();';
        loopAction = `frag.appendChild(this.r${maxTdIndex+1}(item));`;
        afterLoop = `td.replaceNode(oldNode${indexHash}, frag);`;
        notArrayAction = `td.replaceNode(oldNode${indexHash}, this.r${maxTdIndex + 1}(val))`;
        elseBodyAction = `td.replaceNode(oldNode${indexHash}, this.r${maxTdIndex + 2}(c))`;
      }

      let output = `td.exists(td.get(c, ${JSON.stringify(node.key)})).then(function(val) {
        if (Array.isArray(val)) {
          ${beforeLoop}
          for (var i=0, item; item=val[i]; i++) {
            ${loopAction}
          }
          ${afterLoop}
        } else {
          ${notArrayAction}
        }
      }.bind(this))`;

      if (hasElseBody) {
        output += `.catch(function(err) {
          ${elseBodyAction};
        }.bind(this))`;
      }

      if (isInHtmlAttribute) {
        return output;
      } else {
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      var oldNode${indexHash} = td.getNodeAtIdxPath(root, ${JSON.stringify(indexes)});
      ${output};\n`;
      }
    },

    block(node) {
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let indexHash = indexes.join('');
      if (this.context.state !== STATES.HTML_ATTRIBUTE) {
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      var oldNode${indexHash} = td.getNodeAtIdxPath(root, ${JSON.stringify(indexes)});
      td.replaceNode(oldNode${indexHash}, td.block('${node.blockName}', ${node.blockIndex}, c, this));\n`;
      } else {
        return `td.nodeToString(td.block('${node.blockName}', ${node.blockIndex}, c, this))`;
      }
    },

    inlinePartial(node) {},

    bodies() {}
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
  createMethodHeaders(name) {
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    name = name || tdIndex;
    this.fragments[tdIndex] = `f${name}: function() {
      var frag = document.createDocumentFragment();\n`;
    this.renderers[tdIndex] = `r${name}: function(c) {
      var root = frags.frag${name} || this.f${name}();
      root = root.cloneNode(true);\n`;
  },
  createMethodFooters(name) {
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    name = name || tdIndex;
    this.fragments[tdIndex] += `      frags.frag${name} = frag;
      return frag;
    }`;
    this.renderers[tdIndex] += `      return root;
    }`;
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
    return attrName
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

module.exports = compiler;
