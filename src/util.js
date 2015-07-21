export default {
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
   * Determine if a value is a HTML Node
   * @param {*} val The value in question
   * @return {Boolean}
   */
  isNode(val) {
    return val instanceof Node;
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
  },

  /**
   * Throw an error if a condition is falsy (the condition may be a function, whose result will be
   * evaluated for truthiness).
   * @param {Boolean|Function} condition The condition to be evaluated
   * @param {String} description The description to be used when thorwing an error
   */
  assert(condition, description) {
    if (this.isFunction(condition)) {
      condition = condition();
    }
    if (!condition) {
      throw new Error(description);
    }
  }
};
