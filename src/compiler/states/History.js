var History = function() {
  var history = [];
  var childrens = []; // an array of children
  var count = 0;
  function current() {
    return history[history.length - 1];
  }
  function store(child) {
    if (history.length) childrens[history.length - 1].push(child);
  }
  this.current = current;
  this.enter = function() {
    history.push(count++);
    childrens.push([]);
  };
  this.leave = function() {
    var val = history.pop();
    if (val) {
      store(val);
    }
  };
  this.children = function() {
    return childrens[history.length - 1];
  };

  this.debugShow = function() {
    return history;
  };

  return this;
};

module.exports = History;
