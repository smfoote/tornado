
let createMethodHeaders = function(name, context) {
  name = name || context.currentIdx();
  let f = `f${name}: function() {
    var frag = td.${context.getTdMethodName('createDocumentFragment')}();\n`;
  let r = `r${name}: function(c) {
    var root = frags.frag${name} || this.f${name}();
    root = root.cloneNode(true);\n`;
  context.push(name, f, r);
};
let preprocess = function(ast, options) {
  let context = options.context;
  if (context) {
    createMethodHeaders(null, context);
  }
};

export default preprocess;
