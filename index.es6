import parser from './dist/parser';
import compiler from './dist/compiler';

let tornado = {
  compile(templateString, name, options) {
    return compiler.compile(parser.parse(templateString), name, options);
  }
};

export default tornado;
