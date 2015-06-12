"use strict";

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
      var res = context[path.pop()];
      if (res !== undefined) {
        return this.util.isFunction(res) ? res.bind(context)() : res;
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
   * @param {Array} vals An array of strings and Promises. When all of the promises resolve, the
   * attribute will be set.
   */
  setAttribute: function setAttribute(node, attrName, vals) {
    Promise.all(vals).then(function (values) {
      node.setAttribute(attrName, values.join(""));
    });
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
        return parentNode.replaceChild(node, oldNode);
      });
    } else {
      parentNode.replaceChild(newNode, oldNode);
    }
  },

  /**
   * Check if a value is truthy. If the value is a promise, wait until the promise resolves,
   * then check if the resolved value is truthy. Returns a promise which resolves with the value if
   * truthy (based on Tornado's version of truthiness, inspired by Dust), or rejects if the value is
   * not truthy.
   * @param {*} val The value to be checked for existence.
   * @return {Promise}
   */
  exists: function exists(val) {
    var _this = this;

    return new Promise(function (resolve, reject) {
      if (_this.util.isPromise(val)) {
        val.then(function (data) {
          if (_this.util.isTruthy(data)) {
            resolve(data);
          } else {
            reject("Falsy reference");
          }
        })["catch"](function () {
          return reject();
        });
      } else {
        if (_this.util.isTruthy(val)) {
          resolve(val);
        } else {
          reject("Falsy reference");
        }
      }
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
    var _helperWrapper = function helper(_x, _x2, _x3, _x4) {
      return _helper.apply(this, arguments);
    };

    _helperWrapper.toString = function () {
      return _helper.toString();
    };

    return _helperWrapper;
  })(function (name, context, params, bodies) {
    var _this = this;

    var helper = this.helpers[name];
    if (!helper) {
      throw new Error("Helper not registered: " + name);
    } else {
      return Promise.all(this.util.getValuesFromObject(params)).then(function (values) {
        var resolvedParams = _this.util.arraysToObject(Object.keys(params).sort(), values);
        var returnVal = helper(context, resolvedParams, bodies);
        if (!_this.util.isPromise(returnVal)) {
          returnVal = new Promise(function (resolve) {
            resolve(returnVal);
          });
        }
        return returnVal;
      });
    }
  }),

  /**
   * Render a block or inline partial based of a given name.
   * @param {String} name The name of the block
   * @param {Number} idx The index of the block (in case there are multiples)
   * @param {TornadoTemplate} template The template in which the block was found
   * @return {DocumentFragment}
   */
  block: function block(name, idx, context, template) {
    var renderer = this.getBlockRenderer(name, idx, template);
    if (!renderer) {
      var frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(""));
      return frag;
    }
    return renderer(context);
  },

  getBlockRenderer: function getBlockRenderer(name, idx, template) {
    var renderer = undefined;
    while (template) {
      renderer = template["f_i_" + name];

      if (renderer && typeof renderer === "function") {
        // Prefer the inline partial renderer
        return renderer;
      } else {
        // Fall back to the block renderer
        renderer = template["f_b_" + name + "" + idx];
        if (renderer && typeof renderer === "function") {
          return renderer;
        }
      }
      template = template.parentTemplate;
    }
    // If no renderer is found, undefined will be returned.
  },

  /**
   * Within a given HTML node, find the node at the given index path.
   * for more details.
   * @param {HTMLNode} root The parent node
   * @param {Array} indexPath The path of indexes to the node being searched for.
   * @param {HTMLNode|Boolean} The HTML Node if it is found, or `false`
   */
  getNodeAtIdxPath: function getNodeAtIdxPath(root, indexPath) {
    var nextIdx = undefined;

    if (indexPath.length === 0) {
      return root;
    }

    // Make sure we are dealing with an HTML element
    var intermediateNode = root.childNodes ? root : false;
    while (intermediateNode && indexPath.length) {
      if (intermediateNode.childNodes) {
        nextIdx = indexPath.shift();
        intermediateNode = intermediateNode.childNodes[nextIdx];
      } else {
        return false;
      }
    }
    return intermediateNode || false;
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

  util: {
    /**
     * Determine if a value is an object
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isObject: function isObject(val) {
      return typeof val === "object" && val !== null;
    },

    /**
     * Deterime if a value is a Promise
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isPromise: function isPromise(val) {
      return this.isFunction(val.then);
    },

    /**
     * Determine if a value is a Function
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isFunction: function isFunction(val) {
      return typeof val === "function";
    },

    /**
     * Determine Tornado truthiness
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isTruthy: function isTruthy(val) {
      if (val === 0) {
        return true;
      }
      if (Array.isArray(val) && !val.length) {
        return false;
      }
      return !!val;
    },

    /**
     * Return the values of the object (sorted by key name) as an array
     * @param {Object} obj The object from which the values are to be extracted
     * @return {Array}
     */
    getValuesFromObject: function getValuesFromObject(obj) {
      return Object.keys(obj).sort().map(function (key) {
        return obj[key];
      });
    },

    /**
     * Given two arrays of equal length, the values in the first array become keys and the values of
     * the second array become values of a new object.
     * @param {Object} keys An array with the names of keys for the new object
     * @param {Object} values An array with the values for the new object
     * @return {Object}
     */
    arraysToObject: function arraysToObject(keys, values) {
      var result = {};
      if (!keys.length === values.length) {
        return result;
      }
      for (var i = 0, len = keys.length; i < len; i++) {
        result[keys[i]] = values[i];
      }
      return result;
    }
  }
};

/**
 * Aliases for minification
 */
tornado.r = tornado.register;
tornado.g = tornado.get;
tornado.c = tornado.createTextNode;
tornado.m = tornado.createElement;
tornado.f = tornado.createDocumentFragment;
tornado.s = tornado.setAttribute;
tornado.p = tornado.getPartial;
tornado.n = tornado.replaceNode;
tornado.e = tornado.exists;
tornado.h = tornado.helper;
tornado.b = tornado.block;
tornado.i = tornado.getNodeAtIdxPath;
tornado.t = tornado.nodeToString;

module.exports = tornado;
/*name*/ /*c*/
//# sourceMappingURL=runtime.js.map