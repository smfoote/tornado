var testRunner = require('../testRunner.js');
var helperTests = require('./helper');
var htmlTests = require('./html');
var referenceTests = require('./reference');
var existsTests = require('./exists');
var notExistsTests = require('./notExists');
var sectionTests = require('./section');
var blockTests = require('./block');
var partialTests = require('./partial');
var td = require('../../dist/runtime');

window.td = td;

testRunner.runSuites([
  helperTests,
  htmlTests,
  referenceTests,
  existsTests,
  notExistsTests,
  sectionTests,
  blockTests,
  partialTests
]);
