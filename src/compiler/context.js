// import util from './utils/builder';
const STATES = {
  OUTER_SPACE: 'OUTER_SPACE',
  HTML_TAG: 'HTML_TAG',
  HTML_BODY: 'HTML_BODY',
  HTML_ATTRIBUTE: 'HTML_ATTRIBUTE',
  ESCAPABLE_RAW: 'ESCAPABLE_RAW',
  TORNADO_TAG: 'TORNADO_TAG',
  TORNADO_BODY: 'TORNADO_BODY'
};

let Context = function(results) {
  let stack = [{indexPath: []}];
  // let refCount;
  let tornadoBodiesPointer = -1;
  let htmlElementPointer = 0;
  const defaultState = STATES.OUTER_SPACE;

  let context = {
    blocks: {},
    state: defaultState,
    getCurrentTdBody() {
      return tornadoBodiesPointer;
    },
    getElContainerName() {
      return htmlElementPointer ? `el${htmlElementPointer}` : 'frag';
    },
    incrementCurrentTdBody() {
      tornadoBodiesPointer++;
    },
    decrementCurrentTdBody() {
      tornadoBodiesPointer--;
    },
    incrementHtmlEl() {
      htmlElementPointer++;
    },
    decrementHtmlEl() {
      htmlElementPointer--;
    },
    pushInstruction(instruction) {
      results.instructions.push(instruction);
    },
    stack: {
      push(node, index, method) {
        let nodeType = node[0];
        let parentIndexPath = this.stack.peak('indexPath');
        let isTornadoBody = (nodeType === 'TORNADO_BODY');
        let indexPath = parentIndexPath.slice(0);
        if (isTornadoBody) {
          indexPath = [];
          this.incrementCurrentTdBody();
        } else {
          indexPath.push(index);
        }
        let stackItem = {
          node,
          nodeType,
          indexPath,
          tdBody: this.getCurrentTdBody(),
          parentNodeName: this.getElContainerName()
        };
        stack.push(stackItem);
        method(stackItem, this);
        if (nodeType === 'HTML_ELEMENT') {
          this.incrementHtmlEl();
        }
      },
      pop(method) {
        let stackItem = stack.pop();
        let nodeType = stackItem.nodeType;
        method(stackItem, this);
        if (nodeType === 'TORNADO_BODY') {
          this.decrementCurrentTdBody();
        } else if (nodeType === 'HTML_ELEMENT') {
          this.decrementHtmlEl();
        }
      },
      peak(prop) {
        let len = stack.length;
        let topItem = stack[len - 1];
        if (!prop) {
          return topItem;
        }
        return topItem[prop] || false;
      }
    }
  };

  // Give Context.stack the same prototype as Context.
  context.stack = Object.assign(Object.create(context), context.stack);

  return context;

  // this.currentIdx = function() {
  //   return tornadoBodiesPointer;
  // };
  // this.setIdx = function(i) {
  //  tornadoBodiesPointer = i;
  //  return i;
  // };
  //
  // this.tornadoBodies = {
  //   exists(node, reverse) {
  //     let tdIndex = tornadoBodiesPointer;
  //     let maxTdIndex = this.tdBodies.length - 1;
  //     let indexes = this.htmlBodies[tdIndex].htmlBodiesIndexes;
  //     let indexHash = indexes.join('');
  //     let hasElseBody = (node.bodies.length === 1 && node.bodies[0][1].name === 'else');
  //     if (this.state !== STATES.HTML_ATTRIBUTE) {
  //       let primaryBody = reverse ? `.catch(function(err) {
  //       td.${util.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 1}(c));
  //       throw(err);
  //     }.bind(this))` :
  //       `.then(function() {
  //       td.${util.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 1}(c));
  //     }.bind(this))`;
  //       this.append(null, `      ${util.createPlaceholder(this)};\n`, null);
  //       this.append(null, null, `      var on${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
  //     td.${util.getTdMethodName('exists')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(node.key)}))${primaryBody}`);
  //       if (hasElseBody) {
  //         let elseBody = reverse ? `.then(function() {
  //       td.${util.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 2}(c));
  //     }.bind(this))` :
  //         `.catch(function(err) {
  //       td.${util.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 2}(c));
  //       throw(err);
  //     }.bind(this))`;
  //         this.append(null, null, `\n      ${elseBody};\n`);
  //       } else {
  //         this.append(null, null, ';\n');
  //       }
  //     } else {
  //       let primaryBody = reverse ? `.catch(function() {
  //     return td.${util.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 1}(c));
  //   }.bind(this))` :
  //   `.then(function() {
  //     return td.${util.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 1}(c));
  //   }.bind(this))`;
  //
  //       let returnVal = `td.${util.getTdMethodName('exists')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(node.key)}))${primaryBody}`;
  //       if (hasElseBody) {
  //         let elseBody = reverse ? `.then(function() {
  //     return td.${util.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 2}(c));
  //   }.bind(this))` :
  //         `.catch(function() {
  //     return td.${util.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 2}(c));
  //   }.bind(this))`;
  //         returnVal += elseBody;
  //       }
  //       return returnVal;
  //     }
  //   },
  //
  //   notExists(node) {
  //     return this.tornadoBodies.exists.bind(this)(node, true);
  //   },
  //
  //   section(node) {
  //     let maxTdIndex = this.tdBodies.length - 1;
  //     let tdIndex = tornadoBodiesPointer;
  //     let indexes = this.htmlBodies[tdIndex].htmlBodiesIndexes;
  //     let indexHash = indexes.join('');
  //     let hasElseBody = (node.bodies.length === 1 && node.bodies[0][1].name === 'else');
  //     let isInHtmlAttribute = (this.state === STATES.HTML_ATTRIBUTE);
  //     let tdBodyIncrease = 1;
  //     let beforeLoop, loopAction, afterLoop, notArrayAction, elseBodyAction;
  //     if (isInHtmlAttribute) {
  //       beforeLoop = 'var attrs = [];';
  //       loopAction = `attrs.push(td.${util.getTdMethodName('nodeToString')}(this.r${maxTdIndex + tdBodyIncrease}(item)));`;
  //       afterLoop = `return Promise.all(attrs).then(function(vals) {
  //           return vals.join('');
  //         });`;
  //       notArrayAction = `return td.${util.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 1}(val));`;
  //       elseBodyAction = `return td.${util.getTdMethodName('nodeToString')}(this.r${maxTdIndex + 2}(c));`;
  //     } else {
  //       beforeLoop = `var frag = td.${util.getTdMethodName('createDocumentFragment')}();`;
  //       loopAction = `frag.appendChild(this.r${maxTdIndex + 1}(item));`;
  //       afterLoop = `td.${util.getTdMethodName('replaceNode')}(on${indexHash}, frag);`;
  //       notArrayAction = `td.${util.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 1}(val))`;
  //       elseBodyAction = `td.${util.getTdMethodName('replaceNode')}(on${indexHash}, this.r${maxTdIndex + 2}(c))`;
  //     }
  //
  //     let output = `td.${util.getTdMethodName('exists')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(node.key)})).then(function(val) {
  //       if (Array.isArray(val)) {
  //         ${beforeLoop}
  //         for (var i=0, item; item=val[i]; i++) {
  //           ${loopAction}
  //         }
  //         ${afterLoop}
  //       } else {
  //         ${notArrayAction}
  //       }
  //     }.bind(this))`;
  //
  //     if (hasElseBody) {
  //       output += `.catch(function(err) {
  //         ${elseBodyAction};
  //       }.bind(this))`;
  //     }
  //
  //     if (isInHtmlAttribute) {
  //       return output;
  //     } else {
  //       this.append(null, `      ${util.createPlaceholder(this)};\n`, null);
  //       this.append(null, null, `      var on${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
  //     ${output};\n`);
  //     }
  //   },
  //
  //   helper(node) {
  //     let maxTdIndex = this.tdBodies.length - 1;
  //     let tdIndex = tornadoBodiesPointer;
  //     let indexes = this.htmlBodies[tdIndex].htmlBodiesIndexes;
  //     let indexHash = indexes.join('');
  //     let paramsHash, bodiesHash;
  //     paramsHash = node.params.reduce((acc, param) => {
  //       let paramVal = param.val;
  //       if (Array.isArray(paramVal)) {
  //         paramVal = `td.${util.getTdMethodName('get')}(c, ${JSON.stringify(paramVal[1].key)})`;
  //       } else {
  //         paramVal = `'${paramVal}'`;
  //       }
  //       acc.push(`${param.key}: ${paramVal}`);
  //       return acc;
  //     }, []);
  //     paramsHash = `{${paramsHash.join(',')}}`;
  //     bodiesHash = node.bodies.reduce((acc, body, idx) => {
  //       let bodyName = body[1].name;
  //       acc.push(`${bodyName}: this.r${maxTdIndex + idx + 2}.bind(this)`);
  //       return acc;
  //     }, []);
  //     if (node.body.length) {
  //       bodiesHash.push(`main: this.r${maxTdIndex + 1}.bind(this)`);
  //     }
  //     bodiesHash = `{${bodiesHash.join(',')}}`;
  //     if (this.state !== STATES.HTML_ATTRIBUTE) {
  //       this.append(null, `      ${util.createPlaceholder(this)};\n`,
  //                         `      var on${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
  //       td.${util.getTdMethodName('helper')}('${node.key.join('')}', c, ${paramsHash}, ${bodiesHash}).then(function(val) {
  //         td.${util.getTdMethodName('replaceNode')}(on${indexHash}, val);
  //       });\n`);
  //     }
  //   },
  //
  //   block(node) {
  //     let tdIndex = tornadoBodiesPointer;
  //     let indexes = this.htmlBodies[tdIndex].htmlBodiesIndexes;
  //     let indexHash = indexes.join('');
  //     if (this.state !== STATES.HTML_ATTRIBUTE) {
  //       this.append(null, `      ${util.createPlaceholder(this)};\n`, null);
  //       this.append(null, null, `      var on${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
  //     td.${util.getTdMethodName('replaceNode')}(on${indexHash}, td.${util.getTdMethodName('block')}('${node.blockName}', ${node.blockIndex}, c, this));\n`);
  //     } else {
  //       return `td.${util.getTdMethodName('nodeToString')}(td.${util.getTdMethodName('block')}('${node.blockName}', ${node.blockIndex}, c, this))`;
  //     }
  //   },
  //
  //   inlinePartial(node) {
  //     console.log(node);
  //   },
  //   bodies(node) {
  //     console.log(node);
  //   }
  // };
};

export default Context;
