/*global td: false */

let suite = {
  name: 'Helpers',
  tests: [
    {
      description: 'Helper returns a document fragment',
      setup() {
        td.registerHelper('createDiv', () => {
          let frag = document.createDocumentFragment();
          frag.appendChild(document.createElement('div'));
          return frag;
        });
      },
      template: '{@createDiv/}',
      context: {},
      expectedHTML: '<div></div>'
    },
    {
      description: 'Helper with a parameter',
      setup() {
        td.registerHelper('createEl', (context, params) => {
          let frag = document.createDocumentFragment();
          frag.appendChild(document.createElement(params.name));
          return frag;
        });
      },
      template: '{@createEl name="div"/}',
      context: {},
      expectedHTML: '<div></div>'
    },
    {
      description: 'Helper with a parameter that is a Tornado reference',
      setup() {
        td.registerHelper('createEl', (context, params) => {
          let frag = document.createDocumentFragment();
          frag.appendChild(document.createElement(params.name));
          return frag;
        });
      },
      template: '{@createEl name=elName/}',
      context: {elName: 'div'},
      expectedHTML: '<div></div>'
    },
    {
      description: 'Helper with a parameter that is a Tornado reference with a promise',
      setup() {
        td.registerHelper('createEl', (context, params) => {
          let frag = document.createDocumentFragment();
          frag.appendChild(document.createElement(params.name));
          return frag;
        });
      },
      template: '{@createEl name=elName/}',
      context: {elName: new Promise(resolve=> {
        resolve('div');
      })},
      expectedHTML: '<div></div>'
    },
    {
      description: 'Helper with a body (tests @eq with strings)',
      template: '{@eq key="hello" val="hello"}<div>Hello, helpers!</div>{/eq}',
      context: {},
      expectedHTML: '<div>Hello, helpers!</div>'
    },
    {
      description: 'Helper with an else body (tests @eq where strings are not equal)',
      template: '{@eq key="hello" val="hi"}<div>Hello, helpers!</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {},
      expectedHTML: '<div>Not equal :(</div>'
    },
    {
      description: 'Helper with a named body',
      setup() {
        td.registerHelper('waffles', (context, params, bodies) => {
          if (params.key === params.val) {
            return bodies.main(context);
          } else if (bodies.waffles) {
            return bodies.waffles(context);
          }
        });
      },
      template: '{@waffles key="hello" val="hi"}<div>Hello, helpers!</div>{:waffles}<div>I love waffles!</div>{/waffles}',
      context: {},
      expectedHTML: '<div>I love waffles!</div>'
    },
    {
      description: '@eq with equal numbers',
      template: '{@eq key=5 val=5}<div>2 + 2</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {},
      expectedHTML: '<div>2 + 2</div>'
    },
    {
      description: '@eq with non-equal numbers',
      template: '{@eq key=5 val=6}<div>2 + 2</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {},
      expectedHTML: '<div>Not equal :(</div>'
    },
    {
      description: '@eq with dynamic values',
      template: '{@eq key=5 val=numFriends}<div>Just the right amount of friends</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {
        friends: ['Prash', 'Jimmy', 'Kate', 'Seth', 'Tonya'],
        numFriends: function() {
          return this.friends.length;
        }
      },
      expectedHTML: '<div>Just the right amount of friends</div>'
    },
    {
      description: '@ne with non-equal numbers',
      template: '{@ne key=5 val=6}<div>2 + 2</div>{:else}<div>These are equal :(</div>{/ne}',
      context: {},
      expectedHTML: '<div>2 + 2</div>'
    },
    {
      description: '@ne with equal numbers',
      template: '{@ne key=5 val=5}<div>2 + 2</div>{:else}<div>These are equal :(</div>{/ne}',
      context: {},
      expectedHTML: '<div>These are equal :(</div>'
    },
    {
      description: '@ne with key and val of 0',
      template: '{@ne key=0 val=0}<div>2 + 2</div>{:else}<div>These are equal :(</div>{/ne}',
      context: {},
      expectedHTML: '<div>These are equal :(</div>'
    },
    {
      description: '@ne with non-equal strings',
      template: '{@ne key="hello" val="bonjour"}<div>Bonjour, ça va?</div>{:else}<div>Huh?</div>{/ne}',
      context: {},
      expectedHTML: '<div>Bonjour, ça va?</div>'
    },
    {
      description: '@ne with equal strings',
      template: '{@ne key="Bom dia" val="Bom dia"}<div>Tudo bem, filho?</div>{:else}<div>Huh?</div>{/ne}',
      context: {},
      expectedHTML: '<div>Huh?</div>'
    },
    {
      description: '@gt where key is greater than val',
      template: '{@gt key=42 val=2}<div>This is the answer?</div>{/gt}',
      context: {},
      expectedHTML: '<div>This is the answer?</div>'
    },
    {
      description: '@gt where key is less than val',
      template: '{@gt key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/gt}',
      context: {},
      expectedHTML: '<div>What was the question?</div>'
    },
    {
      description: '@gt where key and val are equal',
      template: '{@gt key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/gt}',
      context: {},
      expectedHTML: '<div>They are the same</div>'
    },
    {
      description: '@gte where key is greater than val',
      template: '{@gte key=42 val=2}<div>This is the answer?</div>{/gte}',
      context: {},
      expectedHTML: '<div>This is the answer?</div>'
    },
    {
      description: '@gte where key is less than val',
      template: '{@gte key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/gte}',
      context: {},
      expectedHTML: '<div>What was the question?</div>'
    },
    {
      description: '@gte where key and val are equal',
      template: '{@gte key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/gte}',
      context: {},
      expectedHTML: '<div>This is the answer?</div>'
    },
    {
      description: '@lt where key is greater than val',
      template: '{@lt key=42 val=2}<div>This is the answer?</div>{/lt}',
      context: {},
      expectedHTML: ''
    },
    {
      description: '@lt where key is less than val',
      template: '{@lt key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/lt}',
      context: {},
      expectedHTML: '<div>This is the answer?</div>'
    },
    {
      description: '@lt where key and val are equal',
      template: '{@lt key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/lt}',
      context: {},
      expectedHTML: '<div>They are the same</div>'
    },
    {
      description: '@lte where key is greater than val',
      template: '{@lte key=42 val=2}<div>This is the answer?</div>{/lte}',
      context: {},
      expectedHTML: ''
    },
    {
      description: '@lte where key is less than val',
      template: '{@lte key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/lte}',
      context: {},
      expectedHTML: '<div>This is the answer?</div>'
    },
    {
      description: '@lte where key and val are equal',
      template: '{@lte key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/lte}',
      context: {},
      expectedHTML: '<div>This is the answer?</div>'
    },
    {
      description: '@sep in a section-loop with just one item',
      template: '{#names}{.}{@sep}; {/sep}{/names}',
      context: {
        names: ['Steven']
      },
      expectedHTML: 'Steven'
    },
    {
      description: '@sep in a section-loop with multiple items',
      template: '{#names}{.}{@sep}; {/sep}{/names}',
      context: {
        names: ['Steven', 'Jimmy', 'Prash']
      },
      expectedHTML: 'Steven; Jimmy; Prash'
    },
    {
      description: '@sep in a nested section-loop with multiple items',
      template: '{#names}{first} {#last}{.}{@sep},{/sep}{/last}{@sep}; {/sep}{/names}',
      context: {
        names: [
          {first: 'Steven', last: ['F', 'o', 'o', 't', 'e']},
          {first: 'Prash', last: ['J', 'a', 'i', 'n']}
        ]
      },
      expectedHTML: 'Steven F,o,o,t,e; Prash J,a,i,n'
    },
    {
      description: '@sep in a section-loop with no items',
      template: '{#names}{.}{@sep}; {/sep}{/names}',
      context: {
        names: []
      },
      expectedHTML: ''
    },
    {
      description: '@sep outside of a loop',
      template: '<span>{@sep}artificial separation{/sep}</span>',
      context: {},
      expectedHTML: '<span></span>'
    },
    {
      description: '@first in a loop with one item',
      template: '{#names}<span class="{@first}first{/first}">{.}</span>{/names}',
      context: {
        names: ['Steven']
      },
      expectedHTML: '<span class="first">Steven</span>'
    },
    {
      description: '@first in a loop with multiple items',
      template: '{#names}<span class="{@first}first{/first}">{.}</span>{/names}',
      context: {
        names: ['Steven', 'Jimmy', 'Prash']
      },
      expectedHTML: '<span class="first">Steven</span><span class>Jimmy</span><span class>Prash</span>'
    },
    {
      description: '@first in a nested loop with multiple items',
      template: '{#names}<div class="container{@first} outer-first{/first}">{#last}<span class="{@first}first{/first}">{.}</span>{/last}</div>{/names}',
      context: {
        names: [
          {first: 'Steven', last: ['F', 'o', 'o', 't', 'e']},
          {first: 'Prash', last: ['J', 'a', 'i', 'n']}
        ]
      },
      expectedHTML: '<div class="container outer-first"><span class="first">F</span><span class>o</span><span class>o</span><span class>t</span><span class>e</span></div><div class="container"><span class="first">J</span><span class>a</span><span class>i</span><span class>n</span></div>'
    },
    {
      description: '@first in a loop with no items',
      template: '{#names}<span class="{@first}first{/first}">{.}</span>{/names}',
      context: {
        names: []
      },
      expectedHTML: ''
    },
    {
      description: '@first outside of a loop',
      template: '<span class="{@first}first{/first}"></span>',
      context: {
        names: []
      },
      expectedHTML: '<span class></span>'
    },
    {
      description: '@last in a loop with one item',
      template: '{#names}<span class="{@last}last{/last}">{.}</span>{/names}',
      context: {
        names: ['Steven']
      },
      expectedHTML: '<span class="last">Steven</span>'
    },
    {
      description: '@last in a loop with multiple items',
      template: '{#names}<span class="{@last}last{/last}">{.}</span>{/names}',
      context: {
        names: ['Steven', 'Jimmy', 'Prash']
      },
      expectedHTML: '<span class>Steven</span><span class>Jimmy</span><span class="last">Prash</span>'
    },
    {
      description: '@last in a nested loop with multiple items',
      template: '{#names}<div class="container{@last} outer-last{/last}">{#last}<span class="{@last}last{/last}">{.}</span>{/last}</div>{/names}',
      context: {
        names: [
          {first: 'Steven', last: ['F', 'o', 'o', 't', 'e']},
          {first: 'Prash', last: ['J', 'a', 'i', 'n']}
        ]
      },
      expectedHTML: '<div class="container"><span class>F</span><span class>o</span><span class>o</span><span class>t</span><span class="last">e</span></div><div class="container outer-last"><span class>J</span><span class>a</span><span class>i</span><span class="last">n</span></div>'
    },
    {
      description: '@last in a loop with no items',
      template: '{#names}<span class="{@last}last{/last}">{.}</span>{/names}',
      context: {
        names: []
      },
      expectedHTML: ''
    },
    {
      description: '@last outside of a loop',
      template: '<span class="{@last}last{/last}"></span>',
      context: {
        names: []
      },
      expectedHTML: '<span class></span>'
    },
    {
      description: '@select with only @default',
      template: '{@select key=type}{@default}Default{/default}{/select}',
      context: {
        type: 'green'
      },
      expectedHTML: 'Default'
    },
    {
      description: '@select with @eq that matches',
      template: '{@select key=type}{@eq val="green"}GREEN!{/eq}{/select}',
      context: {
        type: 'green'
      },
      expectedHTML: 'GREEN!'
    },
    {
      description: '@select with multiple @eq, one that matches',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{/select}',
      context: {
        type: 'green'
      },
      expectedHTML: 'GREEN!'
    },
    {
      description: '@select with multiple @eq, none match',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{/select}',
      context: {
        type: 'yellow'
      },
      expectedHTML: ''
    },
    {
      description: '@select with multiple @eq, none match, and a @default',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{@default}A lack of color here{/default}{/select}',
      context: {
        type: 'yellow'
      },
      expectedHTML: 'A lack of color here'
    },
    {
      description: '@select with multiple @eq, one match, and a @default',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{@default}A lack of color here{/default}{/select}',
      context: {
        type: 'green'
      },
      expectedHTML: 'GREEN!'
    },
    {
      description: 'Nested @select',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@default}A lack of {@select key=category}{@eq val="color"}color{/eq}{/select} here{/default}{/select}',
      context: {
        type: 'green',
        category: 'color'
      },
      expectedHTML: 'A lack of color here'
    },
    {
      description: 'Nested @select with nested @default',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@default}A lack of {@select key=category}{@eq val="color"}color{/eq}{@default}category{/default}{/select} here{/default}{/select}',
      context: {
        type: 'green',
        category: 'stuff'
      },
      expectedHTML: 'A lack of category here'
    },
    {
      description: '@math with no body -- add',
      template: '{@math a=1 b=2 operator="add"/}',
      context: {},
      expectedHTML: '3'
    },
    {
      description: '@math with no body -- (+)',
      template: '{@math a=1 b=2 operator="+"/}',
      context: {},
      expectedHTML: '3'
    },
    {
      description: '@math with no body -- subtract',
      template: '{@math a=1 b=2 operator="subtract"/}',
      context: {},
      expectedHTML: '-1'
    },
    {
      description: '@math with no body -- (-))',
      template: '{@math a=1 b=2 operator="-"/}',
      context: {},
      expectedHTML: '-1'
    },
    {
      description: '@math with no body -- multiply',
      template: '{@math a=7 b=6 operator="multiply"/}',
      context: {},
      expectedHTML: '42'
    },
    {
      description: '@math with no body -- (*)',
      template: '{@math a=7 b=6 operator="*"/}',
      context: {},
      expectedHTML: '42'
    },
    {
      description: '@math with no body -- divide',
      template: '{@math a=144 b=12 operator="divide"/}',
      context: {},
      expectedHTML: '12'
    },
    {
      description: '@math with no body -- (/)',
      template: '{@math a=144 b=12 operator="/"/}',
      context: {},
      expectedHTML: '12'
    },
    {
      description: '@math with no body -- mod',
      template: '{@math a=15 b=12 operator="mod"/}',
      context: {},
      expectedHTML: '3'
    },
    {
      description: '@math with no body -- (%)',
      template: '{@math a=15 b=12 operator="%"/}',
      context: {},
      expectedHTML: '3'
    },
    {
      description: '@math with no body -- ceil',
      template: '{@math a=1.5 operator="ceil"/}',
      context: {},
      expectedHTML: '2'
    },
    {
      description: '@math with no body -- floor',
      template: '{@math a=1.5 operator="floor"/}',
      context: {},
      expectedHTML: '1'
    },
    {
      description: '@math with no body -- round',
      template: '{@math a=1.5 operator="round"/}',
      context: {},
      expectedHTML: '2'
    },
    {
      description: '@math with no body -- abs',
      template: '{@math a=-15 operator="abs"/}',
      context: {},
      expectedHTML: '15'
    },
    {
      description: '@math with no body -- toint',
      template: '{@math a=age operator="toint"/}',
      context: {
        age: '15'
      },
      expectedHTML: '15'
    },
    {
      description: '@math with body and @eq',
      template: '{@math a=5 b=10 operator="add"}{@eq val=15}!Quinceanera!{/eq}{/math}',
      context: {
        age: '15'
      },
      expectedHTML: '!Quinceanera!'
    },
    {
      description: '@math with body and @gt',
      template: '{@math a=hour b=12 operator="mod"}{@gt val=3}It\'s past 3 o\'clock{/gt}{/math}',
      context: {
        hour: '17'
      },
      expectedHTML: 'It\'s past 3 o\'clock'
    },
    {
      description: '@math with body and @default',
      template: '{@math a=hour b=12 operator="mod"}{@gt val=3}It\'s past 3 o\'clock{/gt}{@default}It\'s not past 3 yet{/default}{/math}',
      context: {
        hour: '15'
      },
      expectedHTML: 'It\'s not past 3 yet'
    },
    {
      description: '@repeat with no references in the body',
      template: '{@repeat count=2}<p>Hello!</p>{/repeat}',
      context: {},
      expectedHTML: '<p>Hello!</p><p>Hello!</p>'
    },
    {
      description: '@repeat with references in the body',
      template: '{@repeat count=2}<p>Hello, {name}!</p>{/repeat}',
      context: {
        name: 'Mundo'
      },
      expectedHTML: '<p>Hello, Mundo!</p><p>Hello, Mundo!</p>'
    },
    {
      description: '@repeat with references to $idx and $len',
      template: '{@repeat count=2}<p>{$idx} of {$len}</p>{/repeat}',
      context: {},
      expectedHTML: '<p>0 of 2</p><p>1 of 2</p>'
    },
    {
      description: '@repeat nested within section with references to $idx and $len',
      template: '{#numbers}<div>{$idx}: {.} {@repeat count=2}<p>{$idx} of {$len}</p>{/repeat}</div>{/numbers}',
      context: {
        numbers: [1,2]
      },
      expectedHTML: '<div>0: 1 <p>0 of 2</p><p>1 of 2</p></div><div>1: 2 <p>0 of 2</p><p>1 of 2</p></div>'
    },
    {
      description: 'Helper context dotted reference lookup',
      template: '{#numbers root=root}{$root.symbol}{.}{/numbers}',
      context: {
        root: {
          symbol: '#'
        },
        numbers: [1,2]
      },
      expectedHTML: '#1#2'
    },
    {
      description: 'Helper context dotted reference, first step doesn\'t exist',
      template: '{#numbers root=root}{$rot.symbol}{.}{/numbers}',
      context: {
        root: {
          symbol: '#'
        },
        numbers: [1,2]
      },
      expectedHTML: '12'
    }
  ]
};

export default suite;
