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
       return context[path.pop()] || '';
     } else if (!pathLength || pathLength < 0) {
       return '';
     }
     newContext = context[path.pop()];
     if (this.util.isObject(newContext)) {
       return this.get(newContext, path);
     }
     return '';
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
      let parentNode = this.util.getNodeAtIdxPath(root, indexPath);
      let oldNode;
      if (parentNode) {
        oldNode = this.util.getNodeAtIdxPath(parentNode, [finalIndex]);
      } else {
        return;
      }
      if (oldNode) {
        parentNode.replaceChild(newNode, oldNode);
      }
    },

    /**
     * Tornado-specific truthiness (based on dust.isEmpty). 0 is truthy, empty array is falsy,
     * everything else matches JavaScript truthiness.
     * @param {*} val The value to be checked for existence.
     * @return {Boolean}
     */
     exists(val) {
       if (val === 0) {
         return true;
       }
       if (Array.isArray(val) && !val.length) {
         return false;
       }
       return !!val;
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
      }
   }
}

module.exports = tornado;
