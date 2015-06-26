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
          console.log(this.friends.length);
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
    }
  ]
};

export default suite;
