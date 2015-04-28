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
    return res.join('+');
  },
  buildElementAttributes(attributes = []) {
    let attrs = '';
    let previousState = this.context.state;
    let refCount = this.context.refCount;
    this.context.state = STATES.HTML_ATTRIBUTE;
    attributes.forEach((attr) => {
      let hasRef = attr.value.some(function(val) {
        return val[0] === 'TORNADO_REFERENCE';
      });
      let tdIndex = this.context.tornadoBodiesIndex;
      if (hasRef) {
        this.renderers[tdIndex] += `      root.ref${refCount}.setAttribute('${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
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
      this.renderers[tdIndex] += `      td.replaceChildAtIdx(root, ${JSON.stringify(indexes)}, document.createTextNode(td.get(c, ${JSON.stringify(node[1].key)})));\n`;
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
      let idx = indexes[indexes.length - 1]++ || 0;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      ${containerName}.appendChild(document.createTextNode(''));\n`;
      this.renderers[tdIndex] += `      if(td.exists(c, ${JSON.stringify(node.key)})){
        td.replaceChildAtIdx(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 1}(c));
      }\n`;
      if (node.bodies.length === 1 && node.bodies[0][1].name === 'else') {
        this.renderers[tdIndex] += `      else {
        td.replaceChildAtIdx(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 2}(c));
      }\n`;
      }
    },

    notExists(node) {
      let refCount = this.context.refCount;
      let tdIndex = this.context.tornadoBodiesIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let idx = indexes[indexes.length - 1]++ || 0;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      ${containerName}.appendChild(document.createTextNode(''));\n`;
      this.renderers[tdIndex] += `      if(!td.exists(c, ${JSON.stringify(node.key)})){
        td.replaceChildAtIdx(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 1}(c));
      }\n`;
      if (node.bodies.length === 1 && node.bodies[0][1].name === 'else') {
        this.renderers[tdIndex] += `      else {
          td.replaceChildAtIdx(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 2}(c));
      }\n`;
      }
    },

    section(node) {
      let refCount = this.context.refCount;
      let tdIndex = this.context.tornadoBodiesIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let idx = indexes[indexes.length - 1]++ || 0;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      ${containerName}.appendChild(document.createTextNode(''));\n`;
      this.renderers[tdIndex] += `      var list = td.get(c, ${JSON.stringify(node.key)});
      for (var i=0, item; item=list[i]; i++) {
        td.replaceChildAtIdx(root, ${JSON.stringify(indexes)}, this.r${tdIndex + 1}(item));
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
