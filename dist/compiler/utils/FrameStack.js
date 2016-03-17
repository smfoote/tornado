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
  return this;
};

var FrameStack = function FrameStack() {
  var tdStack = new Stack();
  var elStack = new Stack();
  var phStack = new Stack();

  this.current = function () {
    return [tdStack.current(), elStack.current(), phStack.current()];
  };
  this.pushTd = function () {
    tdStack.enter();
    elStack.jump();
    phStack.jump();
  };
  this.popTd = function () {
    tdStack.leave();
    elStack.drop();
    phStack.drop();
  };
  this.pushEl = function () {
    elStack.enter();
  };
  this.popEl = function () {
    elStack.leave();
  };
  this.pushPh = function () {
    phStack.enter();
  };
  this.popPh = function () {
    phStack.leave();
  };
  this.reset = function () {
    tdStack = new Stack();
    elStack = new Stack();
    phStack = new Stack();
  };
  return this;
};

module.exports = FrameStack;
//# sourceMappingURL=FrameStack.js.map