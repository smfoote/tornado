import visitor from '../visitor';

let generateWalker = visitor.build({
  start(node) {
    console.log(node);
  }
});

export default generateWalker;
