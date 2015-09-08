var Api = require('../Api'),
    test = require('tape');

test('plain text in an fragment', function(t) {
  var api = new Api();
  api.addBody();
  api.addPlainText('foo');
  api.leaveBody();

  t.equal(api.entities.strings.length, 1, 'adding a plaintext');
  t.end();
});
test('plain text in an element', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement();
  api.addPlainText('foo');
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.strings.length, 1, 'adding a plaintext');
  t.end();
});
test('plain text in an attr', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement();
  api.addAttr();
  api.addPlainText('foo');
  api.leaveAttr();
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.strings.length, 1, 'adding a plaintext');
  t.end();
});
test('plain text in a param value', function(t) {
  var api = new Api();
  api.addBody();
  api.addParam();
  api.addPlainText('foo');
  api.leaveParam();
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.strings.length, 1, 'adding a plaintext');
  t.end();
});
