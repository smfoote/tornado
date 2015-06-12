/*global performance, dust */

var parser = require('../dist/parser'),
    compiler = require('../dist/compiler'),
    td = require('../dist/runtime'),
    templates = require('./templates').templates;

window.td = td;
var button = document.querySelector('#run');
var tornadoContainer = document.querySelector('#tornado-container');
var tornadoResults = document.querySelector('#tornado-results');
var dustContainer = document.querySelector('#dust-container');
var dustResults = document.querySelector('#dust-results');
var resultsTemplate = eval(compiler.compile(parser.parse(templates[0].str), 'results'));
var numberOfIterations = 10000;

button.addEventListener('click', function() {
  templates.forEach(function(template) {
    var iteration = 0;
    var compiled = compiler.compile(parser.parse(template.str), template.name);
    var tl = eval(compiled);
    var endTime;
    var out;
    var startTime = performance.now();
    console.log(template.name);
    while (iteration < numberOfIterations) {
      var renderStart = performance.now();
      out = tl.render(template.data);
      console.log(performance.now() - renderStart);
      tornadoContainer.appendChild(out, tornadoContainer.childNodes[0]);
      iteration++;
    }
    endTime = performance.now();
    var resultsData = {
      startTime: startTime,
      endTime: endTime,
      elapsedTime: function() {
        return this.endTime - this.startTime;
      },
      name: template.name
    };
    tornadoResults.appendChild(resultsTemplate.render(resultsData));
  });
  tornadoContainer.innerHTML = '';

  console.log('\nDUST\n');
  templates.forEach(function(template) {
    var iteration = 0;
    var compiled = dust.compile(template.str, template.name);
    dust.loadSource(compiled);
    var endTime;
    var startTime = performance.now();
    console.log(template.name);
    while (iteration < numberOfIterations) {
      var renderStart = performance.now();
      dust.render(template.name, template.data, function(err, out) {
        console.log(performance.now() - renderStart);
        if (!err) {
          dustContainer.innerHTML = out;
        } else {
          throw new Error(err);
        }
      });
      iteration++;
    }
    endTime = performance.now();
    var resultsData = {
      startTime: startTime,
      endTime: endTime,
      elapsedTime: function() {
        return this.endTime - this.startTime;
      },
      name: template.name
    };
    dustResults.appendChild(resultsTemplate.render(resultsData));
  });

});
