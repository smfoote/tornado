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
      htmlBodiesIndexes: [],
      htmlBodiesCount: -1,
      refCount: 0,
      blocks: {},
      state: STATES.OUTER_SPACE
    };
    this.fragments = `f${this.context.tornadoBodiesIndex}: function() {
      var frag = document.createDocumentFragment();
      var cache = {frag: frag}\n`;
    this.renderers = `r${this.context.tornadoBodiesIndex}: function(c) {
      var root = frags.frag${this.context.tornadoBodiesIndex} || this.f${this.context.tornadoBodiesIndex}();\n`;
    this.walk(ast);
    return `(function(){
  "use strict";
  var frags = {},
  t = {
    ${this.fragments}
    ${this.renderers}
    render: null
  };
  t.render = t.r0;
  td.register("${name}", t);
  return t;
})();`;
  },
  step(node) {
    if (node[0] && this[node[0]]) {
      return this[node[0]](node);
    }
  },
  walk(nodes = []) {
    nodes.forEach((n) => this.step(n));
    this.fragments = `${this.fragments}      return cache;
    },`;
    this.renderers = `${this.renderers}      return root.frag;\n    },`;
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
  /**
   * Walk through the contents of an HTML element
   */
  walkContents(nodes = []) {
    var indexes = this.context.htmlBodiesIndexes;
    nodes.forEach((n) => {
      this.step(n);
      indexes[indexes.length-1]++;
    });
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
      if (hasRef) {
        this.renderers = `${this.renderers}      root.ref${refCount}.setAttribute('${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
      } else {
        this.fragments = `${this.fragments}      el${this.context.htmlBodiesCount}.setAttribute('${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
      }
    });
    this.context.state = previousState;
    return attrs;
  },
  getElContainerName() {
    let count = this.context.htmlBodiesCount;
    if (this.context.state === STATES.OUTER_SPACE || count === -1) {
      return 'frag';
    } else {
      return `el${count}`;
    }
  },
  TORNADO_BODY(node) {
    this.context.nextTdBody = node[1].body;
    return '';
  },
  TORNADO_REFERENCE(node) {
    let indexes = this.context.htmlBodiesIndexes;
    let idx = indexes[indexes.length - 1]++ || 0;
    let refCount = this.context.refCount++;
    let containerName = this.getElContainerName();
    if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments = `${this.fragments}      cache.ref${refCount} = ${containerName};
      ${this.getElContainerName()}.appendChild(document.createComment(''));\n`;
      this.renderers = `${this.renderers}      root.ref${refCount}.replaceChildAtIdx(${idx}, document.createTextNode(td.get(c, ${JSON.stringify(node[1].key)})));\n`;
    } else if (this.context.state === STATES.HTML_ATTRIBUTE) {
      this.fragments = `${this.fragments}      cache.ref${refCount} = ${containerName};\n`;
      return `td.get(c, ${JSON.stringify(node[1].key)})`;
    }
  },
  HTML_ELEMENT(node) {
    let nodeInfo = node[1].tag_info;
    let nodeContents = node[1].tag_contents;
    this.context.state = STATES.HTML_BODY;
    this.context.htmlBodiesIndexes.push(0);
    let count = ++this.context.htmlBodiesCount;
    this.fragments = `${this.fragments}      var el${count} = document.createElement("${nodeInfo.key}");\n`;
    this.buildElementAttributes(nodeInfo.attributes);
    this.walkContents(nodeContents);
    this.context.htmlBodiesIndexes.pop();
    this.context.htmlBodiesCount--;
    this.fragments = `${this.fragments}      ${this.getElContainerName()}.appendChild(el${this.context.htmlBodiesCount+1});\n`;
  },
  PLAIN_TEXT(node) {
    if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return '\'' + node[1] + '\'';
    } else if (this.context.state === STATES.HTML_BODY) {
      this.fragments = `${this.fragments}      ${this.getElContainerName()}.appendChild(document.createTextNode('${node[1]}'));\n`;
    }
  }
};

module.exports = compiler;
