"use strict";

var History = require("./History");

var Api = function Api() {
  var tdHistory = new History(),
      elHistory = new History(),
      meta = {},
      entities = {};

  function addBodyAndFragment(b, f) {
    var len;
    tdHistory.enter();
    if (entities.bodys) {
      len = entities.fragments.push(f);
      b.fragment = len - 1;
      entities.bodys.push(b);
    } else {
      b.fragment = 0;
      entities.bodys = [b];
      entities.fragments = [f];
    }

    meta.currentBody = tdHistory.current();
    meta.currentFragment = tdHistory.current();
  }

  function addElement(el) {
    var elIndex, currentFragment;
    // add a new element
    elHistory.enter();
    if (entities.elements) {
      entities.elements.push(el);
    } else {
      entities.elements = [el];
    }

    // connect it to the fragment
    elIndex = elHistory.current();
    currentFragment = entities.fragments[meta.currentFragment];
    if (currentFragment.elements) {
      currentFragment.elements.push(elIndex);
    } else {
      currentFragment.elements = [elIndex];
    }
    meta.currentElement = elIndex;
  }

  function addParam(p) {
    var currentBody = entities.bodys[meta.currentBody],
        len,
        paramIndex;
    // add a row into the params table
    if (entities.params) {
      len = entities.params.push(p);
      paramIndex = len - 1;
    } else {
      entities.params = [p];
      paramIndex = 0;
    }
    // attach param to the current Body
    if (currentBody.params) {
      currentBody.params.push(paramIndex);
    } else {
      currentBody.params = [paramIndex];
    }
  }

  function leaveElement() {
    var elIndex = elHistory.current();
    elHistory.leave();
    var parentIndex = elHistory.current();
    if (parentIndex >= 0) {
      entities.elements[parentIndex].elements.push(elIndex);
    }
    meta.currentElement = parentIndex;
  }

  return {
    addBody: function addBody() {
      addBodyAndFragment({ mains: [], bodies: [] }, { elements: [] });
    },
    leaveBody: function leaveBody() {
      var tIndex = tdHistory.current();
      tdHistory.leave();
      var parentIndex = tdHistory.current();
      if (parentIndex >= 0) {
        entities.bodys[parentIndex].mains.push(tIndex);
      }
      meta.currentBody = parentIndex;
      meta.currentFragment = parentIndex;
    },
    addBodies: function addBodies() {
      addBodyAndFragment({ mains: [], bodies: [] }, { elements: [] });
    },
    leaveBodies: function leaveBodies() {
      var tIndex = tdHistory.current();
      tdHistory.leave();
      var parentIndex = tdHistory.current();
      if (parentIndex >= 0) {
        entities.bodys[parentIndex].bodies.push(tIndex);
      }
      meta.currentBody = parentIndex;
      meta.currentFragment = parentIndex;
    },
    meta: meta,
    entities: entities,

    //DOM elements
    addElement: addElement,
    leaveElement: leaveElement,
    // references
    addReference: function addReference(r) {
      // add placeholder element
      var tIndex = meta.currentBody,
          elIndex,
          currentBody;
      addElement({ type: "placeholder" });
      elIndex = meta.currentElement;
      leaveElement();

      // add reference to current body
      r.element = elIndex;
      currentBody = entities.bodys[tIndex];
      if (currentBody.refs) {
        currentBody.refs.push(r);
      } else {
        currentBody.refs = [r];
      }
    },
    addParam: addParam,

    //debugging
    _tdHistory: tdHistory,
    _elHistory: elHistory
  };
};

module.exports = Api;
//# sourceMappingURL=Api.js.map