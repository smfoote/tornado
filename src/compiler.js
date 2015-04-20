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
      elsWithRefs: [],
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
      this[node[0]](node);
    }
  },
  walk(nodes = []) {
    nodes.forEach((n) => this.step(n));
    this.fragments = `${this.fragments}      return cache;
  },\n`;
    this.renderers = `${this.renderers}      return root.frag;\n    },`;
  },
  walkContents(nodes = []) {
    var indexes = this.context.htmlBodiesIndexes;
    nodes.forEach((n) => {
      this.step(n);
      console.log(`indexes before: ${JSON.stringify(indexes)}`);
      indexes[indexes.length-1]++;
      console.log(`indexes after: ${JSON.stringify(indexes)}`);
    });
  },
  buildElementAttributes(attributes = []) {
    let attrs = '';
    let previousState = this.context.state;
    this.context.state = STATES.HTML_ATTRIBUTE;
    for (let attr of attributes) {
      attrs += `el${this.context.htmlBodiesCount}.setAttribute('${attr.attrName}', '${this.walk(attr.value)}');`;
    }
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
    let idx = indexes[indexes.length - 1]++;
    let refCount = this.context.refCount++;
    if (this.context.state === STATES.HTML_BODY) {
      let containerName = this.getElContainerName();
      this.fragments = `${this.fragments}      cache.ref${refCount} = ${containerName};
      ${this.getElContainerName()}.appendChild(document.createComment(''));\n`;
      this.renderers = `${this.renderers}      root.ref${refCount}.replaceChildAtIdx(${idx}, document.createTextNode(td.get(c, ${JSON.stringify(node[1].key)})));\n`;
    }
  },
  HTML_ELEMENT(node) {
    let nodeInfo = node[1].tag_info;
    let nodeContents = node[1].tag_contents;
    this.context.state = STATES.HTML_BODY;
    this.context.htmlBodiesIndexes.push(0);
    let count = ++this.context.htmlBodiesCount;
    console.log(nodeInfo.key);
    console.log(JSON.stringify(this.context.htmlBodiesIndexes));
    this.fragments = `${this.fragments}      var el${count} = document.createElement("${nodeInfo.key}");${this.buildElementAttributes(nodeInfo.attributes)}\n`;
    this.walkContents(nodeContents);
    this.context.htmlBodiesIndexes.pop();
    this.context.htmlBodiesCount--;
    this.fragments = `${this.fragments}      ${this.getElContainerName()}.appendChild(el${this.context.htmlBodiesCount+1});\n`;
  },
  PLAIN_TEXT(node) {
    if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return node[1];
    } else if (this.context.state === STATES.HTML_BODY) {
      this.fragments = `${this.fragments}      ${this.getElContainerName()}.appendChild(document.createTextNode('${node[1]}'));\n`;
    }
  }
};

module.exports = compiler;
