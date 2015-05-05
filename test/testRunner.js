"use strict";

var compiler = require("../dist/compiler"),
    parser = require("../dist/parser");

function runSuites(suites) {
  var container = document.querySelector("#output");
  suites.forEach(function (suite) {
    var suiteContainer = document.createElement("div");
    var header = document.createElement("h2");
    header.appendChild(document.createTextNode(suite.name));
    suiteContainer.appendChild(header);
    container.appendChild(suiteContainer);
    suite.tests.forEach(function (test) {
      var html = test.template;
      var ast = parser.parse(html);
      var compiledTemplate = compiler.compile(ast, "abc");
      var tl = undefined;
      eval("tl = " + compiledTemplate + ";");
      var out = tl.render(test.context);
      var res = undefined;
      setTimeout(function () {
        res = compareNodes(out, test.expectedDom);
        if (!res) {
          var div = document.createElement("div");
          div.appendChild(out);
          var expectedDiv = document.createElement("div");
          expectedDiv.appendChild(test.expectedDom);
          test.fail = "Expected " + div.innerHTML + " to equal " + expectedDiv.innerHTML;
        }
        suiteContainer.appendChild(createTestOutput(test, res));
      }, 0);
    });
  });
}

function createTestOutput(test, res) {
  var li = document.createElement("li");
  var desc = document.createElement("p");
  desc.innerHTML = test.description;
  li.appendChild(desc);
  if (test.fail) {
    li.appendChild(document.createTextNode(test.fail));
  } else {
    li.classList.add("pass");
  }
  return li;
}

// Compare DOM nodes for equality
function compareNodes(a, b) {
  var aChildren = a.childNodes || [];
  var bChildren = b.childNodes || [];
  var aAttributes = a.attributes || [];
  var bAttributes = b.attributes || [];
  var childrenMatch = true;
  if (a.nodeType !== b.nodeType) {
    return false;
  }
  if (a.nodeType === 3 && a.data !== b.data) {
    // Compare text node values
    return false;
  }
  if (aChildren.length !== bChildren.length || aAttributes.length !== bAttributes.length) {
    return false;
  }
  if (!compareAttrs(aAttributes, bAttributes)) {
    return false;
  }

  for (var i = 0, len = aChildren.length; i < len; i++) {
    childrenMatch = compareNodes(aChildren[i], bChildren[i]);
  }
  return childrenMatch;
}

// Compare the attributes of two nodes for equality
function compareAttrs(a, b) {
  var attr, attrName;
  for (var i = 0, len = a.length; i < len; i++) {
    attr = a[0];
    attrName = attr.name;
    if (!b[attrName] || b[attrName].value !== attr.value) {
      return false;
    }
  }
  return true;
}

module.exports = {
  runSuites: runSuites
};
//# sourceMappingURL=testRunner.js.map