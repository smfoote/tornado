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
      description: 'Helper with a body',
      setup() {
        td.registerHelper('eq', (context, params, bodies) => {
          if (params.key === params.val) {
            return bodies.main(context);
          } else if (bodies.else) {
            return bodies.else(context);
          }
        });
      },
      template: '{@eq key="hello" val="hello"}<div>Hello, helpers!</div>{/eq}',
      context: {elName: new Promise(resolve=> {
        resolve('div');
      })},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Hello, helpers!'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Helper with an else body',
      setup() {
        td.registerHelper('eq', (context, params, bodies) => {
          if (params.key === params.val) {
            return bodies.main(context);
          } else if (bodies.else) {
            return bodies.else(context);
          }
        });
      },
      template: '{@eq key="hello" val="hi"}<div>Hello, helpers!</div>{:else}<div>Not equal :(</div>{/eq}',
      context: {elName: new Promise(resolve=> {
        resolve('div');
      })},
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
        td.registerHelper('eq', (context, params, bodies) => {
          if (params.key === params.val) {
            return bodies.main(context);
          } else if (bodies.waffles) {
            return bodies.waffles(context);
          }
        });
      },
      template: '{@eq key="hello" val="hi"}<div>Hello, helpers!</div>{:waffles}<div>I love waffles!</div>{/eq}',
      context: {elName: new Promise(resolve=> {
        resolve('div');
      })},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('I love waffles!'));
        frag.appendChild(div);
        return frag;
      })()
    }
  ]
};

module.exports = suite;
