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
    this.fragments = [`f${this.context.tornadoBodiesIndex}: function() {
      var frag = document.createDocumentFragment();
      var cache = {frag: frag};\n`];
    this.renderers = [`r${this.context.tornadoBodiesIndex}: function(c) {
      var root = frags.frag${this.context.tornadoBodiesIndex} || this.f${this.context.tornadoBodiesIndex}();\n`];
    this.walk(ast);
    this.fragments[this.context.tornadoBodiesIndex] += `      return cache;
    }`;
    this.renderers[this.context.tornadoBodiesIndex] += `      return root.frag;
    }`;
    return `(function(){
  "use strict";
  var frags = {},
  t = {
    ${this.fragments.join(',')},
    ${this.renderers.join(',')}
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
        let tdIndex = this.context.tornadoBodiesIndex;
        this.renderers[tdIndex] += `      root.ref${refCount}.setAttribute('${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
      } else {
        this.fragments[tdIndex] += `      el${this.context.htmlBodiesCount}.setAttribute('${attr.attrName}', ${this.walkAttrs(attr.value)});\n`;
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
    // console.log(node);
    let bodyInfo = node[1];

    // Set up the body in the parent fragment and renderer
    this.tornadoBodies[bodyInfo.type].bind(this)(bodyInfo);

    // Build the fragment and renderer, then walk the bodies.
    this.context.tornadoBodiesIndex++;
    this.context.refCount++;
    let tdIndex = this.context.tornadoBodiesIndex;

    // Open the functions
    this.fragments[tdIndex] = `f${this.context.tornadoBodiesIndex}: function() {
      var frag = document.createDocumentFragment();
      var cache = {frag: frag}\n`;
    this.renderers[tdIndex] = `r${this.context.tornadoBodiesIndex}: function(c) {
      var root = frags.frag${this.context.tornadoBodiesIndex} || this.f${this.context.tornadoBodiesIndex}();\n`;

    // Walk the bodies
    this.walk(bodyInfo.body);

    // Close the functions
    this.fragments[this.context.tornadoBodiesIndex] += `      return cache;
    }`;
    this.renderers[this.context.tornadoBodiesIndex] += `      return root.frag;
    }`;
    this.context.tornadoBodiesIndex--;
  },
  TORNADO_REFERENCE(node) {
    let indexes = this.context.htmlBodiesIndexes;
    let idx = indexes[indexes.length - 1]++ || 0;
    let refCount = this.context.refCount++;
    let containerName = this.getElContainerName();
    let tdIndex = this.context.tornadoBodiesIndex;
    if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      cache.ref${refCount} = ${containerName};
      ${containerName}.appendChild(document.createComment(''));\n`;
      this.renderers[tdIndex] += `      root.ref${refCount}.replaceChildAtIdx(${idx}, document.createTextNode(td.get(c, ${JSON.stringify(node[1].key)})));\n`;
    } else if (this.context.state === STATES.HTML_ATTRIBUTE) {
      this.fragments[tdIndex] += `      cache.ref${refCount} = ${containerName};\n`;
      return `td.get(c, ${JSON.stringify(node[1].key)})`;
    }
  },
  HTML_ELEMENT(node) {
    let nodeInfo = node[1].tag_info;
    let nodeContents = node[1].tag_contents;
    let tdIndex = this.context.tornadoBodiesIndex;
    this.context.state = STATES.HTML_BODY;
    this.context.htmlBodiesIndexes.push(0);
    let count = ++this.context.htmlBodiesCount;
    this.fragments[tdIndex] += `      var el${count} = document.createElement("${nodeInfo.key}");\n`;
    this.buildElementAttributes(nodeInfo.attributes);
    this.walkContents(nodeContents);
    this.context.htmlBodiesIndexes.pop();
    this.context.htmlBodiesCount--;
    this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(el${this.context.htmlBodiesCount+1});\n`;
  },
  PLAIN_TEXT(node) {
    let tdIndex = this.context.tornadoBodiesIndex;
    if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return '\'' + node[1] + '\'';
    } else if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(document.createTextNode('${node[1]}'));\n`;
    }
  },
  tornadoBodies: {
    exists(node) {
      let refCount = this.context.refCount;
      let indexes = this.context.htmlBodiesIndexes;
      let idx = indexes[indexes.length - 1]++ || 0;
      let tdIndex = this.context.tornadoBodiesIndex;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      cache.ref${refCount} = ${containerName};
      ${containerName}.appendChild(document.createComment(''));\n`;
      this.renderers[tdIndex] += `      if(td.exists(c, ${JSON.stringify(node.key)})){
        root.ref${refCount}.replaceChildAtIdx(${idx}, this.r${tdIndex + 1}(c));
      }\n`;
    },

    notExists(node) {
      let refCount = this.context.refCount;
      let indexes = this.context.htmlBodiesIndexes;
      let idx = indexes[indexes.length - 1]++ || 0;
      let tdIndex = this.context.tornadoBodiesIndex;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      cache.ref${refCount} = ${containerName};
      ${containerName}.appendChild(document.createComment(''));\n`;
      this.renderers[tdIndex] += `      if(!td.exists(c, ${JSON.stringify(node.key)})){
        root.ref${refCount}.replaceChildAtIdx(${idx}, this.r${tdIndex + 1}(c));
      }\n`;
    },

    section(node) {
      let refCount = this.context.refCount;
      let indexes = this.context.htmlBodiesIndexes;
      let idx = indexes[indexes.length - 1]++ || 0;
      let tdIndex = this.context.tornadoBodiesIndex;
      let containerName = this.getElContainerName();
      this.fragments[tdIndex] += `      cache.ref${refCount} = ${containerName};
      ${containerName}.appendChild(document.createComment(''));\n`;
      this.renderers[tdIndex] += `      var list = td.get(c, ${JSON.stringify(node.key)});
      for (var i=0, item; item=list[i]; i++) {
        root.ref${refCount}.replaceChildAtIdx((${idx} + i), this.r${tdIndex + 1}(c));
      }\n`;
    }
  }
};

module.exports = compiler;
