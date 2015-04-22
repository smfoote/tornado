let PEG = require('pegjs'),
    fs = require('fs'),
    compiler = require('./dist/compiler');
let grammar = fs.readFileSync('grammar.pegjs', {encoding: 'utf8'});
let parser = PEG.buildParser(grammar);
let html = fs.readFileSync('test.td', {encoding: 'utf8'});
let ast = parser.parse(html);
//console.log(JSON.stringify(ast));
console.log(`==START COMPILE==\n\n`);
let compiledTemplate = compiler.compile(ast, 'abc');
console.log(`\n\n==END COMPILE==`);
console.log(`\n\n${compiledTemplate}`);
