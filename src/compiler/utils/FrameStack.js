let Stack = function() {
  let history = [],
      memory = [];
  let count = 0;
  function current() {
    return history.length ? history[history.length - 1] : null;
  }
  this.current = current;
  this.enter = function(item) {
    history.push(item || count++);
  };
  this.leave = function() {
    history.pop();
  };
  this.jump = function() {
    memory.push(history);
    history = [];
  };
  this.drop = function() {
    history = memory.pop();
  };
  return this;
};

let FrameStack = function() {
  let tdStack = new Stack();
  let elStack = new Stack();

  this.current = function() {
    return [tdStack.current(), elStack.current()];
  };
  this.pushTd = function() {
    tdStack.enter();
    elStack.jump();
  };
  this.popTd = function() {
    tdStack.leave();
    elStack.drop();
  };
  this.pushEl = function() {
    elStack.enter();
  };
  this.popEl = function() {
    elStack.leave();
  };
  this.reset = function() {
    tdStack = new Stack();
    elStack = new Stack();
  };
  return this;
};


module.exports = FrameStack;
