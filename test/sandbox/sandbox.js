var parser = require('../../dist/parser'),
    compiler = require('../../dist/compiler'),
    tdDebugger = require('../../dist/compiler/extensions/debugger'),
    tdBlock = require('../../dist/compiler/extensions/block'),
    td = require('../../dist/runtime');

window.td = td;
var button = document.querySelector('#render');
var templateTextArea = document.querySelector('#template');
var contextTextArea = document.querySelector('#context');
var astContainer = document.querySelector('#output .ast');
var compiledContainer = document.querySelector('#output .compiled');
var outputContainer = document.querySelector('#output .output');
var stringContainer = document.querySelector('#output .string');

// Customize compiler

compiler.useExtensions([tdDebugger, tdBlock]);

button.addEventListener('click', function() {
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
  outputContainer.innerHTML = '';
  outputContainer.appendChild(out);
  stringContainer.innerHTML = outputContainer.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
});

outputContainer.addEventListener('click', function(evt) {
  var target = evt.target;
  target.classList.toggle('min');
});
