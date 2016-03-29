let Stack = function() {
  let history = [],
      memory = [];
  let count = 0;
  function current() {
    return history.length ? history[history.length - 1] : null;
  }
  this.current = current;
  this.toArray = function() {
    // return a copy
    return history.slice();
  };
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
  this.clear = function() {
    history = [];
    memory = [];
  };
  return this;
};

export default Stack;
