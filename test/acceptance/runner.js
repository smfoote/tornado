var testRunner = require('../testRunner.js');
var htmlTests = require('./html');
var referenceTests = require('./reference');
var existsTests = require('./exists');
var blockTests = require('./block');
var td = require('../../dist/runtime');

window.td = td;

testRunner.runSuites([htmlTests, blockTests, referenceTests, existsTests]);
