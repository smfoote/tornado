let tornado = {

  /**
   * A cache of all registered templates
   */
  templateCache: {},

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
    if (this.util.isFunction(newContext)) {
      newContext = newContext.bind(context)();
      if (this.util.isPromise(newContext)) {
        return newContext.then(val => this.get(val, path));
      }
      // If newContext is not a promise, it will pass through to the next if statement
    }
    if (this.util.isObject(newContext)) {
      return this.get(newContext, path);
    }
    return '';
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
                .catch(error => document.createTextNode(''));
    } else {
      return document.createTextNode(val);
    }
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
   * @param {Array} vals An array of strings and Promises. When all of the promises resolve, the
   * attribute will be set.
   */
  setAttribute(node, attrName, vals) {
    Promise.all(vals).then(values => {
      node.setAttribute(attrName, values.join(''));
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
  getPartial(name, context, parentTemplate) {
    let partial = this.templateCache[name];
    if (partial) {
      return new Promise((resolve, reject) => {
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
  fetchPartial(name) {
    return new Promise((resolve, reject) => {

      // TODO: Make this really work correctly.
      let fakePartial = {
        render(c) {
          let frag = document.createDocumentFragment();
          frag.appendChild(document.createTextNode('It worked!'));
          return frag;
        }
      };
      resolve(fakePartial);
    });
  },

  /**
   * Replace a DOM node (text or element or comment or whatever) with a given
   * set of indexes from the root element. If a node is not found in the path of indexes, the
   * function does nothing.
   * @example
   *
   * Root element
   * ============
   * [documentFragment]<div>This is some text. <span>And a span.</span></div>[/documentFragment]
   *
   * Method call
   * ===========
   * // The call below would replace the text node "And a span." with `myNewNode`.
   * td.replaceChildAtIdx(root, [0,1,0], myNewNode);
   * // [
   *      0 **the outer div is the 0th child of the root**,
   *      1 **the span is the 1st child of the div**,
   *      0 **the text node is the 0th child of the span**
   *    ]
   *
   * @param {DocumentFragment} root When used within a compiled template, this is always a document
   * fragment, but it could be a regular HTML Element
   * @param {Array} indexPath An array of indexes leading to the node to be replaced
   * @param {Node} newNode The node to take the place of the replaced node.
   */
  replaceChildAtIdxPath(root, indexPath, newNode) {
    let finalIndex = indexPath.pop();
    let parentNode = this.getNodeAtIdxPath(root, indexPath);
    let isPromise = this.util.isPromise(newNode);
    let oldNode;
    if (parentNode) {
      oldNode = this.getNodeAtIdxPath(parentNode, [finalIndex]);
    } else {
      return;
    }
    if (oldNode) {
      if (isPromise) {
        newNode.then(node => {
          parentNode = oldNode.parentNode;
          parentNode.replaceChild(node, oldNode);
        });
      } else {
        parentNode.replaceChild(newNode, oldNode);
      }
    } else if (finalIndex >= parentNode.childNodes.length) {
      if (isPromise) {
        newNode.then(node => parentNode.appendChild(node));
      } else {
        parentNode.appendChild(newNode);
      }
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
  exists(val) {
    return new Promise((resolve, reject) => {
      if (this.util.isPromise(val)) {
        val.then(data => {
          if (this.util.isTruthy(data)) {
            resolve(data);
          } else {
            reject('Falsy reference');
          }
        }).catch(() => {
          return reject();
        });
      } else {
        if (this.util.isTruthy(val)) {
          resolve(val);
        } else {
          reject('Falsy reference');
        }
      }
    });
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
    return renderer(context);
  },

  getBlockRenderer(name, idx, template) {
    let renderer;
    while (template) {
      renderer = template[`f_i_${name}`];

      if (renderer && typeof renderer === 'function') {
        // Prefer the inline partial renderer
        return renderer
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
   * Within a given HTML node, find the node at the given index path. See replaceChildAtIdxPath
   * for more details.
   * @param {HTMLNode} root The parent node
   * @param {Array} indexPath The path of indexes to the node being searched for.
   * @param {HTMLNode|Boolean} The HTML Node if it is found, or `false`
   */
  getNodeAtIdxPath(root, indexPath) {
    let nextIdx;

    if (indexPath.length === 0) {
      return root;
    }

    // Make sure we are dealing with an HTML element
    let intermediateNode = root.childNodes ? root : false;
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
  nodeToString(frag) {
    let div = document.createElement('div');
    div.appendChild(frag);
    return div.innerHTML;
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
     }
  }
};

module.exports = tornado;
