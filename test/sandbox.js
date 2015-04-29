var parser = require('../dist/parser.js'),
    compiler = require('../dist/compiler'),
    td = require('../dist/runtime');

Node.prototype.replaceChildAtIdx = function(idx, newChild) {
  var refNode = this.childNodes[idx];
  if (refNode) {
    this.replaceChild(newChild, refNode);
  } else if (idx >= this.childNodes.length) {
    this.appendChild(newChild);
  }
};

var button = document.querySelector('#render');
var templateTextArea = document.querySelector('#template');
var contextTextArea = document.querySelector('#context');
var outputOuter = document.querySelector('#output');
var astContainer = document.querySelector('#output .ast');
var compiledContainer = document.querySelector('#output .compiled');
var outputContainer = document.querySelector('#output .output');
var stringContainer = document.querySelector('#output .string');

button.addEventListener('click', function(evt) {
  var t = templateTextArea.value;
  var c = contextTextArea.value;
  var ast = parser.parse(t);
  astContainer.innerHTML = JSON.stringify(ast, null, 2);
  var compiled = compiler.compile(ast, 'test');
  compiledContainer.innerHTML = compiled;
  var tl = eval(compiled);
  var data = {};
  eval('data = ' + c + ';');
  var out = tl.render(eval(data));
  outputContainer.replaceChildAtIdx(0, out);
  stringContainer.innerHTML = outputContainer.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
});

output.addEventListener('click', function(evt) {
  var target = evt.target;
  target.classList.toggle('min');
});
