var testRunner = require('../testRunner.js');
var referenceTests = require('./reference');
var existTests = require('./exists');
var td = require('../../dist/runtime');

window.td = td;

testRunner.runSuites([referenceTests, existTests]);
