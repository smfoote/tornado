"use strict";

var History = require("./History");

var ENTITY_TYPES = {
  BODY: "bodys",
  REFERENCE: "refs",
  FRAGMENT: "fragments",
  ELEMENT: "elements",
  ATTRIBUTE: "attrs",
  ATTRIBUTE_VALUE: "vals",
  PARAM: "params",
  PARAM_VALUE: "paramVals"
};

var Api = function Api() {
  var tdHistory = new History(),
      elHistory = new History(),
      stateHistory = new History(),
      meta = { currentNamespace: "default" },
      entities = {};

  function generateLocation(type, id) {
    return { type: type, id: id };
  }
  function locationToEntity(location) {
    var type = location.type,
        id = location.id;
    if (!type || typeof id !== "number") {
      return null;
    }

    if (type === ENTITY_TYPES.PARAM_VALUE) {
      type = ENTITY_TYPES.ATTRIBUTE_VALUE;
    }
    var set = entities[type];
    if (set) {
      return set[id] || null;
    }

    return null;
  }
  function placeholderize(from, to) {
    // add a placeholder then connect it from the `from` location and have it point to the `to` location
    var itemIndex,
        item = {
      type: "placeholder",
      to: to.type,
      id: to.id
    };
    switch (from.type) {
      case ENTITY_TYPES.BODY:
      case ENTITY_TYPES.FRAGMENT:
      case ENTITY_TYPES.ELEMENT:
        addElement(item);
        itemIndex = meta.currentElement;
        leaveElement();
        break;
      case ENTITY_TYPES.ATTRIBUTE_VALUE:
        addAttrVal(item);
        itemIndex = meta.currentAttr;
        break;
      case ENTITY_TYPES.PARAM_VALUE:
        addParamVal(item);
        itemIndex = meta.currentParam;
        break;
    }

    var e = locationToEntity(to);
    e.from = generateLocation(from.type, itemIndex);
  }

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

    stateHistory.enter(generateLocation(ENTITY_TYPES.BODY, b.fragment));
    elHistory.jump();
    //  do we need to know about the element the body was contained in?
    //  if so, then we shouldn't nullify currentElement
    // meta.currentElement = null;
    meta.currentState = stateHistory.current();
    meta.currentBody = tdHistory.current();
    meta.currentFragment = tdHistory.current();
  }
  function addReference(r) {
    // add placeholder element
    var tIndex = meta.currentBody,
        currentBody,
        len,
        rIndex;

    if (entities.refs) {
      len = entities.refs.push(r);
      rIndex = len - 1;
    } else {
      entities.refs = [r];
      rIndex = 0;
    }

    currentBody = entities.bodys[tIndex];
    if (currentBody.refs) {
      currentBody.refs.push(rIndex);
    } else {
      currentBody.refs = [rIndex];
    }

    placeholderize(stateHistory.current(), generateLocation(ENTITY_TYPES.REFERENCE, rIndex));
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
    stateHistory.enter(generateLocation(ENTITY_TYPES.PARAM_VALUE, paramIndex));
    // attach param to the current Body
    if (currentBody.params) {
      currentBody.params.push(paramIndex);
    } else {
      currentBody.params = [paramIndex];
    }

    meta.currentParam = paramIndex;
  }

  function addParamVal(v) {
    var valIndex,
        len,
        currentParam = entities.params[meta.currentParam];

    if (entities.vals) {
      len = entities.vals.push(v);
      valIndex = len - 1;
    } else {
      entities.vals = [v];
      valIndex = 0;
    }

    // add it to the current attr
    if (currentParam) {
      if (currentParam.vals) {
        currentParam.vals.push(valIndex);
      } else {
        currentParam.vals = [valIndex];
      }
    }
  }

  function addElement(el) {
    var elIndex;

    el.elements = [];
    if (typeof meta.currentNamespace === "number") {
      el.namespace = meta.currentNamespace;
    }
    // add a new element
    elHistory.enter();
    if (entities.elements) {
      entities.elements.push(el);
    } else {
      entities.elements = [el];
    }

    elIndex = elHistory.current();
    stateHistory.enter(generateLocation(ENTITY_TYPES.ELEMENT, elIndex));
    meta.currentElement = elIndex;
    meta.currentState = stateHistory.current();
  }

  function leaveElement() {
    var elIndex = elHistory.current(),
        currentFragment,
        leavingElement,
        prevNS;
    elHistory.leave();
    stateHistory.leave();
    var parentIndex = elHistory.current();
    if (parentIndex >= 0) {
      entities.elements[parentIndex].elements.push(elIndex);
    } else {
      // add it to the fragment
      currentFragment = entities.fragments[meta.currentFragment];
      if (currentFragment.elements) {
        currentFragment.elements.push(elIndex);
      } else {
        currentFragment.elements = [elIndex];
      }
    }

    leavingElement = entities.elements[elIndex];
    prevNS = leavingElement.originalNamespace;
    // revert to any previous namespaces
    if (typeof prevNS === "number" || prevNS === "default") {
      meta.currentNamespace = prevNS;
    }
    meta.currentElement = parentIndex;
    meta.currentState = stateHistory.current();
  }
  function addAttrVal(v) {
    var valIndex,
        len,
        currentAttr = entities.attrs[meta.currentAttr];

    if (entities.vals) {
      len = entities.vals.push(v);
      valIndex = len - 1;
    } else {
      entities.vals = [v];
      valIndex = 0;
    }

    // add it to the current attr
    if (currentAttr) {
      if (currentAttr.vals) {
        currentAttr.vals.push(valIndex);
      } else {
        currentAttr.vals = [valIndex];
      }
    }
  }

  return {
    addBody: function addBody(b) {
      b = b || {};
      b.mains = [];
      b.bodies = [];
      addBodyAndFragment(b, { elements: [] });
    },
    leaveBody: function leaveBody() {
      var tIndex = tdHistory.current(),

      // elIndex,
      // childBody,
      parentBody,
          childLocation,
          parentLocation;
      tdHistory.leave();
      elHistory.drop();

      childLocation = stateHistory.current();
      stateHistory.leave();
      parentLocation = stateHistory.current();

      var parentIndex = tdHistory.current();
      meta.currentElement = elHistory.current();
      meta.currentState = stateHistory.current();
      meta.currentBody = parentIndex;
      meta.currentFragment = parentIndex;

      // attach to a parent if we have one
      if (parentIndex >= 0) {
        parentBody = entities.bodys[parentIndex];
        parentBody.mains.push(tIndex);

        placeholderize(parentLocation, childLocation);
      }
    },
    addBodies: function addBodies(b) {
      b = b || {};
      b.mains = [];
      b.bodies = [];
      addBodyAndFragment(b, { elements: [] });
    },
    leaveBodies: function leaveBodies() {
      var tIndex = tdHistory.current();
      tdHistory.leave();
      elHistory.drop();
      stateHistory.leave();
      var parentIndex = tdHistory.current();
      if (parentIndex >= 0) {
        entities.bodys[parentIndex].bodies.push(tIndex);
      }

      meta.currentElement = elHistory.current();
      meta.currentState = stateHistory.current();
      meta.currentBody = parentIndex;
      meta.currentFragment = parentIndex;
    },
    meta: meta,
    entities: entities,

    //DOM elements
    addElement: addElement,
    leaveElement: leaveElement,
    // references
    addReference: addReference,
    addAttr: function addAttr(attr) {
      var currentEl = entities.elements[meta.currentElement],
          len,
          attrIndex,
          prevNS;
      // add a row into the attrs table
      if (entities.attrs) {
        len = entities.attrs.push(attr);
        attrIndex = len - 1;
      } else {
        entities.attrs = [attr];
        attrIndex = 0;
      }
      stateHistory.enter(generateLocation(ENTITY_TYPES.ATTRIBUTE_VALUE, attrIndex));
      // attach attr to the current element
      if (currentEl.attrs) {
        currentEl.attrs.push(attrIndex);
      } else {
        currentEl.attrs = [attrIndex];
      }

      // if this is a namespace attr also add the namespace to the current element
      if (attr.key === "xmlns") {
        currentEl.namespace = attrIndex;
        prevNS = meta.currentNamespace;
        if (typeof prevNS === "number" || prevNS === "default") {
          currentEl.originalNamespace = prevNS;
        }
        meta.currentNamespace = attrIndex;
      }

      meta.currentAttr = attrIndex;
    },
    addAttrVal: addAttrVal,
    leaveAttr: function leaveAttr() {
      stateHistory.leave();
      meta.currentAttr = null;
    },
    addPlainText: function addPlainText(t) {
      var currentState = stateHistory.current(),
          type = currentState.type,
          item = { type: "plaintext", content: t };
      switch (type) {
        case ENTITY_TYPES.BODY:
        case ENTITY_TYPES.FRAGMENT:
        case ENTITY_TYPES.ELEMENT:
          addElement(item);
          leaveElement();
          break;
        case ENTITY_TYPES.ATTRIBUTE_VALUE:
          addAttrVal(item);
          break;
        case ENTITY_TYPES.PARAM_VALUE:
          addParamVal(item);
          break;
      }
    },
    addParam: addParam,
    addParamVal: addParamVal,
    leaveParam: function leaveParam() {
      stateHistory.leave();
      meta.currentParam = null;
    },

    //debugging
    _tdHistory: tdHistory,
    _elHistory: elHistory
  };
};

module.exports = Api;
//# sourceMappingURL=Api.js.map