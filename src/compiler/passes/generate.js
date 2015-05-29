'use strict';
import util from '../utils/builder';

// TODO: Figure out where these should actually live
import {STATES} from '../utils/builder';
import {createMethodHeaders} from './preprocess';
import {createMethodFooters} from './postprocess';

let visitor = require('../visitor');

let generateWalker = visitor.build({
  TORNADO_PARTIAL(node, ctx) {
    let meta = node[1];
    let params = meta.params;
    let context = 'c';
    let tdIndex = ctx.currentIdx();
    let indexes = ctx.htmlBodies[tdIndex].htmlBodiesIndexes;
    let indexHash = indexes.join('');
    if (params.length === 1 && params[0].key === 'context') {
      context = `td.${util.getTdMethodName('get')}(c, ${params[0].val})`;
    }
    if (context.state !== STATES.HTML_ATTRIBUTE) {
      ctx.appendFragment(`      ${util.createPlaceholder(ctx)};\n`);
      ctx.append(null, null, `      var on${indexHash} = td.${util.getTdMethodName('getNodeAtIdxPath')}(root, ${JSON.stringify(indexes)});
      td.${util.getTdMethodName('replaceNode')}(on${indexHash}, td.${util.getTdMethodName('getPartial')}('${meta.name}', ${context}, this));\n`);
    } else {
      return `td.${util.getTdMethodName('getPartial')}('${meta.name}', ${context}, this).then(function(node){return td.${util.getTdMethodName('nodeToString')}(node)})`;
    }
  },
  TORNADO_BODY(node, ctx) {
    let bodyInfo = node[1];
    let previousState = ctx.state;
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

      // Open the functions
      createMethodHeaders(methodName, ctx);

      ctx.state = STATES.OUTER_SPACE;
      /// TODO: recursive??
      generateWalker(bodyInfo.body, ctx);
      ctx.state = previousState;

      if (bodyInfo.bodies && bodyInfo.bodies.length) {
        generateWalker(bodyInfo.bodies, ctx);
      }

      // Close the functions
      createMethodFooters(null, ctx);
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
    let nodeContents = node[1].tag_contents;
    let tdIndex = ctx.currentIdx();
    let previousState = ctx.state;
    util.setHTMLElementState(nodeInfo, ctx);
    let isNamespaceRoot = nodeInfo.attributes.some(attr => attr.attrName === 'xmlns');
    let namespace = ctx.namespace ? `, '${ctx.namespace}'` : '';
    ctx.htmlBodies[tdIndex].htmlBodiesIndexes.push(0);
    let count = ++ctx.htmlBodies[tdIndex].count;
    ctx.append(null, `      var el${count} = td.${util.getTdMethodName('createElement')}('${nodeInfo.key}'${namespace});\n`, null);
    util.buildElementAttributes(nodeInfo.key, nodeInfo.attributes, ctx);
    generateWalker(nodeContents, ctx);
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
    let tdIndex = ctx.currentIdx();
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
  return generateWalker(ast, options.context);
};

module.exports = generateJavascript;
