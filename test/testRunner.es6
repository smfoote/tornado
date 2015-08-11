import compiler from '../dist/compiler';
import parser from '../dist/parser';
import simpleDom from 'simple-dom';

let doc = new simpleDom.Document();
let serializer = new simpleDom.HTMLSerializer(simpleDom.voidMap);

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
// TODO: remove this once all the expectedDoms are converted to expectedHTMLs
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

// FIXME: Why is this needed?
describe('tests are about to run', function(){
  it('should initiate tests', function(){
      chai.assert.equal('x', 'x');
  });
});

function runSuites(suites) {
  const compilerModes = ['dev', 'production'];
  suites.forEach(suite => {
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
        res = false;

        setTimeout(function() {
          let htmlString = serializer.serialize(out);
          describe(test.description, function(){
            it(`Expected ${htmlString} to equal ${test.expectedHTML}`, function(done){
              if (test.expectedHTML) {
                chai.assert.equal(htmlString, test.expectedHTML);

                if (test.expectedHTMLResolved) {
                  setTimeout(function() {
                    let resolvedHTMLString = serializer.serialize(out);
                    chai.assert.equal(resolvedHTMLString, test.expectedHTMLResolved);
                    done();
                  }, 200);
                } else {
                    done();
                }
              } else {
                // TODO: remove this once all the expectedDoms are converted to expectedHTMLs
                chai.assert.equal(compareNodes(out, test.expectedDom), true);
                done();
              }
            });
          });
        }, 0); 
      }
    });
  });
}

export default {runSuites};
