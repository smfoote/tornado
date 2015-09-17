var Api = require('../Api'),
    test = require('tape');

test('comment in a body', function(t) {
  var api = new Api();
  api.addBody();
  api.addHtmlComment('foo');
  api.leaveBody();

  t.equal(api.entities.elements.length, 1, 'adding a comment in a body is a element');
  t.end();
});
test('comment in an element', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'div'});
  api.addHtmlComment('foo');
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.elements.length, 2, 'adding a comment');
  t.deepEqual(api.entities.elements[0].elements, [1], 'connect the inner comment to the outer element');
  t.end();
});
