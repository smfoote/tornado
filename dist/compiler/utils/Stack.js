"use strict";

var Stack = function Stack() {
  var history = [],
      memory = [];
  var count = 0;
  function current() {
    return history.length ? history[history.length - 1] : null;
  }
  this.current = current;
  this.enter = function (item) {
    history.push(item || count++);
  };
  this.leave = function () {
    history.pop();
  };
  this.jump = function () {
    memory.push(history);
    history = [];
  };
  this.drop = function () {
    history = memory.pop();
  };
  this.clear = function () {
    history = [];
    memory = [];
  };
  return this;
};

module.exports = Stack;
//# sourceMappingURL=Stack.js.map