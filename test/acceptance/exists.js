let suite = {
  name: 'Exists',
  tests: [
    {
      description: 'Exists alone (no other HTML), with text inside.',
      template: '{?name}name exists{/name}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('name exists'));
        return frag;
      })(),
      expectedHtml: 'name exists'
    },
    {
      description: 'Exists alone with reference inside',
      template: '{?name}{name} exists{/name}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        frag.appendChild(document.createTextNode(' exists'));
        return frag;
      })(),
      expectedHtml: 'Dorothy exists'
    },
    {
      description: 'Exists with HTML inside',
      template: '{?name}<div>Hello, <span>world</span></div>{/name}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        let span = document.createElement('span');
        div.appendChild(document.createTextNode('Hello, '));
        span.appendChild(document.createTextNode('world'));
        div.appendChild(span);
        frag.appendChild(div);
        return frag;
      })(),
      expectedHtml: '<div>Hello, <span>world</span></div>'
    },
    {
      description: 'Exists inside HTML',
      template: '<div>Hello, {?name}<span>world</span>{/name}</div>',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        let span = document.createElement('span');
        div.appendChild(document.createTextNode('Hello, '));
        span.appendChild(document.createTextNode('world'));
        div.appendChild(span);
        frag.appendChild(div);
        return frag;
      })(),
      expectedHtml: '<div>Hello, <span>world</span></div>'
    },
    {
      description: 'Exists where reference is 0',
      template: 'Hello, {?zero}world{/zero}',
      context: {zero: 0},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('world'));
        return frag;
      })(),
      expectedHtml: 'Hello, world'
    },
    {
      description: 'Exists where reference is empty string',
      template: 'Hello, {?name}world{/name}',
      context: {name: ""},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })(),
      expectedHtml: 'Hello, '
    },
    {
      description: 'Exists where reference is empty array',
      template: 'Hello, {?name}world{/name}',
      context: {name: []},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })(),
      expectedHtml: 'Hello, '
    },
    {
      description: 'Exists where reference is false',
      template: 'Hello, {?name}world{/name}',
      context: {name: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })(),
      expectedHtml: 'Hello, '
    },
    {
      description: 'Exists with else where reference is truthy',
      template: 'Hello, {?name}world{:else}abyss{/name}',
      context: {name: true},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('world'));
        return frag;
      })(),
      expectedHtml: 'Hello, world'
    },
    {
      description: 'Exists with else where reference is falsy',
      template: 'Hello, {?name}world{:else}abyss{/name}',
      context: {name: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('abyss'));
        return frag;
      })(),
      expectedHtml: 'Hello, abyss'
    },
    {
      description: 'Exists where reference has dots',
      template: 'Hello, {?member.lastName}fullName{/member.lastName}',
      context: {member: { lastName: 'Smith'} },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('fullName'));
        return frag;
      })(),
      expectedHtml: 'Hello, fullName'
    },
    {
      description: 'Exists where reference is a promise',
      template: 'Hello, {?now}later{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          resolve('and later');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('later'));
        return frag;
      })(),
      expectedHtml: 'Hello, later'
    },
    {
      description: 'Exists where reference is a promise that resolves to a falsy value',
      template: 'Hello, {?now}later{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          resolve('');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })(),
      expectedHtml: 'Hello, '
    },
    {
      description: 'Exists with an else where reference is a promise that resolves to a falsy value',
      template: 'Hello, {?now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          resolve('');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('never'));
        return frag;
      })(),
      expectedHtml: 'Hello, never'
    },
    {
      description: 'Exists with an else where reference is a promise that rejects',
      template: 'Hello, {?now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          reject();
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('never'));
        return frag;
      })(),
      expectedHtml: 'Hello, never'
    }
  ]
};

module.exports = suite;
