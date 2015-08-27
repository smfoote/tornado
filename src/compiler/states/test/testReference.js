var Api = require('../Api'),
    test = require('tape');

test('adding an reference before adding a body/fragment is a no-no', function(t) {
  var api = new Api();
  t.throws(api.addReference);
  t.end();
});
test('adding a reference should modify element and current body', function(t) {
  var api = new Api();
  api.addBody();
  api.addReference({key: 'hello'});
  api.leaveBody();
  t.equal(api.entities.elements.length, 1, 'should add a placeholder element');
  t.equal(api.entities.fragments[0].elements[0], 0, 'the current fragment needs to know about this element');
  t.equal(api.entities.bodys.length, 1, 'should not change the bodys length');
  t.equal(api.entities.bodys[0].refs.length, 1, 'should add the reference to body');
  t.equal(api.entities.bodys[0].refs[0].element, 0, 'the reference should know about the placeholder');
  t.end();
});
