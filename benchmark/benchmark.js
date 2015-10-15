/*global performance, dust, window */

var parser = require('../dist/parser'),
    compiler = require('../dist/compiler'),
    td = require('../dist/runtime'),
    templates = require('./templates').templates;

window.td = td;
window.searchTimes = [];
window.fragTimes = [];
window.renderTimes = [];


Array.prototype.average = function(key) {
  return this.reduce(function(acc, item) {
    if (key) {
      return acc + item[key];
    } else {
      return acc + item;
    }
  }, 0) / this.length;
};

Array.prototype.max = function(key) {
  return this.reduce(function(acc, item) {
    if (key) {
      return acc > item[key] ? acc : item;
    } else {
      return Math.max(item, acc);
    }
  }, 0) / this.length;
};

var button = document.querySelector('#run');
var sandbox = document.querySelector('#sandbox');
var tornadoResults = document.querySelector('#tornado-results');
var dustResults = document.querySelector('#dust-results');
var resultsTemplate = eval(compiler.compile(parser.parse(templates[0].str), 'results'));
var numberOfIterations = 2;

button.addEventListener('click', function() {
  templates.forEach(function(template) {
    console.log('template: ' + template.name);
    window.templateName = template.name;
    var iteration = 0;
    var compiled = compiler.compile(parser.parse(template.str), template.name);
    var tl = eval(compiled);
    var renderTime = 0;
    var appendTime = 0;
    var endTime;
    var out;
    console.log('template: ' + template.name);
    var startTime = performance.now();
    while (iteration < numberOfIterations) {
      var renderStart = performance.now();
      out = tl.render(template.data);
      var renderDone = performance.now();
      renderTime += (renderDone - renderStart);
      sandbox.appendChild(out, sandbox.childNodes[0]);
      appendTime += (performance.now() - renderDone);
      window.searchTimes.push(renderTime + appendTime);
      iteration++;
    }
    endTime = performance.now();
    var resultsData = {
      startTime: startTime,
      endTime: endTime,
      averageRenderTime: (renderTime / numberOfIterations),
      averageAppendTime: (appendTime / numberOfIterations),
      averageTime: ((renderTime + appendTime) / numberOfIterations),
      elapsedTime: function() {
        return this.endTime - this.startTime;
      },
      name: template.name
    };
    tornadoResults.appendChild(resultsTemplate.render(resultsData));
  });
  sandbox.innerHTML = '';

  console.log('\nDUST\n');
  templates.forEach(function(template) {
    var iteration = 0;
    var compiled = dust.compile(template.str, template.name);
    var renderTime = 0;
    var appendTime = 0;
    dust.loadSource(compiled);
    var endTime;
    var startTime = performance.now();
    while (iteration < numberOfIterations) {
      var renderStart = performance.now();
      dust.render(template.name, template.data, function(err, out) {
        var renderDone = performance.now();
        renderTime += (renderDone - renderStart);
        if (!err) {
          sandbox.innerHTML = out;
          appendTime += (performance.now() - renderDone);
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
      averageRenderTime: (renderTime / numberOfIterations),
      averageAppendTime: (appendTime / numberOfIterations),
      elapsedTime: function() {
        return this.endTime - this.startTime;
      },
      name: template.name
    };
    dustResults.appendChild(resultsTemplate.render(resultsData));
  });

});
