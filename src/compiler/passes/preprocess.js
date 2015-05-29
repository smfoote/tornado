import util from '../utils/builder';

export let createMethodHeaders = function(name, context) {
  name = name || context.currentIdx();
  let f = `f${name}: function() {
    var frag = td.${util.getTdMethodName('createDocumentFragment')}();\n`;
  let r = `r${name}: function(c) {
    var root = frags.frag${name} || this.f${name}();
    root = root.cloneNode(true);\n`;
  context.push(name, f, r);
};
let preprocess = function(ast, options) {
  let context = options.context;
  if (context) {
    // do some initialization stuff
    context.tdBodies.push({parentIndex: null});
    context.htmlBodies.push({count: -1, htmlBodiesIndexes: [0]});
    createMethodHeaders(null, context);
  }
};

export default preprocess;
