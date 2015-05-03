var testRunner = require('../testRunner.js');
var referenceTests = require('./reference');
var td = require('../../dist/runtime');

window.td = td;

testRunner.runSuites([referenceTests]);
