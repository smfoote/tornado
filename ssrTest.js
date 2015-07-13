var parser = require('./dist/parser');
var compiler = require('./dist/compiler'),
    td = require('./dist/runtime'),
    tdSSR = require('./dist/ssr');

global.td = td;
var tlString = '<p>Hello, {#friends}{.}, {/friends}</p>';
var tl = compiler.compile(parser.parse(tlString), 'ssrTest');
tl = eval(tl);
var out = tdSSR.render(tl, {friends: ['Jimmy', 'Kate', 'Prash']});
console.log(out);
