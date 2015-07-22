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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createElement('div'));
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createElement('div'));
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createElement('div'));
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createElement('div'));
        return frag;
      })()
    },
    {
      description: 'Helper with a body (tests @eq with strings)',
      template: '{@eq key="hello" val="hello"}<div>Hello, helpers!</div>{/eq}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Hello, helpers!'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Helper with an else body (tests @eq where strings are not equal)',
      template: '{@eq key="hello" val="hi"}<div>Hello, helpers!</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Not equal :('));
        frag.appendChild(div);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('I love waffles!'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@eq with equal numbers',
      template: '{@eq key=5 val=5}<div>2 + 2</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('2 + 2'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@eq with non-equal numbers',
      template: '{@eq key=5 val=6}<div>2 + 2</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Not equal :('));
        frag.appendChild(div);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Just the right amount of friends'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@ne with non-equal numbers',
      template: '{@ne key=5 val=6}<div>2 + 2</div>{:else}<div>These are equal :(</div>{/ne}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('2 + 2'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@ne with equal numbers',
      template: '{@ne key=5 val=5}<div>2 + 2</div>{:else}<div>These are equal :(</div>{/ne}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('These are equal :('));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@ne with non-equal strings',
      template: '{@ne key="hello" val="bonjour"}<div>Bonjour, ça va?</div>{:else}<div>Huh?</div>{/ne}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Bonjour, ça va?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@ne with equal strings',
      template: '{@ne key="Bom dia" val="Bom dia"}<div>Tudo bem, filho?</div>{:else}<div>Huh?</div>{/ne}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Huh?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@gt where key is greater than val',
      template: '{@gt key=42 val=2}<div>This is the answer?</div>{/gt}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('This is the answer?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@gt where key is less than val',
      template: '{@gt key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/gt}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('What was the question?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@gt where key and val are equal',
      template: '{@gt key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/gt}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('They are the same'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@gte where key is greater than val',
      template: '{@gte key=42 val=2}<div>This is the answer?</div>{/gte}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('This is the answer?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@gte where key is less than val',
      template: '{@gte key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/gte}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('What was the question?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@gte where key and val are equal',
      template: '{@gte key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/gte}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('This is the answer?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@lt where key is greater than val',
      template: '{@lt key=42 val=2}<div>This is the answer?</div>{/lt}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        return frag;
      })()
    },
    {
      description: '@lt where key is less than val',
      template: '{@lt key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/lt}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('This is the answer?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@lt where key and val are equal',
      template: '{@lt key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/lt}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('They are the same'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@lte where key is greater than val',
      template: '{@lte key=42 val=2}<div>This is the answer?</div>{/lte}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        return frag;
      })()
    },
    {
      description: '@lte where key is less than val',
      template: '{@lte key=2 val=42}<div>This is the answer?</div>{:else}<div>What was the question?</div>{/lte}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('This is the answer?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@lte where key and val are equal',
      template: '{@lte key=2 val=2}<div>This is the answer?</div>{:else}<div>They are the same</div>{/lte}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('This is the answer?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@sep in a section-loop with just one item',
      template: '{#names}{.}{@sep}; {/sep}{/names}',
      context: {
        names: ['Steven']
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Steven'));
        return frag;
      })()
    },
    {
      description: '@sep in a section-loop with multiple items',
      template: '{#names}{.}{@sep}; {/sep}{/names}',
      context: {
        names: ['Steven', 'Jimmy', 'Prash']
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Steven'));
        frag.appendChild(document.createTextNode('; '));
        frag.appendChild(document.createTextNode('Jimmy'));
        frag.appendChild(document.createTextNode('; '));
        frag.appendChild(document.createTextNode('Prash'));
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Steven'));
        frag.appendChild(document.createTextNode(' '));
        frag.appendChild(document.createTextNode('F'));
        frag.appendChild(document.createTextNode(','));
        frag.appendChild(document.createTextNode('o'));
        frag.appendChild(document.createTextNode(','));
        frag.appendChild(document.createTextNode('o'));
        frag.appendChild(document.createTextNode(','));
        frag.appendChild(document.createTextNode('t'));
        frag.appendChild(document.createTextNode(','));
        frag.appendChild(document.createTextNode('e'));
        frag.appendChild(document.createTextNode('; '));
        frag.appendChild(document.createTextNode('Prash'));
        frag.appendChild(document.createTextNode(' '));
        frag.appendChild(document.createTextNode('J'));
        frag.appendChild(document.createTextNode(','));
        frag.appendChild(document.createTextNode('a'));
        frag.appendChild(document.createTextNode(','));
        frag.appendChild(document.createTextNode('i'));
        frag.appendChild(document.createTextNode(','));
        frag.appendChild(document.createTextNode('n'));
        return frag;
      })()
    },
    {
      description: '@sep in a section-loop with no items',
      template: '{#names}{.}{@sep}; {/sep}{/names}',
      context: {
        names: []
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    },
    {
      description: '@sep outside of a loop',
      template: '<span>{@sep}artificial separation{/sep}</span>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        frag.appendChild(span);
        return frag;
      })()
    },
    {
      description: '@first in a loop with one item',
      template: '{#names}<span class="{@first}first{/first}">{.}</span>{/names}',
      context: {
        names: ['Steven']
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        span.setAttribute('class', 'first');
        span.appendChild(document.createTextNode('Steven'));
        frag.appendChild(span);
        return frag;
      })()
    },
    {
      description: '@first in a loop with multiple items',
      template: '{#names}<span class="{@first}first{/first}">{.}</span>{/names}',
      context: {
        names: ['Steven', 'Jimmy', 'Prash']
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        span.setAttribute('class', 'first');
        span.appendChild(document.createTextNode('Steven'));
        frag.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('Jimmy'));
        frag.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('Prash'));
        frag.appendChild(span);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'container outer-first');
        let span = document.createElement('span');
        span.setAttribute('class', 'first');
        span.appendChild(document.createTextNode('F'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('o'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('o'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('t'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('e'));
        div.appendChild(span);
        frag.appendChild(div);
        div = document.createElement('div');
        div.setAttribute('class', 'container');
        span = document.createElement('span');
        span.setAttribute('class', 'first');
        span.appendChild(document.createTextNode('J'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('a'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('i'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('n'));
        div.appendChild(span);
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@first in a loop with no items',
      template: '{#names}<span class="{@first}first{/first}">{.}</span>{/names}',
      context: {
        names: []
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    },
    {
      description: '@first outside of a loop',
      template: '<span class="{@first}first{/first}"></span>',
      context: {
        names: []
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        span.setAttribute('class', '');
        frag.appendChild(span);
        return frag;
      })()
    },
    {
      description: '@last in a loop with one item',
      template: '{#names}<span class="{@last}last{/last}">{.}</span>{/names}',
      context: {
        names: ['Steven']
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        span.setAttribute('class', 'last');
        span.appendChild(document.createTextNode('Steven'));
        frag.appendChild(span);
        return frag;
      })()
    },
    {
      description: '@last in a loop with multiple items',
      template: '{#names}<span class="{@last}last{/last}">{.}</span>{/names}',
      context: {
        names: ['Steven', 'Jimmy', 'Prash']
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('Steven'));
        frag.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('Jimmy'));
        frag.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', 'last');
        span.appendChild(document.createTextNode('Prash'));
        frag.appendChild(span);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'container');
        let span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('F'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('o'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('o'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('t'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', 'last');
        span.appendChild(document.createTextNode('e'));
        div.appendChild(span);
        frag.appendChild(div);
        div = document.createElement('div');
        div.setAttribute('class', 'container outer-last');
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('J'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('a'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', '');
        span.appendChild(document.createTextNode('i'));
        div.appendChild(span);
        span = document.createElement('span');
        span.setAttribute('class', 'last');
        span.appendChild(document.createTextNode('n'));
        div.appendChild(span);
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: '@last in a loop with no items',
      template: '{#names}<span class="{@last}last{/last}">{.}</span>{/names}',
      context: {
        names: []
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    },
    {
      description: '@last outside of a loop',
      template: '<span class="{@last}last{/last}"></span>',
      context: {
        names: []
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        span.setAttribute('class', '');
        frag.appendChild(span);
        return frag;
      })()
    },
    {
      description: '@select with only @default',
      template: '{@select key=type}{@default}Default{/default}{/select}',
      context: {
        type: 'green'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Default'));
        return frag;
      })()
    },
    {
      description: '@select with @eq that matches',
      template: '{@select key=type}{@eq val="green"}GREEN!{/eq}{/select}',
      context: {
        type: 'green'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('GREEN!'));
        return frag;
      })()
    },
    {
      description: '@select with multiple @eq, one that matches',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{/select}',
      context: {
        type: 'green'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('GREEN!'));
        return frag;
      })()
    },
    {
      description: '@select with multiple @eq, none match',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{/select}',
      context: {
        type: 'yellow'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        return frag;
      })()
    },
    {
      description: '@select with multiple @eq, none match, and a @default',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{@default}A lack of color here{/default}{/select}',
      context: {
        type: 'yellow'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('A lack of color here'));
        return frag;
      })()
    },
    {
      description: '@select with multiple @eq, one match, and a @default',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@eq val="green"}GREEN!{/eq}{@default}A lack of color here{/default}{/select}',
      context: {
        type: 'green'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('GREEN!'));
        return frag;
      })()
    },
    {
      description: 'Nested @select',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@default}A lack of {@select key=category}{@eq val="color"}color{/eq}{/select} here{/default}{/select}',
      context: {
        type: 'green',
        category: 'color'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('A lack of '));
        frag.appendChild(document.createTextNode('color'));
        frag.appendChild(document.createTextNode(' here'));
        return frag;
      })()
    },
    {
      description: 'Nested @select with nested @default',
      template: '{@select key=type}{@eq val="blue"}BLUE!{/eq}{@default}A lack of {@select key=category}{@eq val="color"}color{/eq}{@default}category{/default}{/select} here{/default}{/select}',
      context: {
        type: 'green',
        category: 'stuff'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('A lack of '));
        frag.appendChild(document.createTextNode('category'));
        frag.appendChild(document.createTextNode(' here'));
        return frag;
      })()
    }
  ]
};

export default suite;
