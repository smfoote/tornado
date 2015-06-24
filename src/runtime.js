let tornado = {

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
  register(name, template) {
    if (!name || typeof name !== 'string') {
      name = `default${(new Date())}`;
    }
    this.templateCache[name] = template;
  },

  /**
   * Register a helper, overwrite if a helper already exists
   * @param {String} name The name of the helper
   * @param {Function} method The function to be executed when the helper is found in a template
   */
  registerHelper(name, method) {
    this.helpers[name] = method;
  },

  /**
   * Register multiple helpers at once.
   * @param {Object} helpers An object of helpers where the keys are helper names and the
   * values are helper methods
   */
  registerHelpers(helpers) {
    for (let name in helpers) {
      if (helpers.hasOwnProperty(name)) {
        this.registerHelper(name, helpers[name]);
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
  get(context, path) {
    let pathLength = path.length;
    let newContext;
    if (pathLength === 1) {
      // there is only one more item left in the path
      let res = context[path.pop()];
      if (res !== undefined) {
        return this.util.isFunction(res) ? res.bind(context)() : res;
      } else {
        return '';
      }
    } else if (pathLength === 0) {
      // return the current context for {.}
      return context || '';
    } else if (!pathLength || pathLength < 0) {
      // There is something wrong with the path (maybe it was not an array?)
      return '';
    }
    // There are still more steps in the array
    newContext = context[path.shift()];
    if (newContext) {
      if (this.util.isFunction(newContext)) {
        newContext = newContext.bind(context)();
      }

      if (this.util.isPromise(newContext)) {
        return newContext.then(val => this.get(val, path));
      }

      if (this.util.isObject(newContext)) {
        return this.get(newContext, path);
      }
    }
    return '';
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
  getPartial(name, context, parentTemplate) {
    let partial = this.templateCache[name];
    if (partial) {
      return new Promise((resolve/*, reject*/) => {
        partial.parentTemplate = parentTemplate;
        resolve(partial.render(context));
      });
    } else {
      return this.fetchPartial(name)
          .then(partial => {
            partial.parentTemplate = parentTemplate;
            return partial.render(context);
          })
          .catch(error => this.throwError(error));
    }
  },

  /**
   * TODO: Flesh out a good default for this function.
   * Return a promise that resolves with the fetched partial, from wherever you want to fetch it.
   * @param {String} name The name of the partial to be fetched.
   * @return {Promise} A promise that resolves with a Tornado partial
   */
  fetchPartial(/*name*/) {
    return new Promise((resolve/*, reject*/) => {

      // TODO: Make this really work correctly.
      let fakePartial = {
        render(/*c*/) {
          let frag = document.createDocumentFragment();
          frag.appendChild(document.createTextNode('It worked!'));
          return frag;
        }
      };
      resolve(fakePartial);
    });
  },

  /**
   * Check if a value is truthy. If the value is a promise, wait until the promise resolves,
   * then check if the resolved value is truthy.
   * @param {*} val The value to be checked for existence.
   * @param {[Node]} placeholderNode The node which will be replaced with the appropriate body,
   * depending on the results of the exists check.
   * @param {Object} bodies The Tornado bodies that will be inserted depending on the results of the
   * exists check.
   * @param {*} The context in which the exists was created.
   * @return {[String]} If the section is within an HTML attribute, return a string
   */
  exists(val, placeholderNode, bodies, context) {
    if (this.util.isPromise(val)) {
      val.then(data => {
        if (this.util.isTruthy(data)) {
          if (bodies.main) {
            return this.existsResult(placeholderNode, bodies.main, context);
          }
        } else if (bodies.else) {
          return this.existsResult(placeholderNode, bodies.else, context);
        }
      }).catch(() => {
        if (bodies.else) {
          return this.existsResult(placeholderNode, bodies.else, context);
        }
      });
    } else {
      if (this.util.isTruthy(val)) {
        if (bodies.main) {
          return this.existsResult(placeholderNode, bodies.main, context);
        }
      } else if (bodies.else) {
        return this.existsResult(placeholderNode, bodies.else, context);
      }
    }
  },

  /**
   * The notExists is a proxy for the exists method, but first the main and else bodies are switched
   */
  notExists(val, placeholderNode, bodies, context) {
    let mainBody = bodies.main;
    let elseBody = bodies.else;
    bodies.main = elseBody;
    bodies.else = mainBody;
    return this.exists(val, placeholderNode, bodies, context);
  },

  /**
   * Simplify the logic of the this.exists by pulling out the logic that determines if the exists is
   * within an HTML attribute.
   * @param {Node} placeholderNode  If the exists is not in an HTML Attribute, the placeholderNode
   * is the node that will be replaced by the exists body
   * @param {Function} body The appropriate exists body function (e.g. bodies.main and bodies.else)
   * @param {Object} context The context to be used to render the body
   */
  existsResult(placeholderNode, body, context) {
    if (placeholderNode) {
      this.replaceNode(placeholderNode, body(context));
    } else {
      return this.nodeToString(body(context));
    }
  },

  /**
   * Check for truthiness in the same way this.exists checks. If `val` is truthy, render the main
   * body with using `val` as the context (if `val` is an array, loop through the array and render
   * the main body for each value in the array). If `val` is falsy, optionally render the else body
   * using `context`. Handle promises the way this.exists does.
   * @param {*} val The val to be checked.
   * @param {[Node]} placeholderNode The node that will be replaced with the rendered body(ies).
   * @param {Object} bodies The Tornado bodies that will be inserted depending on the results of the
   * truthiness tests.
   * @param {*} context The context in which the section was called.
   * @return {[String]} If within an HTML attribute, return a string.
   */
  section(val, placeholderNode, bodies, context) {
    let body, ctx;
    if (this.util.isPromise(val)) {
      val.then(data => {
        if (this.util.isTruthy(data)) {
          body = bodies.main;
          ctx = data;
        } else {
          body = bodies.else;
          ctx = context;
        }
        return this.sectionResult(ctx, placeholderNode, body);
      }).catch(() => {
        return this.sectionResult(context, placeholderNode, bodies.else);
      });
    } else {
      if (this.util.isTruthy(val)) {
        body = bodies.main;
        ctx = val;
      } else {
        body = bodies.else;
        ctx = context;
      }
      return this.sectionResult(ctx, placeholderNode, body);
    }
  },

  /**
   * Break out the logic of whether the value is an Array and whether the section was called within
   * an HTML attribute.
   * @param {*} val The value to be used to render the body
   * @param {[Node]} placeholderNode The node to be replaced by the results of the body. If the
   * section was called within an HTML attribute, placeholderNode will be null.
   * @param {Function} body The appropriate body rendering function to be rendered with `val`.
   * @return {[String]} Return a string if in an HTML attribute
   */
  sectionResult(val, placeholderNode, body) {
    if (!body) {
      return '';
    }
    if (Array.isArray(val)) {
      if (placeholderNode) {
        let frag = document.createDocumentFragment();
        for (let i = 0, item; (item = val[i]); i++) {
          frag.appendChild(body(item));
        }
        this.replaceNode(placeholderNode, frag);
      } else {
        let attrs = [];
        for (let i = 0, item; (item = val[i]); i++) {
          attrs.push(this.nodeToString(body(item)));
        }
        return attrs.join('');
      }
    } else {
      if (placeholderNode) {
        this.replaceNode(placeholderNode, body(val));
      } else {
        return this.nodeToString(body(val));
      }
    }
  },

  /**
   * Find and return a helper. If no helper of the given name is found, throw an error
   * @param {String} name The name of the helper
   * @param {Object} context The context at the point the helper was called
   * @param {Object} params The params passed to the helper
   * @return {DocumentFragment|Promise}
   */
  helper(name, placeholderNode, context, params, bodies) {
    let helper = this.helpers[name];
    if (!helper) {
      throw new Error(`Helper not registered: ${name}`);
    } else {
      let paramVals = this.util.getValuesFromObject(params);
      if (this.util.hasPromises(paramVals)) {
        Promise.all(paramVals).then(values => {
          let resolvedParams = this.util.arraysToObject(Object.keys(params).sort(), values);
          let returnVal = helper(context, resolvedParams, bodies);
          return this.helperResult(placeholderNode, returnVal);
        });
      } else {
        let returnVal = helper(context, params, bodies);
        return this.helperResult(placeholderNode, returnVal);
      }
    }
  },

  helperResult(placeholderNode, returnVal) {
    if (this.util.isPromise(returnVal)) {
      returnVal.then(frag => {
        if (placeholderNode) {
          this.replaceNode(placeholderNode, frag);
        } else {
          return this.nodeToString(frag);
        }
      });
    } else {
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
   * @param {Number} idx The index of the block (in case there are multiples)
   * @param {TornadoTemplate} template The template in which the block was found
   * @return {DocumentFragment}
   */
  block(name, idx, context, template) {
    let renderer = this.getBlockRenderer(name, idx, template);
    if (!renderer) {
      let frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode(''));
      return frag;
    }
    return renderer(context).frag;
  },

  getBlockRenderer(name, idx, template) {
    let renderer;
    while (template) {
      renderer = template[`f_i_${name}`];

      if (renderer && typeof renderer === 'function') {
        // Prefer the inline partial renderer
        return renderer;
      } else {
        // Fall back to the block renderer
        renderer = template[`f_b_${name}${idx}`];
        if (renderer && typeof renderer === 'function') {
          return renderer;
        }
      }
      template = template.parentTemplate;
    }
    // If no renderer is found, undefined will be returned.
  },

  /**
   * Turn a document fragment into a string
   * @param {DocumentFragment|HTMLElement} frag The document fragment to be turned into a string
   * @return {String}
   */
  nodeToString(frag) {
    let div = document.createElement('div');
    div.appendChild(frag);
    return div.innerHTML;
  },

  /**
   * Replace a given node with a new node. Nothing will happen if the oldNode
   * does not have a parent node
   * @param {Node} oldNode The node to be replaced
   * @param {Node} newNode The new node to be inserted
   */
  replaceNode(oldNode, newNode) {
    if(!oldNode) {
      return;
    }
    let parentNode = oldNode.parentNode;
    let isPromise = this.util.isPromise(newNode);
    if (isPromise) {
      newNode.then(node => {
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
  createTextNode(val) {
    if (this.util.isPromise(val)) {
      return val.then(data => document.createTextNode(data))
                .catch(() => document.createTextNode(''));
    } else {
      return document.createTextNode(val);
    }
  },

  /**
   * Create an HTML comment with the given contents
   * @param {String} contents The contents of the comment
   * @return {HTMLComment}
   */
  createHTMLComment(contents) {
    return document.createComment(contents);
  },

  /**
   * Create a document fragment (lives in runtime so it can be minified)
   * @return {DocumentFragment}
   */
  createDocumentFragment() {
    return document.createDocumentFragment();
  },

  /**
   * Create and return an element, possibly within an XML namespace (other than HTML).
   * @param {String} name The name of the element to be created
   * @param {String} [namespace] The optional XML namespace (e.g. 'http://www.w3.org/2000/svg')
   * @return {HTMLElement}
   */
  createElement(name, namespace) {
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
  setAttribute(node, attrName, vals) {
    if (Array.isArray(vals)) {
      Promise.all(vals).then(values => {
        node.setAttribute(attrName, values.join(''));
      });
    } else {
      node.setAttribute(attrName, vals);
    }
  },

  util: {
    /**
     * Determine if a value is an object
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isObject(val) {
      return typeof val === 'object' && val !== null;
    },

    /**
     * Deterime if a value is a Promise
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isPromise(val) {
      return this.isFunction(val.then);
    },

    /**
     * Check if an Array cotains any promises
     * @param {Array} arr The Array whose values are in question
     * @return {Boolean}
     */
    hasPromises(arr) {
      return arr.some(val => this.isPromise(val));
    },

    /**
     * Determine if a value is a Function
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isFunction(val) {
      return typeof val === 'function';
    },

    /**
     * Determine Tornado truthiness
     * @param {*} val The value in question
     * @return {Boolean}
     */
    isTruthy(val) {
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
    getValuesFromObject(obj) {
      return Object.keys(obj).sort().map(key => obj[key]);
    },

    /**
     * Given two arrays of equal length, the values in the first array become keys and the values of
     * the second array become values of a new object.
     * @param {Object} keys An array with the names of keys for the new object
     * @param {Object} values An array with the values for the new object
     * @return {Object}
     */
    arraysToObject(keys, values) {
      let result = {};
      if (!keys.length === values.length) {
        return result;
      }
      for (let i = 0, len = keys.length; i < len; i++) {
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

export default tornado;
