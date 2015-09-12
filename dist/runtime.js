"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var util = _interopRequire(require("./util"));

var builtinHelpers = _interopRequire(require("./builtinHelpers"));

var helpers = _interopRequire(require("./helpers"));

var tornado = {

  /**
   * A cache of all registered templates
   */
  templateCache: {},

  /**
   * All registered Helpers
   */
  helpers: {},

  /**
   * Helper context
   */
  helperContext: {
    push: function push() {
      this.__contextStack.push({});
    },
    pop: function pop() {
      return this.__contextStack.pop();
    },
    peek: function peek() {
      return this.__contextStack[this.__contextStack.length - 1];
    },
    get: function get(key) {
      for (var i = this.__contextStack.length - 1; i >= 0; i--) {
        var context = this.__contextStack[i];
        if (context[key] !== undefined) {
          return context[key];
        }
      }
    },
    set: function set(key, val) {
      var context = this.peek();
      context[this.normalizeKey(key)] = val;
    },
    setGlobal: function setGlobal(key, val) {
      this.__contextStack[0][this.normalizeKey(key)] = val;
    },
    clear: function clear(key) {
      this.set(key, null);
    },
    normalizeKey: function normalizeKey(key) {
      // Prepend with $ if $ isn't already present
      return key[0] === "$" ? key : "$" + key;
    },
    // Inititialize the stack with the global scope
    __contextStack: [{}]
  },

  /**
   * Method for registering templates. This method is intended
   * to be called within a compiled template, but can be called
   * outside of that context as well.
   * @param {String} name The name of the template to be registered.
   * If a name is not provided, or the name parameter is not a string,
   * a default name will be provided of the form 'default{TIMESTAMP}'
   * @param {Object} template A Tornado template object.
   */
  register: function register(name, template) {
    if (!name || typeof name !== "string") {
      name = "default" + new Date();
    }
    this.templateCache[name] = template;
  },

  /**
   * Register a helper, overwrite if a helper already exists
   * @param {String} name The name of the helper
   * @param {Function} method The function to be executed when the helper is found in a template
   */
  registerHelper: function registerHelper(name, method) {
    this.helpers[name] = method;
  },

  /**
   * Register multiple helpers at once.
   * @param {Object} helpers An object of helpers where the keys are helper names and the
   * values are helper methods
   */
  registerHelpers: function registerHelpers(helpers) {
    for (var _name in helpers) {
      if (helpers.hasOwnProperty(_name)) {
        this.registerHelper(_name, helpers[_name]);
      }
    }
  },

  /**
   * Method for retrieving values from the given context
   * @param {Object} context The context from which the value should
   * be retrieved.
   * @param {Array} path An array of key names.
   * @return {*} The value at the end of the path, or an empty string.
   */
  get: function get(context, path) {
    var _this = this;

    var pathLength = path.length;
    var newContext = undefined;
    if (pathLength === 1) {
      // there is only one more item left in the path
      var key = path.pop();
      var res = context[key];
      if (res !== undefined) {
        return this.util.isFunction(res) ? res.bind(context)() : res;
      } else if (key[0] === "$" && this.helperContext.get(key) !== undefined) {
        return this.helperContext.get(key);
      } else {
        return "";
      }
    } else if (pathLength === 0) {
      // return the current context for {.}
      return context || "";
    } else if (!pathLength || pathLength < 0) {
      // There is something wrong with the path (maybe it was not an array?)
      return "";
    }
    // There are still more steps in the array
    newContext = context[path.shift()];
    if (newContext) {
      if (this.util.isFunction(newContext)) {
        newContext = newContext.bind(context)();
      }

      if (this.util.isPromise(newContext)) {
        return newContext.then(function (val) {
          return _this.get(val, path);
        });
      }

      if (this.util.isObject(newContext)) {
        return this.get(newContext, path);
      }
    }
    return "";
  },

  /**
   * Get and render a partial. First look in the cache. If the partial is not found there,
   * call td.fetchPartial (which can be user defined), and render the partial that is returned
   * when the Promise returned by td.fetchPartial resolves.
   * @param {String} name The name of the partial to be rendered and returned
   * @param {Object} context The context to be used to render the partial
   * @param {TornadoTemplate} parentTemplate The template object that the template was called from
   * @param {DocumentFragment|Promise}
   */
  getPartial: function getPartial(name, context, parentTemplate) {
    var _this = this;

    var partial = this.templateCache[name];
    if (partial) {
      return new Promise(function (resolve /*, reject*/) {
        partial.parentTemplate = parentTemplate;
        resolve(partial.render(context));
      });
    } else {
      return this.fetchPartial(name).then(function (partial) {
        partial.parentTemplate = parentTemplate;
        return partial.render(context);
      })["catch"](function (error) {
        return _this.throwError(error);
      });
    }
  },

  /**
   * TODO: Flesh out a good default for this function.
   * Return a promise that resolves with the fetched partial, from wherever you want to fetch it.
   * @param {String} name The name of the partial to be fetched.
   * @return {Promise} A promise that resolves with a Tornado partial
   */
  fetchPartial: function fetchPartial() {
    return new Promise(function (resolve /*, reject*/) {

      // TODO: Make this really work correctly.
      var fakePartial = {
        render: function render() {
          var frag = document.createDocumentFragment();
          frag.appendChild(document.createTextNode("It worked!"));
          return frag;
        }
      };
      resolve(fakePartial);
    });
  },

  /**
   * Find and return a helper. If no helper of the given name is found, throw an error
   * @param {String} name The name of the helper
   * @param {Object} context The context at the point the helper was called
   * @param {Object} params The params passed to the helper
   * @return {DocumentFragment|Promise}
   */
  helper: (function (_helper) {
    var _helperWrapper = function helper(_x, _x2, _x3, _x4, _x5) {
      return _helper.apply(this, arguments);
    };

    _helperWrapper.toString = function () {
      return _helper.toString();
    };

    return _helperWrapper;
  })(function (name, placeholderNode, context, params, bodies) {
    var _this = this;

    var helper = this.helpers[name];
    if (!helper) {
      throw new Error("Helper not registered: " + name);
    } else {
      this.helperContext.push();
      var paramVals = this.util.getValuesFromObject(params);
      if (this.util.hasPromises(paramVals)) {
        Promise.all(paramVals).then(function (values) {
          var resolvedParams = _this.util.arraysToObject(Object.keys(params).sort(), values);
          var returnVal = helper(context, resolvedParams, bodies, _this);
          if (returnVal && _this.util.isPromise(returnVal)) {
            placeholderNode = _this.insertPendingBody(placeholderNode, bodies.pending, context) || placeholderNode;
          }
          return _this.helperResult(placeholderNode, returnVal);
        });
      } else {
        var returnVal = helper(context, params, bodies, this);
        if (returnVal && this.util.isPromise(returnVal)) {
          placeholderNode = this.insertPendingBody(placeholderNode, bodies.pending, context) || placeholderNode;
        }
        var res = this.helperResult(placeholderNode, returnVal);
        this.helperContext.pop();
        return res;
      }
    }
  }),

  helperResult: function helperResult(placeholderNode, returnVal) {
    var _this = this;

    returnVal = returnVal || "";
    if (this.util.isPromise(returnVal)) {
      returnVal.then(function (frag) {
        frag = _this.util.isNode(frag) ? frag : _this.createDocumentFragment();
        if (placeholderNode) {
          _this.replaceNode(placeholderNode, frag);
        } else {
          return _this.nodeToString(frag);
        }
      });
    } else {
      returnVal = this.util.isNode(returnVal) ? returnVal : this.createDocumentFragment();
      if (placeholderNode) {
        this.replaceNode(placeholderNode, returnVal);
      } else {
        return this.nodeToString(returnVal);
      }
    }
  },

  /**
   * Render a block or inline partial based of a given name.
   * @param {String} name The name of the block
   * @param {Node} placeholderNode The node where the pending body will be inserted
   * @param {Number} idx The index of the block (in case there are multiples)
   * @param {TornadoTemplate} template The template in which the block was found
   * @return {DocumentFragment}
   */
  block: function block(name, placeholderNode, idx, context, template) {
    var renderer = this.getBlockRenderer(name, idx, template);
    var node = undefined;
    if (!renderer) {
      var frag = this.createDocumentFragment();
      frag.appendChild(document.createTextNode(""));
      node = frag;
    }
    node = renderer.call(template, context);
    if (placeholderNode) {
      this.replaceNode(placeholderNode, node);
    } else {
      return this.nodeToString(node);
    }
  },

  /**
   * Get the renderer for a given block. The renderer may be an inline partial, the block's default
   * content, or an inline partial in a parent template. If no renderer is found, undefined will
   * be returned.
   * @param {String} name The name of the block
   * @param {Number} idx The blocks index within the template
   * @param {Object} template The template within which to look for a renderer
   * @return {Function} The renderer if found, or undefined
   */
  getBlockRenderer: function getBlockRenderer(name, idx, template) {
    var renderer = undefined;
    while (template) {
      renderer = template["r_i_" + name];

      if (renderer && typeof renderer === "function") {
        // Prefer the inline partial renderer
        return renderer;
      } else {
        // Fall back to the block renderer
        renderer = template["r_b_" + name + "" + idx];
        if (renderer && typeof renderer === "function") {
          return renderer;
        }
      }
      template = template.parentTemplate;
    }
    // If no renderer is found, undefined will be returned.
  },

  /**
   * Build a pending body within a div with class "pending" (we have to wrap in a div so we can
   * easily replace the entire thing when the promise resolves). If no pending body exists, then
   * return false.
   * @param {Node} placeholderNode The node where the pending body will be inserted
   * @param {[Function]} body The pending body function, if it exists
   * @param {Object} context The current Tornado context, to be used in building the pending body
   * @return {HTMLElement|False} Return the containing div, or false
   */
  insertPendingBody: function insertPendingBody(placeholderNode, body, context) {
    if (body) {
      var div = document.createElement("div");
      div.setAttribute("class", "tornado-pending");
      div.appendChild(body(context));
      this.replaceNode(placeholderNode, div);
      return div;
    } else {
      return false;
    }
  },

  /**
   * Turn a document fragment into a string
   * @param {DocumentFragment|HTMLElement} frag The document fragment to be turned into a string
   * @return {String}
   */
  nodeToString: function nodeToString(frag) {
    var div = document.createElement("div");
    div.appendChild(frag);
    return div.innerHTML;
  },

  /**
   * Replace a given node with a new node. Nothing will happen if the oldNode
   * does not have a parent node
   * @param {Node} oldNode The node to be replaced
   * @param {Node} newNode The new node to be inserted
   */
  replaceNode: function replaceNode(oldNode, newNode) {
    if (!oldNode) {
      return;
    }
    var parentNode = oldNode.parentNode;
    var isPromise = this.util.isPromise(newNode);
    if (isPromise) {
      newNode.then(function (node) {
        parentNode = oldNode.parentNode;
        parentNode.replaceChild(node, oldNode);
      });
    } else {
      parentNode.replaceChild(newNode, oldNode);
    }
  },

  /**
   * Create a text node (like document.createTextNode), possibly asynchronously if the value is a
   * Promise
   * @param {String|Promise} val The value to be text noded
   * @return {TextNode}
   */
  createTextNode: function createTextNode(val) {
    if (this.util.isPromise(val)) {
      return val.then(function (data) {
        return document.createTextNode(data);
      })["catch"](function () {
        return document.createTextNode("");
      });
    } else {
      return document.createTextNode(val);
    }
  },

  /**
   * Create an HTML comment with the given contents
   * @param {String} contents The contents of the comment
   * @return {HTMLComment}
   */
  createHTMLComment: function createHTMLComment(contents) {
    return document.createComment(contents);
  },

  /**
   * Create a document fragment (lives in runtime so it can be minified)
   * @return {DocumentFragment}
   */
  createDocumentFragment: function createDocumentFragment() {
    return document.createDocumentFragment();
  },

  /**
   * Create and return an element, possibly within an XML namespace (other than HTML).
   * @param {String} name The name of the element to be created
   * @param {String} [namespace] The optional XML namespace (e.g. 'http://www.w3.org/2000/svg')
   * @return {HTMLElement}
   */
  createElement: function createElement(name, namespace) {
    if (namespace) {
      return document.createElementNS(namespace, name);
    } else {
      return document.createElement(name);
    }
  },

  /**
   * Set an attribute on a given node. To support references and promises, the value of the
   * attribute is an array of values
   * @param {HTMLElement} node The element whose attribute is to be set
   * @param {String} attrName The name of the attribute to be set
   * @param {Array|String} vals An array of strings and Promises. When all of the promises resolve,
   * the attribute will be set. If vals is a String, the attribute will be set immediately.
   */
  setAttribute: function setAttribute(node, attrName, vals) {
    if (Array.isArray(vals)) {
      Promise.all(vals).then(function (values) {
        node.setAttribute(attrName, values.join(""));
      });
    } else {
      node.setAttribute(attrName, vals);
    }
  },

  util: util
};

/**
 * Aliases for minification
 */
tornado.r = tornado.register;
tornado.g = tornado.get;
tornado.t = tornado.createTextNode;
tornado.c = tornado.createHTMLComment;
tornado.m = tornado.createElement;
tornado.f = tornado.createDocumentFragment;
tornado.a = tornado.setAttribute;
tornado.p = tornado.getPartial;
tornado.n = tornado.replaceNode;
tornado.e = tornado.exists;
tornado.h = tornado.helper;
tornado.b = tornado.block;
tornado.s = tornado.nodeToString;

tornado.registerHelpers(builtinHelpers);
tornado.registerHelpers(helpers);

module.exports = tornado;
/*name*/ /*c*/
//# sourceMappingURL=runtime.js.map