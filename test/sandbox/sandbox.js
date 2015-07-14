var parser = require('../../dist/parser'),
    compiler = require('../../dist/compiler'),
    td = require('../../dist/runtime');

window.td = td;

var weatherIconMap = {
  '0': 'F',   // tornado
  '1': 'F',   // tropical storm
  '2': 'F',   // hurricane
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
  '13': 'U',  // snow
  '14': 'U',  // snow
  '15': 'V',  // snow
  '16': 'V',  // snow
  '17': 'X',  // hail
  '18': '$',  // sleet
  '19': '$',  // dust
  '20': 'M',  // fog
  '21': 'X',  // sleet
  '22': 'E',  // smoky
  '23': 'S',  // blustery
  '24': 'F',  // windy
  '25': 'G',  // windy
  '26': 'N',  // cloudy
  '27': 'H',
  '28': 'H',
  '29': 'H',
  '30': 'H',
  '31': 'C',  // clear (night)
  '32': 'B',  // sunny
  '33': 'H',  // fair
  '34': '3',
  '35': 'X',
  '36': "'",
  '37': 'P',
  '38': 'P',
  '39': 'P',
  '40': 'Q',
  '41': 'W',
  '42': 'U',
  '43': 'W',
  '44': 'H',
  '45': '6',
  '46': 'V',
  '47': 'P'
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
