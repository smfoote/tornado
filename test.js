"use strict";

var PEG = require("pegjs"),
    fs = require("fs"),
    compiler = require("./dist/compiler");
var grammar = fs.readFileSync("grammar.pegjs", { encoding: "utf8" });
var parser = PEG.buildParser(grammar);
var html = "<div class=\"prash {name} jain\" id=\"body\"><ul><li><div>Some text <span>{with}</span> some other {text}: <button>{hello} <b>me</b>!</button></div></li></ul></div>";
var ast = parser.parse(html);
//console.log(JSON.stringify(ast));
console.log("==START COMPILE==\n\n");
var compiledTemplate = compiler.compile(ast, "abc");
console.log("\n\n==END COMPILE==");
console.log("\n\n" + compiledTemplate);
//# sourceMappingURL=test.js.map