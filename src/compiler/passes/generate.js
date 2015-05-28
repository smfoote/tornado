'use strict';
//TODO: remove STATES duliate from ../../compilerjs
const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};

let visitor = require('../visitor');

let generateWalker = visitor.build({
  TORNADO_PARTIAL(node) {
    let meta = node[1];
    let params = meta.params;
    let context = 'c';
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
    let indexHash = indexes.join('');
    if (params.length === 1 && params[0].key === 'context') {
      context = `td.${this.getTdMethodName('get')}(c, ${params[0].val})`;
    }
    if (this.context.state !== STATES.HTML_ATTRIBUTE) {
      this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
      this.renderers[tdIndex] += `      var on${indexHash} = td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
      td.${this.getTdMethodName('replaceNode')}(on${indexHash}, td.${this.getTdMethodName('getPartial')}('${meta.name}', ${context}, this));\n`;
    } else {
      return `td.${this.getTdMethodName('getPartial')}('${meta.name}', ${context}, this).then(function(node){return td.${this.getTdMethodName('nodeToString')}(node)})`;
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
    if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
      this.renderers[tdIndex] += `      var on${indexHash} = td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
      td.${this.getTdMethodName('replaceNode')}(on${indexHash}, td.${this.getTdMethodName('createTextNode')}(td.${this.getTdMethodName('get')}(c, ${JSON.stringify(node[1].key)})));\n`;
    } else if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return `td.${this.getTdMethodName('get')}(c, ${JSON.stringify(node[1].key)})`;
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
    this.fragments[tdIndex] += `      var el${count} = td.${this.getTdMethodName('createElement')}('${nodeInfo.key}'${namespace});\n`;
    this.buildElementAttributes(nodeInfo.key, nodeInfo.attributes);
    this.walk(nodeContents);
    this.context.htmlBodies[tdIndex].htmlBodiesIndexes.pop();
    this.context.htmlBodies[tdIndex].count--;
    this.context.state = previousState;
    if (isNamespaceRoot) {
      this.context.namespace = null;
    }
    if (this.context.state === STATES.ESCAPABLE_RAW) {
      this.fragments[tdIndex] += `      el${this.context.htmlBodies[tdIndex].count}.defaultValue += td.${this.getTdMethodName('nodeToString')}(el${this.context.htmlBodies[tdIndex].count + 1});\n`;
    } else {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(el${this.context.htmlBodies[tdIndex].count + 1});\n`;
    }
  },
  PLAIN_TEXT(node) {
    let tdIndex = this.context.tornadoBodiesCurrentIndex;
    if (this.context.state === STATES.HTML_ATTRIBUTE) {
      return '\'' + node[1] + '\'';
    } else if (this.context.state === STATES.HTML_BODY || this.context.state === STATES.OUTER_SPACE) {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.appendChild(td.${this.getTdMethodName('createTextNode')}('${node[1].replace(/'/g, "\\'")}'));\n`;
    } else if (this.context.state === STATES.ESCAPABLE_RAW) {
      this.fragments[tdIndex] += `      ${this.getElContainerName()}.defaultValue += '${node[1].replace(/'/g, "\\'")}';\n`;
    }
  },
  tornadoBodies: {
    exists(node, reverse) {
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let maxTdIndex = this.context.tornadoBodies.length - 1;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let indexHash = indexes.join('');
      let hasElseBody = (node.bodies.length === 1 && node.bodies[0][1].name === 'else');
      if (this.context.state !== STATES.HTML_ATTRIBUTE) {
        let primaryBody = reverse ? `.catch(function(err) {
        td.${this.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 1}(c));
        throw(err);
      }.bind(this))` :
        `.then(function() {
        td.${this.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 1}(c));
      }.bind(this))`;
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      var on${indexHash} = td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
      td.${this.getTdMethodName('exists')}(td.${this.getTdMethodName('get')}(c, ${JSON.stringify(node.key)}))${primaryBody}`;
        if (hasElseBody) {
          let elseBody = reverse ? `.then(function() {
        td.${this.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 2}(c));
      }.bind(this))` :
          `.catch(function(err) {
        td.${this.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 2}(c));
        throw(err);
      }.bind(this))`;
          this.renderers[tdIndex] += `\n      ${elseBody};\n`;
        } else {
          this.renderers[tdIndex] += ';\n';
        }
      } else {
        let primaryBody = reverse ? `.catch(function() {
      return td.${this.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 1}(c));
    }.bind(this))` :
    `.then(function() {
      return td.${this.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 1}(c));
    }.bind(this))`;

        let returnVal = `td.${this.getTdMethodName('exists')}(td.${this.getTdMethodName('get')}(c, ${JSON.stringify(node.key)}))${primaryBody}`;
        if (hasElseBody) {
          let elseBody = reverse ? `.then(function() {
      return td.${this.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 2}(c));
    }.bind(this))` :
          `.catch(function() {
      return td.${this.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 2}(c));
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
        loopAction = `attrs.push(td.${this.getTdMethodName('nodeToString')}(this.r${maxTdIndex + tdBodyIncrease}(item)));`;
        afterLoop = `return Promise.all(attrs).then(function(vals) {
            return vals.join('');
          });`;
        notArrayAction = `return td.${this.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 1}(val));`;
        elseBodyAction = `return td.${this.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 2}(c));`;
      } else {
        beforeLoop = `var frag = td.${this.getTdMethodName('createDocumentFragment')}();`;
        loopAction = `frag.appendChild(this.r${maxTdIndex + 1}(item));`;
        afterLoop = `td.${this.getTdMethodName('replaceNode')}(on${indexHash}, frag);`;
        notArrayAction = `td.${this.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 1}(val))`;
        elseBodyAction = `td.${this.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 2}(c))`;
      }

      let output = `td.${this.getTdMethodName('exists')}(td.${this.getTdMethodName('get')}(c, ${JSON.stringify(node.key)})).then(function(val) {
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
        this.renderers[tdIndex] += `      var on${indexHash} = td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
      ${output};\n`;
      }
    },

    helper(node) {
      let maxTdIndex = this.context.tornadoBodies.length - 1;
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let indexHash = indexes.join('');
      let paramsHash, bodiesHash;
      paramsHash = node.params.reduce((acc, param) => {
        let paramVal = param.val;
        if (Array.isArray(paramVal)) {
          paramVal = `td.${this.getTdMethodName('get')}(c, ${JSON.stringify(paramVal[1].key)})`;
        } else {
          paramVal = `'${paramVal}'`;
        }
        acc.push(`${param.key}: ${paramVal}`);
        return acc;
      }, []);
      paramsHash = `{${paramsHash.join(',')}}`;
      bodiesHash = node.bodies.reduce((acc, body, idx) => {
        let bodyName = body[1].name;
        acc.push(`${bodyName}: this.r${maxTdIndex + idx + 2}.bind(this)`);
        return acc;
      }, []);
      if (node.body.length) {
        bodiesHash.push(`main: this.r${maxTdIndex + 1}.bind(this)`);
      }
      bodiesHash = `{${bodiesHash.join(',')}}`;
      if (this.context.state !== STATES.HTML_ATTRIBUTE) {
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      var on${indexHash} = td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
        td.${this.getTdMethodName('helper')}('${node.key.join('')}', c, ${paramsHash}, ${bodiesHash}).then(function(val) {
          td.${this.getTdMethodName('replaceNode')}(on${indexHash}, val);
        });\n`;
      }
    },

    block(node) {
      let tdIndex = this.context.tornadoBodiesCurrentIndex;
      let indexes = this.context.htmlBodies[tdIndex].htmlBodiesIndexes;
      let indexHash = indexes.join('');
      if (this.context.state !== STATES.HTML_ATTRIBUTE) {
        this.fragments[tdIndex] += `      ${this.createPlaceholder()};\n`;
        this.renderers[tdIndex] += `      var on${indexHash} = td.${this.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
      td.${this.getTdMethodName('replaceNode')}(on${indexHash}, td.${this.getTdMethodName('block')}('${node.blockName}', ${node.blockIndex}, c, this));\n`;
      } else {
        return `td.${this.getTdMethodName('nodeToString')}(td.${this.getTdMethodName('block')}('${node.blockName}', ${node.blockIndex}, c, this))`;
      }
    },

    inlinePartial(node) {
      console.log(node);
    },
    bodies(node) {
      console.log(node);
    }
  }
});

let generateJavascript = function (ast) {
  return generateWalker(ast);
};

module.exports = generateJavascript;
