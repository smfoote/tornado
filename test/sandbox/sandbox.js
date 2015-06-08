if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

var parser = require('../../dist/parser'),
    compiler = require('../../dist/compiler'),
    td = require('../../dist/runtime');

window.td = td;
var button = document.querySelector('#render');
var templateTextArea = document.querySelector('#template');
var contextTextArea = document.querySelector('#context');
var astContainer = document.querySelector('#output .ast');
var compiledContainer = document.querySelector('#output .compiled');
var outputContainer = document.querySelector('#output .output');
var stringContainer = document.querySelector('#output .string');

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
