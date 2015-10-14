/*global chai it describe */
/*eslint no-eval: 0 */

import compiler from '../dist/compiler';
import parser from '../dist/parser';
import simpleDom from 'simple-dom';

let serializer = new simpleDom.HTMLSerializer(simpleDom.voidMap);

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

        setTimeout(function() {
          let htmlString = serializer.serialize(out);
          describe(test.description, function(){
            it(`Expected ${htmlString} to equal ${test.expectedHTML}`, function(done) {
              chai.assert.equal(htmlString, test.expectedHTML);
              if (test.expectedHTMLResolved) {
                // TODO: Either figure out chai promises or use a smaller timeout and just use mocha
                setTimeout(function() {
                  let resolvedHTMLString = serializer.serialize(out);
                  chai.assert.equal(resolvedHTMLString, test.expectedHTMLResolved);
                  done();
                }, 200);
              } else {
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
