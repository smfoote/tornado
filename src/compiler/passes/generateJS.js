/* eslint camelcase: 0 */
'use strict';
import generator from '../codeGenerator';

import util from '../utils/builder';
import {STATES} from '../utils/builder';

let codeGenerator = generator.build({
  insert_TORNADO_PARTIAL(instruction, code) {
    let {indexPath, tdBody} = instruction;
    let context = 'c';
    let indexHash = indexPath.join('');
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${util.createPlaceholder(instruction)};\n`;
      let renderer = `      var on${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexPath)});
      td.${util.getTdMethodName('replaceNode')}(on${indexHash}, td.${util.getTdMethodName('getPartial')}('${instruction.key}', ${context}, this));\n`;
      code.push(tdBody, {fragment, renderer});
    } else {
      // return `td.${util.getTdMethodName('getPartial')}('${meta.name}', ${context}, this).then(function(node){return td.${util.getTdMethodName('nodeToString')}(node)})`;
    }
  },
  open_TORNADO_BODY(instruction, code) {
    let {tdBody} = instruction;
    let fragment = `f${tdBody}: function() {
      var frag = td.${util.getTdMethodName('createDocumentFragment')}();\n`;
    let renderer = `r${tdBody}: function(c) {
      var root = frags.frag${tdBody} || this.f${tdBody}();
      root = root.cloneNode(true);\n`;
    code.push(tdBody, {fragment, renderer});
  },
  close_TORNADO_BODY(instruction, code) {
    let {tdBody} = instruction;
    let fragment = `      frags.frag${name} = frag;
      return frag;
    }`;
    let renderer = `      return root;
    }`;
    code.push(tdBody, {fragment, renderer});
  },

  insert_PLAIN_TEXT(instruction, code) {
    let {tdBody, parentNodeName, contents} = instruction;
    if (instruction.state !== STATES.HTML_ATTRIBUTE) {
      let fragment = `      ${parentNodeName}.appendChild(td.${util.getTdMethodName('createTextNode')}('${contents.replace(/'/g, "\\'")}'));\n`;
      code.push(tdBody, {fragment});
    }
  },



  TORNADO_BODY(node, ctx) {
    let bodyInfo = node[1];
    let createMethods = !!bodyInfo.body.length;
    let methodName, blockName, blockIndex;

    if (bodyInfo.type === 'block' || bodyInfo.type === 'inlinePartial') {
      blockName = bodyInfo.key.join('.');
      methodName = `_${bodyInfo.type.substring(0,1)}_${blockName}`;
    }

    if (bodyInfo.type === 'block') {
      let blocks = ctx.blocks;
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
    let renderVal = ctx.tornadoBodies[bodyInfo.type].apply(ctx, [bodyInfo]);

    if (createMethods) {
      // Build the fragment and renderer, then walk the bodies.
      ctx.tdBodies.push({parentIndex: ctx.currentIdx()});
      let tdIndex = ctx.setIdx(ctx.tdBodies.length - 1);
      ctx.refCount++;
      ctx.htmlBodies.push({count: -1, htmlBodiesIndexes: [0]});
      ctx.setIdx(ctx.tdBodies[tdIndex].parentIndex);
    }
    return renderVal;
  },
  TORNADO_REFERENCE(node, ctx) {
    let tdIndex = ctx.currentIdx();
    let indexes = ctx.htmlBodies[tdIndex].htmlBodiesIndexes;
    let indexHash = indexes.join('');
    if (ctx.state === STATES.HTML_BODY || ctx.state === STATES.OUTER_SPACE) {
      ctx.append(null, `      ${util.createPlaceholder(ctx)};\n`,
                        `      var on${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
      td.${util.getTdMethodName('replaceNode')}(on${indexHash}, td.${util.getTdMethodName('createTextNode')}(td.${util.getTdMethodName('get')}(c, ${JSON.stringify(node[1].key)})));\n`);
    } else if (ctx.state === STATES.HTML_ATTRIBUTE) {
      return `td.${util.getTdMethodName('get')}(c, ${JSON.stringify(node[1].key)})`;
    }
  },
  HTML_ELEMENT(node, ctx) {
    let nodeInfo = node[1].tag_info;
    let tdIndex = ctx.currentIdx();
    let previousState = ctx.state;
    util.setHTMLElementState(nodeInfo, ctx);
    let isNamespaceRoot = nodeInfo.attributes.some(attr => attr.attrName === 'xmlns');
    let namespace = ctx.namespace ? `, '${ctx.namespace}'` : '';
    ctx.htmlBodies[tdIndex].htmlBodiesIndexes.push(0);
    let count = ++ctx.htmlBodies[tdIndex].count;
    ctx.append(null, `      var el${count} = td.${util.getTdMethodName('createElement')}('${nodeInfo.key}'${namespace});\n`, null);
    util.buildElementAttributes(nodeInfo.key, nodeInfo.attributes, ctx);
    ctx.htmlBodies[tdIndex].htmlBodiesIndexes.pop();
    ctx.htmlBodies[tdIndex].count--;
    ctx.state = previousState;
    if (isNamespaceRoot) {
      ctx.namespace = null;
    }
    if (ctx.state === STATES.ESCAPABLE_RAW) {
      ctx.append(null, `      el${ctx.htmlBodies[tdIndex].count}.defaultValue += td.${util.getTdMethodName('nodeToString')}(el${ctx.htmlBodies[tdIndex].count + 1});\n`, null);
    } else {
      ctx.append(null, `      ${util.getElContainerName(ctx)}.appendChild(el${ctx.htmlBodies[tdIndex].count + 1});\n`, null);
    }
  },
  PLAIN_TEXT(node, ctx) {
    if (ctx.state === STATES.HTML_ATTRIBUTE) {
      return '\'' + node[1] + '\'';
    } else if (ctx.state === STATES.HTML_BODY || ctx.state === STATES.OUTER_SPACE) {
      ctx.append(null, `      ${util.getElContainerName(ctx)}.appendChild(td.${util.getTdMethodName('createTextNode')}('${node[1].replace(/'/g, "\\'")}'));\n`, null);
    } else if (ctx.state === STATES.ESCAPABLE_RAW) {
      ctx.append(null, `      ${util.getElContainerName(ctx)}.defaultValue += '${node[1].replace(/'/g, "\\'")}';\n`, null);
    }
  }
});

let generateJavascript = function (ast, options) {
  options.results.code = {
    fragments: [],
    renderers: [],
    push(idx, strings) {
      let {fragment, renderer} = strings;
      if (idx >= this.fragments.length) {
        if (fragment) this.fragments.push(fragment);
        if (renderer) this.renderers.push(renderer);
      } else {
        if (fragment) this.fragments[idx] += fragment;
        if (renderer) this.renderers[idx] += renderer;
      }
    }
  };
  return codeGenerator(options.results.instructions, options.results.code);
};

export default generateJavascript;
