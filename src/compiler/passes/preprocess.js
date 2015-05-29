import visitor from '../visitor';

let generatedWalker = visitor.build({
  start: function(node) {
    console.log(node);
  }
});

let preprocess = function(ast, options) {
  generatedWalker(ast);
};

export default preprocess;
