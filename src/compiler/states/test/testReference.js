var Api = require('../Api'),
    test = require('tape');

test('adding an reference before adding a body/fragment is a no-no', function(t) {
  var api = new Api();
  t.throws(api.addReference);
  t.end();
});
/*
 *  bodys: [{outer, references: 0}]
 *  references: [ref, el0]
 *  elements: [{placeholder-for-reference}]
 */
test('adding a reference in a body', function(t) {
  var api = new Api();
  api.addBody();
  api.addReference({key: 'hello'});
  api.leaveBody();
  t.equal(api.entities.elements.length, 1, 'should add a placeholder element');
  t.equal(api.entities.fragments[0].elements[0], 0, 'the current fragment needs to know about this element');
  t.equal(api.entities.bodys.length, 1, 'should not change the bodys length');
  t.equal(api.entities.refs.length, 1, 'should add a reference to the list of references');
  t.equal(api.entities.bodys[0].refs[0], 0, 'should add the reference to body');
  // Not sure if this from here makes sense
  t.deepEqual(api.entities.refs[0].from, {type: 'bodys', id: 0}, 'the reference should know about the placeholder');
  t.end();
});
/*
 *  bodys: [{outer, references: 0}]
 *  references: [ref, el1]
 *  elements: [{outerEl}, {placeholder-for-reference}]
 */
test('adding a reference in an element', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'div', type: 'element'});
  api.addReference({key: 'hello'});
  api.leaveElement();
  api.leaveBody();
  t.equal(api.entities.elements.length, 2, 'should add a placeholder element');
  t.equal(api.entities.elements[0].elements[0], 1, 'the current fragment needs to know about this element');
  t.equal(api.entities.bodys.length, 1, 'should not change the bodys length');
  t.equal(api.entities.refs.length, 1, 'should add a reference to the list of references');
  t.equal(api.entities.bodys[0].refs[0], 0, 'should add the reference to body');
  t.deepEqual(api.entities.refs[0].from, {type: 'elements', id:1}, 'the reference should know about the placeholder');
  t.end();
});
/*
 *  bodys: [{outer, references: 0}]
 *  references: [ref, attr0]
 *  elements: [{placeholder-for-reference}]
 *  attrs: [x
 */
test('adding a reference in an attribute', function(t) {
  var api = new Api();
  api.addBody();
  api.addElement({key: 'div', type: 'element'});
  api.addAttr({key: 'foo'});
  api.addReference({key: 'hello'});
  api.leaveAttr();
  api.leaveElement();
  api.leaveBody();
  t.equal(api.entities.elements.length, 1, 'should add a element and no placeholder');
  t.equal(api.entities.attrs.length, 1, 'should add an attr');
  t.equal(api.entities.vals[0].type, 'placeholder', 'should add a placeholder into vals');
  t.equal(api.entities.bodys.length, 1, 'should not change the bodys length');
  t.equal(api.entities.bodys[0].refs.length, 1, 'should add the reference to body');
  t.deepEqual(api.entities.refs[0].from, {type: 'vals', id: 0}, 'the reference should know about the placeholder');
  t.end();
});
test('adding a reference in a param', function(t) {
  var api = new Api();
  api.addBody();
  api.addParam({key: 'foo'});
  api.addReference({key: 'hello'});
  api.leaveParam();
  api.leaveBody();

  t.equal(api.entities.params.length, 1, 'adding a param to the list of params');
  t.equal(api.entities.vals[0].type, 'placeholder', 'should add a placeholder into vals');
  t.equal(api.entities.bodys[0].refs.length, 1, 'should add the reference to body');
  t.deepEqual(api.entities.refs[0].from, {type: 'paramVals', id: 0}, 'the reference should know about the placeholder');
  t.end();
});
