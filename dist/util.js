"use strict";

module.exports = {
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
   * Check if an Array cotains any promises
   * @param {Array} arr The Array whose values are in question
   * @return {Boolean}
   */
  hasPromises: function hasPromises(arr) {
    var _this = this;

    return arr.some(function (val) {
      return _this.isPromise(val);
    });
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
   * Determine if a value is a HTML Node
   * @param {*} val The value in question
   * @return {Boolean}
   */
  isNode: function isNode(val) {
    return val instanceof Node;
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
  },

  /**
   * Throw an error if a condition is falsy (the condition may be a function, whose result will be
   * evaluated for truthiness).
   * @param {Boolean|Function} condition The condition to be evaluated
   * @param {String} description The description to be used when thorwing an error
   */
  assert: function assert(condition, description) {
    if (this.isFunction(condition)) {
      condition = condition();
    }
    if (!condition) {
      throw new Error(description);
    }
  }
};
//# sourceMappingURL=util.js.map