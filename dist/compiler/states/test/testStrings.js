"use strict";

var Api = require("../Api"),
    test = require("tape");

test("plain text in a body", function (t) {
  var api = new Api();
  api.addBody();
  api.addPlainText("foo");
  api.leaveBody();

  t.equal(api.entities.elements.length, 1, "adding a plaintext in a body is a element");
  t.end();
});
test("plain text in an element", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "div" });
  api.addPlainText("foo");
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.elements.length, 2, "adding a plaintext");
  t.deepEqual(api.entities.elements[0].elements, [1], "connect the inner plaintext to the outer element");
  t.end();
});
test("plain text in an attr", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "div" });
  api.addAttr({ key: "id" });
  api.addPlainText("foo");
  api.leaveAttr();
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.vals.length, 1, "adding a plaintext in an attr adds it to vals");
  t.end();
});
// test('plain text in a param value', function(t) {
// var api = new Api();
// api.addBody();
// api.addParam({key: 'p0'});
// api.addPlainText('foo');
// api.leaveParam();
// api.leaveElement();
// api.leaveBody();

// t.equal(api.entities.paramVals.length, 1, 'adding a plaintext in a param adds it to param vals');
// t.end();
// });
//# sourceMappingURL=testStrings.js.map