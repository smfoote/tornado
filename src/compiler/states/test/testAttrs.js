var Api = require('../Api'),
    test = require('tape');

test('initialize with a blank attrs', function(t) {
  var api = new Api();
  t.plan(2);
  t.equal(api.entities.attrs, undefined, 'should start with no attrs');
  api.addBody();
  api.addElement({key: 'div', type: 'element'});
  t.equal(api.entities.elements[0].attrs, undefined, 'should start with no attrs');
});
test('adding an attr before adding a body/fragment is a no-no', function(t) {
  var api = new Api();
  api.addBody();
  t.throws(api.addAttr);
  t.end();
});
test('add one attr', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'div', type: 'element'});
  api.addAttr({key: 'a', value: '1'});
  api.leaveAttr();
  t.equal(api.entities.attrs.length, 1, 'adding an attr to the list of attrs');
  t.deepEqual(api.entities.elements[0].attrs, [0], 'connect an attr to current element');
  t.end();
});
test('add one attr with a reference', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'div', type: 'element'});
  api.addAttr({key: 'a'});
  api.addReference({key: 'foo'});
  api.leaveAttr();
  t.equal(api.entities.attrs.length, 1, 'adding an attr to the list of attrs');
  t.deepEqual(api.entities.elements[0].attrs, [0], 'connect an attr to current element');
  t.end();
});
