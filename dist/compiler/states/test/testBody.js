"use strict";

var Api = require("../Api"),
    test = require("tape");

test("initializes with basic stuff", function (t) {
  var api = new Api();
  t.plan(2);
  t.deepEqual(api.meta, {}, "meta should start as an empty object");
  t.deepEqual(api.entities, {}, "entities should start as an empty object");
});
test("addBody one level deep", function (t) {
  var api = new Api();
  // first body (open template)
  api.addBody();
  t.equal(api.entities.bodys.length, 1, "adding a body should increase the entity bodys length");
  // add a fragment when we add a body
  t.equal(api.entities.fragments.length, 1, "adding a body should also add a fragment");
  t.equal(api.entities.bodys[0].fragment, 0, "an added body should refer to it's fragment");
  // point currentBody to this new body
  t.equal(api.meta.currentBody, 0, "currentBody should point to this new body");
  t.end();
});
test("addBody/addbodies should accept a parameter", function (t) {
  var api = new Api();
  api.addBody({ foo: 1, bar: 2 });
  t.equal(api.entities.bodys[0].foo, 1, "should have a parameter saved");
  t.equal(api.entities.bodys[0].bar, 2, "should have another parameter saved");
  api.addBodies({ foo: 3, bar: 4 });
  t.equal(api.entities.bodys[1].foo, 3, "should have a parameter saved");
  t.equal(api.entities.bodys[1].bar, 4, "should have another parameter saved");
  t.end();
});

test("addBody should add placeholder nodes", function (t) {
  var api = new Api();
  // first body (open template)
  api.addBody();
  t.equal(typeof api.entities.elements, "undefined", "no need for a placeholder when there is no parent fragment");
  api.addBody();
  api.leaveBody();
  t.equal(api.entities.elements[0].type, "placeholder", "a placeholder is added after leaving a child node");
  t.equal(api.entities.bodys[1].element, 0, "a placeholder reference is added on the child body");
  api.leaveBody();
  t.equal(api.entities.elements.length, 1, "leaving the outer body should not change things");
  t.end();
});

test("addBody two level deep", function (t) {
  var api = new Api();
  api.addBody();
  // add a primary body to the main
  api.addBody();
  t.equal(api.entities.bodys.length, 2, "should add another body");
  // add a fragment when we add a body
  t.equal(api.entities.fragments.length, 2, "should add another fragment");
  t.equal(api.entities.bodys[1].fragment, 1, "should refer to it's fragment again");
  // point currentBody to this new body
  t.equal(api.meta.currentBody, 1, "current body should point to this new primary body");

  api.leaveBody();
  // see that it is attached to main
  t.equal(api.entities.bodys[0].mains.length, 1, "adding a primary body should add to main");
  t.equal(api.entities.bodys[0].mains[0], 1, "adding a primary body should be referenced in main");

  // // add an alternate body to the bodies
  api.addBodies();
  t.equal(api.entities.bodys.length, 3, "bodies should add to the list of body");
  // add a fragment when we add a body
  t.equal(api.entities.fragments.length, 3, "a bodies also has a fragment");
  t.equal(api.entities.bodys[2].fragment, 2, "a bodies fragment should be connected");
  // point currentBody to this new body
  t.equal(api.meta.currentBody, 2, "current body should point to this new alternate body");

  api.leaveBodies();
  // see that it is attached to bodies
  t.equal(api.entities.bodys[0].bodies.length, 1, "adding an alternate body should add a bodies");
  t.equal(api.entities.bodys[0].bodies[0], 2, "adding an alternate body should be referenced");

  // //add another sibling into primary
  api.addBody();
  t.equal(api.entities.bodys.length, 4, "add another sibling for a total of 4");
  api.leaveBody();
  // see that it is attached to main
  t.deepEqual(api.entities.bodys[0].mains, [1, 3], "a sibling should be added");

  api.leaveBody(); // close the template
  t.end();
});

test("addBody many level deep", function (t) {
  var api = new Api();
  // first body (open template)
  api.addBody();

  // add a child body to the main x 3
  api.addBody();
  api.addBody();
  api.addBody();
  t.equal(api.entities.bodys.length, 4, "we should have 4 bodys");
  t.equal(api.entities.fragments.length, 4, " with 4 fragments");

  api.leaveBody();
  api.leaveBody();
  api.leaveBody();
  api.leaveBody(); // close the template
  t.deepEqual(api.entities.bodys[0].mains, [1], "the 0th pointing to the first");
  t.deepEqual(api.entities.bodys[1].mains, [2], "the 1st to the 2nd");
  t.deepEqual(api.entities.bodys[2].mains, [3], "the 2nd to the 3rd");
  t.end();
});
test("addBodies many level deep", function (t) {
  var api = new Api();
  // first body (open template)
  api.addBody();

  // add a child body to the bodies x 3
  api.addBodies();
  api.addBodies();
  api.addBodies();
  t.equal(api.entities.bodys.length, 4, "we should have 4 bodys");
  t.equal(api.entities.fragments.length, 4, "with 4 fragments");

  api.leaveBodies();
  api.leaveBodies();
  api.leaveBodies();
  api.leaveBodies(); // close the template
  t.deepEqual(api.entities.bodys[0].bodies, [1]);
  t.deepEqual(api.entities.bodys[1].bodies, [2]);
  t.deepEqual(api.entities.bodys[2].bodies, [3]);
  t.end();
});
//# sourceMappingURL=testBody.js.map