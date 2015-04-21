let PEG = require('pegjs'),
    fs = require('fs'),
    compiler = require('./dist/compiler');
let grammar = fs.readFileSync('grammar.pegjs', {encoding: 'utf8'});
let parser = PEG.buildParser(grammar);
let html = `<div class="prash {name} jain" id="body"><ul><li><div>Some text <span>{with}</span> some other {text}: <button>{hello} <b>me</b>!</button></div></li></ul></div>`;
let ast = parser.parse(html);
//console.log(JSON.stringify(ast));
console.log(`==START COMPILE==\n\n`);
let compiledTemplate = compiler.compile(ast, 'abc');
console.log(`\n\n==END COMPILE==`);
console.log(`\n\n${compiledTemplate}`);
