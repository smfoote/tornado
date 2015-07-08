var parser = require('../../dist/parser'),
    compiler = require('../../dist/compiler'),
    td = require('../../dist/runtime');

window.td = td;

var weatherIconMap = {
  '3': 'P',   // thunderstorms
  '4': '0',   // severe thunderstorms
  '5': 'X',   // frozen rain
  '6': 'X',
  '7': 'X',
  '8': 'X',
  '9': 'Q',   // drizzle
  '10': 'X',  // frozen rain
  '11': 'Q',  // showers
  '12': 'R',  // showers
  '20': 'M',  // fog
  '26': 'N',  // cloudy
  '27': 'H',
  '28': 'H',
  '29': 'H',
  '30': 'H',
  '32': 'B',  // sunny
  '33': 'H', // fair
  '34': '3',
  '37': 'P',
  '38': 'P',
  '39': 'P',
  '44': 'H'
};

td.registerHelper('weatherIcon', function(context, params, bodies) {
  var iconCode = weatherIconMap[params.code];
  var result = bodies.main(context);
  if (iconCode) {
    var span = document.createElement('span');
    span.setAttribute('data-icon-code', iconCode);
    span.setAttribute('title', params.desc);
    span.setAttribute('class', 'weather-icon');
    span.appendChild(result);
    result = span;
  }
  return result;
});

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
