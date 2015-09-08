"use strict";

var Api = require("../Api"),
    test = require("tape");

test("body in element in body", function (t) {
  /*
   * body: [outer, inner],
   * element: [div, placeholder]
   */
  var api = new Api();
  api.addBody();
  api.addElement({ key: "div", type: "element" });
  api.addBody();
  api.leaveBody();
  api.leaveElement();
  api.leaveBody();
  t.equal(api.entities.bodys[0].from, undefined, " placeholder for the outer most element");
  debugger;
  t.deepEqual(api.entities.bodys[1].from, { type: "elements", id: 1 }, " placeholder for the inner body from an element");
  t.equal(api.entities.elements[1].type, "placeholder", "placeholder for the inner body");
  t.equal(api.entities.elements[1].to, "bodys", "placeholder for the inner body");
  t.equal(api.entities.elements[1].id, 1, "placeholder for the inner body");
  t.deepEqual(api.entities.elements[0].elements, [1], "placeholder placed inside parent element");
  t.end();
});
test("reference in attr in elememt in body", function (t) {
  var api = new Api();
  api.addBody();
  api.addElement({ key: "div", type: "element" });
  api.addAttr({ key: "id" });
  api.addReference({ key: "foo" });
  api.leaveAttr();
  api.leaveElement();
  api.leaveBody();
  t.deepEqual(api.entities.vals[0], { type: "placeholder", to: "refs", id: 0 }, "placeholder for the reference");
  t.deepEqual(api.entities.refs[0].from, { type: "attrs", id: 0 }, "placeholder for reference from an attribute");
  t.end();
});
//# sourceMappingURL=testPlaceholder.js.map