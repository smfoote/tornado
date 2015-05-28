let compiler = require('../dist/compiler'),
    parser = require('../dist/parser');


// Compare the attributes of two nodes for equality
function compareAttrs(a, b) {
  var attr, attrName;
  for (let i = 0, len = a.length; i < len; i++) {
    attr = a[i];
    attrName = attr.name;
    if (!b[attrName] || b[attrName].value !== attr.value) {
      return false;
    }
  }
  return true;
}

// Compare DOM nodes for equality
function compareNodes(a, b) {
  let aChildren = a.childNodes || [];
  let bChildren = b.childNodes || [];
  let aAttributes = a.attributes || [];
  let bAttributes = b.attributes || [];
  if (a.nodeType !== b.nodeType || (a.tagName !== b.tagName)) {
    return false;
  }
  if (a.nodeType === 3 && a.data !== b.data) {
    // Compare text node values
    return false;
  }
  if ((aChildren.length !== bChildren.length) ||
      (aAttributes.length !== bAttributes.length)) {
    return false;
  }
  if (!compareAttrs(aAttributes, bAttributes)) {
    return false;
  }

  for (var i = 0, len = aChildren.length; i < len; i++) {
    let childrenMatch = compareNodes(aChildren[i], bChildren[i]);
    if (!childrenMatch) {
      return false;
    }
  }
  return true;
}

function createTestOutput(test) {
  let li = document.createElement('li');
  let desc = document.createElement('p');
  desc.innerHTML = test.description;
  li.appendChild(desc);
  if (test.fail) {
    li.appendChild(document.createTextNode(test.fail));
  } else {
    li.classList.add('pass');
  }
  return li;
}

function runSuites(suites) {
  const compilerModes = ['dev', 'production'];
  let container = document.querySelector('#output');
  suites.forEach(suite => {
    let suiteContainer = document.createElement('div');
    let header = document.createElement('h2');
    header.appendChild(document.createTextNode(suite.name));
    suiteContainer.appendChild(header);
    container.appendChild(suiteContainer);
    suite.tests.forEach(test => {
      if (test.setup && typeof test.setup === 'function') {
        test.setup(parser, compiler);
      }
      let html = test.template;
      let ast = parser.parse(html);
      for (let i = 0; i < 2; i++) {
        compiler.mode = compilerModes[i];
        let compiledTemplate = compiler.compile(ast, test.name || 'abc');
        let tl;
        eval(`tl = ${compiledTemplate};`);
        let out = tl.render(test.context);
        let res;
        // Wait for promises to resolve
        setTimeout(() => {
          res = compareNodes(out, test.expectedDom);
          if (!res) {
            let div = document.createElement('div');
            div.appendChild(out);
            let expectedDiv = document.createElement('div');
            expectedDiv.appendChild(test.expectedDom);
            test.fail = `Expected ${div.innerHTML} to equal ${expectedDiv.innerHTML}`;
          }
          suiteContainer.appendChild(createTestOutput(test, res));
        }, 0);
      }
    });
  });
}

export default {runSuites};
