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
  let phStack = new Stack();
  let attrStack = new Stack();

  this.current = function() {
    return [tdStack.current(), elStack.current(), phStack.current(), attrStack.current()];
  };
  this.pushTd = function() {
    tdStack.enter();
    elStack.jump();
    phStack.jump();
    attrStack.jump();
  };
  this.popTd = function() {
    tdStack.leave();
    elStack.drop();
    phStack.drop();
    attrStack.drop();
  };
  this.pushEl = function() {
    elStack.enter();
  };
  this.popEl = function() {
    elStack.leave();
  };
  this.pushPh = function() {
    phStack.enter();
  };
  this.popPh = function() {
    phStack.leave();
  };
  this.pushAttr = function() {
    attrStack.enter();
  };
  this.popAttr = function() {
    attrStack.leave();
  };
  this.reset = function() {
    tdStack = new Stack();
    elStack = new Stack();
    phStack = new Stack();
    attrStack = new Stack();
  };
  return this;
};


module.exports = FrameStack;
