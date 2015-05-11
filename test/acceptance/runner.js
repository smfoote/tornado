var testRunner = require('../testRunner.js');
var htmlTests = require('./html');
var referenceTests = require('./reference');
var existsTests = require('./exists');
var notExistsTests = require('./notExists');
var blockTests = require('./block');
var partialTests = require('./partial');
var td = require('../../dist/runtime');

window.td = td;

testRunner.runSuites([htmlTests, referenceTests, existsTests, notExistsTests, blockTests, partialTests]);
