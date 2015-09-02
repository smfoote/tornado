var Api = require('../Api'),
    test = require('tape');

test('body in element in body', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'div', type: 'element'});
  api.addBody();
  api.leaveBody();
  api.leaveElement();
  api.leaveBody();
  t.equal(api.entities.bodys[0].from, undefined, ' placeholder for the outer most element');
  t.deepEqual(api.entities.bodys[1].from, {type: 'elements', id: 1}, ' placeholder for the inner body from an element');
  t.deepEqual(api.entities.elements[1], {type:'placeholder', to: 'bodys', id: 1}, 'placeholder for the inner body');
  t.end();
});
test('reference in attr in elememt in body', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'div', type: 'element'});
  api.addAttr({key: 'id'});
  api.addReference({key: 'foo'});
  api.leaveAttr();
  api.leaveElement();
  api.leaveBody();
  t.deepEqual(api.entities.attr[0].val, {type:'placeholder', to: 'references', id: 0}, 'placeholder for the reference');
  t.deepEqual(api.entities.references[0].from, {type:'attributes', id: 0}, 'placeholder for reference from an attribute');
  t.end();
});
