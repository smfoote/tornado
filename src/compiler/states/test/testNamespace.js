var Api = require('../Api'),
    test = require('tape');

test('add one element with a namespace', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'h2', type: 'element'});
  api.addAttr({key: 'xmlns'});
  api.addPlainText('hello');
  api.leaveAttr();
  api.leaveElement();
  t.equal(api.entities.elements[0].namespace, 0, 'adding a namespace attribute to an element');
  t.equal(api.entities.elements[0].originalNamespace, 'default', 'should leave the default namespace');
  t.equal(api.entities.attrs[0].vals[0], 0, 'the namespace attribute has value 0');
  t.equal(api.entities.vals[0].content, 'hello', 'the hello value');
  t.end();
});

test('add two element each with a namespace', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'h2', type: 'element'});
  api.addAttr({key: 'xmlns'});
  api.addPlainText('hello');
  api.leaveAttr();
    api.addElement({key: 'p', type: 'element'});
    api.addAttr({key: 'xmlns'});
    api.addPlainText('other');
    api.leaveAttr();
    api.leaveElement();
  api.leaveElement();
  t.equal(api.entities.elements[1].namespace, 1, 'adding a namespace attribute to the child element');
  t.equal(api.entities.elements[1].originalNamespace, 0, 'should leave the parent namespace');
  t.equal(api.entities.attrs[1].vals[0], 1, 'the namespace attribute has value 1');
  t.equal(api.entities.vals[1].content, 'other', 'the other value');
  t.end();
});



