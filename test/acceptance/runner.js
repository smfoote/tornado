var testRunner = require('../testRunner.js');
var referenceTests = require('./reference');
var existTests = require('./exists');
var htmlTests = require('./html');
var td = require('../../dist/runtime');

window.td = td;

testRunner.runSuites([htmlTests, referenceTests, existTests]);
