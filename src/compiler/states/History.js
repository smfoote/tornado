var History = function() {
  var history = [],
      memory = [];
  var count = 0;
  function current() {
    return history[history.length - 1];
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


  this.debugShow = function() {
    return history;
  };

  return this;
};

module.exports = History;
