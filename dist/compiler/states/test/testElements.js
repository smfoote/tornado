"use strict";

var Api = require("../Api"),
    test = require("tape");

test("initial value of elements", function (t) {
  var api = new Api();
  t.equal(api.entities.elements, undefined, "should start with no elements");
  api.addBody();
  t.deepEqual(api.entities.fragments[0].elements, [], "adding a body/fragment should initialize an empty elements array");
  t.end();
});
test("add one element", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "h2", type: "element" });
  api.leaveElement();
  t.equal(api.entities.elements.length, 1, "adding a element to the list of elements");
  t.deepEqual(api.entities.fragments[0].elements, [0], "connect an element to current fragment");
  t.end();
});
test("add many sibling element", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "p", type: "element" });
  api.leaveElement();
  api.addElement({ key: "p", type: "element" });
  api.leaveElement();
  api.addElement({ key: "p", type: "element" });
  api.leaveElement();
  api.addElement({ key: "p", type: "element" });
  api.leaveElement();
  t.equal(api.entities.elements.length, 4, "adding 4 elements to the list of elements");
  t.deepEqual(api.entities.fragments[0].elements, [0, 1, 2, 3], "connect 4 element to current fragment");
  t.end();
});
test("add many nested element", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "h1", type: "element" });
  api.addElement({ key: "h2", type: "element" });
  api.addElement({ key: "h3", type: "element" });
  api.addElement({ key: "h4", type: "element" });
  api.leaveElement();
  api.leaveElement();
  api.leaveElement();
  api.leaveElement();
  t.equal(api.entities.elements.length, 4, "adding 4 elements to the list of elements");
  t.deepEqual(api.entities.fragments[0].elements, [0], "connect outer element to current fragment");
  t.deepEqual(api.entities.elements[0].elements, [1], "connect child element to outer element");
  t.deepEqual(api.entities.elements[1].elements, [2], "connect child element to outer element");
  t.deepEqual(api.entities.elements[2].elements, [3], "connect child element to outer element");
  t.end();
});
test("add three sibling element each with 2 children", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "h1", type: "element" });
  api.addElement({ key: "p", type: "element" });
  api.leaveElement();
  api.addElement({ key: "b", type: "element" });
  api.leaveElement();
  api.leaveElement();
  api.addElement({ key: "h2", type: "element" });
  api.addElement({ key: "p", type: "element" });
  api.leaveElement();
  api.addElement({ key: "b", type: "element" });
  api.leaveElement();
  api.leaveElement();
  api.addElement({ key: "h3", type: "element" });
  api.addElement({ key: "p", type: "element" });
  api.leaveElement();
  api.addElement({ key: "b", type: "element" });
  api.leaveElement();
  api.leaveElement();
  t.equal(api.entities.elements.length, 9, "adding 9 elements to the list of elements");
  t.deepEqual(api.entities.fragments[0].elements, [0, 3, 6], "connect top level elements to current fragment");
  t.deepEqual(api.entities.elements[0].elements, [1, 2], "connect child element to outer element");
  t.deepEqual(api.entities.elements[3].elements, [4, 5], "connect child element to outer element");
  t.deepEqual(api.entities.elements[6].elements, [7, 8], "connect child element to outer element");
  t.end();
});

test("add two sibling element to 3 body/fragments", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "h1", type: "element" });
  api.leaveElement();
  api.addElement({ key: "h2", type: "element" });
  api.leaveElement();
  api.leaveBody();

  api.addBody();
  api.addElement({ key: "h1", type: "element" });
  api.leaveElement();
  api.addElement({ key: "h2", type: "element" });
  api.leaveElement();
  api.leaveBody();

  api.addBody();
  api.addElement({ key: "h1", type: "element" });
  api.leaveElement();
  api.addElement({ key: "h2", type: "element" });
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.elements.length, 6, "adding 6 elements to the list of elements");
  t.deepEqual(api.entities.fragments[0].elements, [0, 1], "connect outer element to current fragment");
  t.deepEqual(api.entities.fragments[1].elements, [2, 3], "connect outer element to current fragment");
  t.deepEqual(api.entities.fragments[2].elements, [4, 5], "connect outer element to current fragment");
  t.end();
});
test("body and elements nested", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "h1", type: "element" });
  api.addBody();
  api.addElement({ key: "h2", type: "element" });
  api.addBody();
  api.addElement({ key: "h3", type: "element" });
  api.leaveElement();
  api.leaveBody();
  api.leaveElement();
  api.leaveBody();
  api.leaveElement();
  api.leaveBody();

  t.equal(api.entities.elements.length, 3, "adding 3 elements to the list of elements");
  t.equal(api.entities.fragments.length, 3, "adding 3 fragments");
  t.deepEqual(api.entities.fragments[0].elements, [0], "outer fragment has an element");
  t.deepEqual(api.entities.fragments[1].elements, [1], "middle fragment has another");
  t.deepEqual(api.entities.fragments[2].elements, [2], "inner fragment has yet another");
  t.end();
});
//# sourceMappingURL=testElements.js.map