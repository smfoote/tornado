/*global dust, window */
/*eslint no-eval: 0 */

var parser = require('../dist/parser'),
    compiler = require('../dist/compiler'),
    td = require('../dist/runtime');

window.td = td;

var button = document.querySelector('#run');
var dustContainer = document.querySelector('#dust-results');
var tdContainer = document.querySelector('#tornado-results');

var template = '<h1>Hello world</h1>\n' +
               '{#content}' +
                 '<p>This is what you\'ve been waiting for</p>' +
               '{:pending}' +
                 '<div class="loading"></div>' +
               '{/content}';

var context = {
  content: function() {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve('content');
      }, 1200);
    });
  }
};

button.addEventListener('click', function() {
  var compiledTd = compiler.compile(parser.parse(template), 'async');
  var compiledDust = dust.compile(template, 'async');
  var tdTemplate = eval(compiledTd);
  dustContainer.innerHTML = '';
  tdContainer.innerHTML = '';
  dust.loadSource(compiledDust);
  dust.render('async', context, function(err, out) {
    if (!err) {
      dustContainer.innerHTML = out;
    }
  });
  tdContainer.appendChild(tdTemplate.render(context));
});
