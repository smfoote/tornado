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
  buildElementAttributes(attributes = []) {
    let attrs = '';
    let previousState = this.context.state;
    let refCount = this.context.refCount;
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let indexesClone = this.context.htmlBodies[tdIndex].htmlBodiesIndexes.slice(0);
    indexesClone.pop();
    this.context.state = STATES.HTML_ATTRIBUTE;
    attributes.forEach((attr) => {
      let hasRef = attr.value && attr.value.some(function(val) {
        let type = val[0]
        return type === 'TORNADO_REFERENCE' || type === 'TORNADO_BODY' || type === 'TORNADO_PARTIAL';
      });
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
    if (params.length === 1 && params[0].key === 'context') {
      context = `td.get(c, ${params[0].val})`;
    }
    if (this.context.state !== STATES.HTML_ATTRIBUTE) {
      this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
      this.renderers[tdIndex] += `      td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, td.getPartial('${meta.name}', ${context}, this));\n`;
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
    let refCount = this.context.refCount++;
    let containerName = this.getElContainerName();
    if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
      this.renderers[tdIndex] += `      td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, td.createTextNode(td.get(c, ${JSON.stringify(node[1].key)})));\n`;
    } else if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return `td.get(c, ${JSON.stringify(node[1].key)})`;
    }
  },
  HTML_ELEMENT(node) {
    let nodeInfo = node[1].tag_info;
    let nodeContents = node[1].tag_contents;
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let previousState = this.context.state;
    if (this.elTypes.escapableRaw.indexOf(nodeInfo.key) > -1) {
      this.context.state = STATES.ESCAPABLE_RAW;
    } else {
      this.context.state = STATES.HTML_BODY;
    }
    this.context.htmlBodies[tdIndex].htmlBodiesIndexes.push(0);
    let count = ++this.context.htmlBodies[tdIndex].count;
    this.fragments[tdIndex] += `      var el${count} = document.createElement("${nodeInfo.key}");\n`;
    this.buildElementAttributes(nodeInfo.attributes);
    this.walk(nodeContents);
    this.context.htmlBodies[tdIndex].htmlBodiesIndexes.pop();
    this.context.htmlBodies[tdIndex].count--;
    this.context.state = previousState;
    if (this.context.state === STATES.ESCAPABLE_RAW) {
      this.fragments[tdIndex] += `      el${this.context.htmlBodies[tdIndex].count}.defaultValue += td.nodeToString(el${this.context.htmlBodies[tdIndex].count + 1});\n`
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
      let containerName = this.getElContainerName();
      let hasElseBody = (node.bodies.length === 1 && node.bodies[0][1].name === 'else');
      if (this.context.state !== STATES.HTML_ATTRIBUTE) {
        let primaryBody = reverse ? `.catch(function(err) {
        td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${maxTdIndex + 1}(c));
        throw(err);
      }.bind(this))` :
        `.then(function() {
        td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${maxTdIndex + 1}(c));
      }.bind(this))`;
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      td.exists(td.get(c, ${JSON.stringify(node.key)}))${primaryBody}`;
        if (hasElseBody) {
          let elseBody = reverse ? `.then(function() {
        td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${maxTdIndex + 2}(c));
      }.bind(this))` :
          `.catch(function(err) {
        td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${maxTdIndex + 2}(c));
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
    }.bind(this))`
          returnVal += elseBody;
        }
        return returnVal;
      }
    },

    notExists(node) {
      return this.tornadoBodies.exists.bind(this)(node, true);
    },

    section(node) {
      let refCount = this.context.refCount;
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let maxTdIndex = this.context.tornadoBodies.length - 1;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let containerName = this.getElContainerName();
      let hasElseBody = (node.bodies.length === 1 && node.bodies[0][1].name === 'else');
      let isInHtmlAttribute = (this.context.state === STATES.HTML_ATTRIBUTE);
      let initAttrs = '';
      let returnAttrs = '';
      function action(contextName, tdBodyIncrease, inArray) {
        let finalIndexIncrease = inArray ? '+(2*i)' : '';
        if (isInHtmlAttribute) {
          let innerAction = `td.nodeToString(this.r${maxTdIndex + tdBodyIncrease}(${contextName}))`;
          if (inArray) {
            return `attrs.push(${innerAction});`;
          } else {
            return `return ${innerAction};`
          }
        } else {
          return `td.replaceChildAtIdxPath(root, [${indexes.join(',')}${finalIndexIncrease}], this.r${maxTdIndex + tdBodyIncrease}(${contextName}))`;
        }
      }

      if (isInHtmlAttribute) {
        initAttrs = '\n          var attrs = [];';
        returnAttrs = `\n          return Promise.all(attrs).then(function(vals) {
            return vals.join('');
          });`;
      }

      let output = `td.exists(td.get(c, ${JSON.stringify(node.key)})).then(function(val) {
        if (Array.isArray(val)) {${initAttrs}
          for (var i=0, item; item=val[i]; i++) {
            ${action('item', 1, true)};
          }${returnAttrs}
        } else {
          ${action('val', 1)};
        }
      }.bind(this))`;

      if (hasElseBody) {
        output += `.catch(function(err) {
          ${action('c', 2)};
        }.bind(this))`;
      }

      if (isInHtmlAttribute) {
        return output;
      } else {
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      ${output};\n`;
      }
    },

    block(node) {
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      if (this.context.state !== STATES.HTML_ATTRIBUTE) {
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, td.block('${node.blockName}', ${node.blockIndex}, c, this));\n`;
      } else {
        return `td.nodeToString(td.block('${node.blockName}', ${node.blockIndex}, c, this))`;
      }
    },

    inlinePartial(node) {},

    bodies() {}
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
    name = name || tdIndex
    this.fragments[tdIndex] += `      frags.frag${name} = frag;
      return frag;
    }`;
    this.renderers[tdIndex] += `      return root;
    }`;
  },

  elTypes: {
    escapableRaw: ['textarea', 'title']
  }
};

module.exports = compiler;
