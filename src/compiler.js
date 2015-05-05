const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};
let elIndex = -1;
let compiler = {
  compile(ast, name) {
    this.context = {
      tornadoBodiesIndex: 0,
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
      let indexes = this.context.htmlBodies[this.context.tornadoBodiesIndex];
      return val;
    }
  },
  walk(nodes = []) {
    nodes.forEach((n) => {
      this.step(n);
      let indexes = this.context.htmlBodies[this.context.tornadoBodiesIndex].htmlBodiesIndexes;
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
    let tdIndex = this.context.tornadoBodiesIndex;
    let indexesClone = this.context.htmlBodies[tdIndex].htmlBodiesIndexes.slice(0);
    indexesClone.pop();
    this.context.state = STATES.HTML_ATTRIBUTE;
    attributes.forEach((attr) => {
      let hasRef = attr.value && attr.value.some(function(val) {
        return val[0] === 'TORNADO_REFERENCE';
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
    let count = this.context.htmlBodies[this.context.tornadoBodiesIndex].count;
    if (this.context.state === STATES.OUTER_SPACE || count === -1) {
      return 'frag';
    } else {
      return `el${count}`;
    }
  },
  TORNADO_PARTIAL(node) {
    let meta = node[1];
    let params = meta.params;
    let context = 'c';
    let tdIndex = this.context.tornadoBodiesIndex;
    let indexes = this.context.htmlBodies[this.context.tornadoBodiesIndex].htmlBodiesIndexes;
    if (params.length === 1 && params[0].key === 'context') {
      context = `td.get(c, ${params[0].val})`;
    }
    this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(document.createTextNode(''));\n`;
    this.renderers[tdIndex] += `      td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, td.getPartial('${meta.name}', ${context}));\n`;
  },
  TORNADO_BODY(node) {
    let bodyInfo = node[1];

    // Set up the body in the parent fragment and renderer
    this.tornadoBodies[bodyInfo.type].bind(this)(bodyInfo);

    // Build the fragment and renderer, then walk the bodies.
    this.context.tornadoBodiesIndex++;
    this.context.refCount++;
    this.context.htmlBodies.push({count: -1, htmlBodiesIndexes: [0]});
    let tdIndex = this.context.tornadoBodiesIndex;

    // Open the functions
    this.createMethodHeaders();

    // Walk the body
    this.walk(bodyInfo.body);

    if (bodyInfo.bodies) {
      bodyInfo.bodies.forEach((body) => this.TORNADO_BODY(body));
    }

    // Close the functions
    this.createMethodFooters();
    this.context.tornadoBodiesIndex--;
  },
  TORNADO_REFERENCE(node) {
    let indexes = this.context.htmlBodies[this.context.tornadoBodiesIndex].htmlBodiesIndexes;
    let refCount = this.context.refCount++;
    let containerName = this.getElContainerName();
    let tdIndex = this.context.tornadoBodiesIndex;
    if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${containerName}.appendChild(document.createTextNode(''));\n`;
      this.renderers[tdIndex] += `      td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, td.createTextNode(td.get(c, ${JSON.stringify(node[1].key)})));\n`;
    } else if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return `td.get(c, ${JSON.stringify(node[1].key)})`;
    }
  },
  HTML_ELEMENT(node) {
    let nodeInfo = node[1].tag_info;
    let nodeContents = node[1].tag_contents;
    let tdIndex = this.context.tornadoBodiesIndex;
    this.context.state = STATES.HTML_BODY;
    this.context.htmlBodies[tdIndex].htmlBodiesIndexes.push(0);
    let count = ++this.context.htmlBodies[tdIndex].count;
    this.fragments[tdIndex] += `      var el${count} = document.createElement("${nodeInfo.key}");\n`;
    this.buildElementAttributes(nodeInfo.attributes);
    this.walk(nodeContents);
    this.context.htmlBodies[tdIndex].htmlBodiesIndexes.pop();
    this.context.htmlBodies[tdIndex].count--;
    this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(el${this.context.htmlBodies[tdIndex].count+1});\n`;
  },
  PLAIN_TEXT(node) {
    let tdIndex = this.context.tornadoBodiesIndex;
    let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
    if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return '\'' + node[1] + '\'';
    } else if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(document.createTextNode('${node[1]}'));\n`;
    }
  },
  tornadoBodies: {
    exists(node) {
      let refCount = this.context.refCount;
      let tdIndex = this.context.tornadoBodiesIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      ${containerName}.appendChild(document.createTextNode(''));\n`;
      this.renderers[tdIndex] += `      td.exists(td.get(c, ${JSON.stringify(node.key)})).then(function() {
        td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 1}(c));
      }.bind(this))`;
      if (node.bodies.length === 1 && node.bodies[0][1].name === 'else') {
        this.renderers[tdIndex] += `      .catch(function() {
          td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 2}(c));
        }.bind(this));\n`;
      } else {
        this.renderers[tdIndex] += ';\n';
      }
    },

    notExists(node) {
      let refCount = this.context.refCount;
      let tdIndex = this.context.tornadoBodiesIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      ${containerName}.appendChild(document.createTextNode(''));\n`;
      this.renderers[tdIndex] += `      if(!td.exists(td.get(c, ${JSON.stringify(node.key)}))){
        td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 1}(c));
      }\n`;
      if (node.bodies.length === 1 && node.bodies[0][1].name === 'else') {
        this.renderers[tdIndex] += `      else {
          td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 2}(c));
      }\n`;
      }
    },

    section(node) {
      let refCount = this.context.refCount;
      let tdIndex = this.context.tornadoBodiesIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let containerName = this.getElContainerName();
      let elseReplace = `td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 2}(c));`;
      let arrayElse, sectionElse;
      if (node.bodies.length === 1 && node.bodies[0][1].name === 'else'){
        arrayElse = `\n        if (!sectionVal.length) {
          ${elseReplace}
        }`;
        sectionElse = ` else {
          ${elseReplace}
        }`;
      }
      this.fragments[tdIndex] += `      ${containerName}.appendChild(document.createTextNode(''));\n`;
      this.renderers[tdIndex] += `      var sectionVal = td.get(c, ${JSON.stringify(node.key)});
      if (Array.isArray(sectionVal)) {
        for (var i=0, item; item=sectionVal[i]; i++) {
          td.replaceChildAtIdxPath(root, [${indexes.join(',')}+(2*i)], this.r${tdIndex + 1}(item));
        }${arrayElse}
      } else {
        if (td.exists(sectionVal)) {
          td.replaceChildAtIdxPath(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 1}(sectionVal));
        }${sectionElse}
      }\n`;
    },

    bodies() {}
  },
  createMethodHeaders() {
    let tdIndex = this.context.tornadoBodiesIndex;
    this.fragments[tdIndex] = `f${tdIndex}: function() {
      var frag = document.createDocumentFragment();\n`;
    this.renderers[tdIndex] = `r${tdIndex}: function(c) {
      var root = frags.frag${tdIndex} || this.f${tdIndex}();
      root = root.cloneNode(true);\n`;
  },
  createMethodFooters() {
    let tdIndex = this.context.tornadoBodiesIndex;
    this.fragments[tdIndex] += `      frags.frag${tdIndex} = frag;
      return frag;
    }`;
    this.renderers[this.context.tornadoBodiesIndex] += `      return root;
    }`;
  }
};

module.exports = compiler;
