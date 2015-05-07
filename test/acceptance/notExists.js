let suite = {
  name: 'Not Exists',
  tests: [
    {
      description: 'Not Exists alone (no other HTML), with text inside.',
      template: '{^name}no name exists{/name}',
      context: {name: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('no name exists'));
        return frag;
      })()
    },
    {
      description: 'Not Exists alone with reference inside',
      template: '{^nom}{name} is not French{/nom}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        frag.appendChild(document.createTextNode(' is not French'));
        return frag;
      })()
    },
    {
      description: 'Not Exists with HTML inside',
      template: '{^name}<div>Hello, <span>world</span></div>{/name}',
      context: {nom: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        let span = document.createElement('span');
        div.appendChild(document.createTextNode('Hello, '));
        span.appendChild(document.createTextNode('world'));
        div.appendChild(span);
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Not Exists inside HTML',
      template: '<div>Hello, {^name}<span>world</span>{/name}</div>',
      context: {nom: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        let span = document.createElement('span');
        div.appendChild(document.createTextNode('Hello, '));
        span.appendChild(document.createTextNode('world'));
        div.appendChild(span);
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: ' Not Exists in an attribute',
      template: '<div class="{^isSelected}deselected{/isSelected}"></div>',
      context: {isSelected: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'deselected');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Not Exists in an attribute with an else',
      template: '<div class="{^isSelected}not-selected{:else}selected{/isSelected}"></div>',
      context: {isSelected: true},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'selected');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Not Exists where reference is 0',
      template: 'Hello, {^zero}world{/zero}',
      context: {zero: 0},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    },
    {
      description: 'Not Exists where reference is empty string',
      template: 'Hello, {^name}world{/name}',
      context: {name: ""},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('world'));
        return frag;
      })()
    },
    {
      description: 'Not Exists where reference is empty array',
      template: 'Hello, {^name}world{/name}',
      context: {name: []},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('world'));
        return frag;
      })()
    },
    {
      description: 'Not Exists where reference is false',
      template: 'Hello, {^name}world{/name}',
      context: {name: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('world'));
        return frag;
      })()
    },
    {
      description: 'Not Exists with else where reference is truthy',
      template: 'Hello, {^name}world{:else}abyss{/name}',
      context: {name: true},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('abyss'));
        return frag;
      })()
    },
    {
      description: 'Not Exists with else where reference is falsy',
      template: 'Hello, {^name}world{:else}abyss{/name}',
      context: {name: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('world'));
        return frag;
      })()
    },
    {
      description: 'Not Exists where reference has dots',
      template: 'Hello, {^member.lastName}fullName{/member.lastName}',
      context: {member: { firstName: 'Smith'} },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('fullName'));
        return frag;
      })()
    },
    {
      description: 'Exists where reference is a promise',
      template: 'Hello, {^now}later{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          resolve('and later');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    },
    {
      description: 'Not Exists where reference is a promise that resolves to a falsy value',
      template: 'Hello, {^now}later{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          resolve('');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('later'));
        return frag;
      })()
    },
    {
      description: 'Not Exists with an else where reference is a promise that resolves to a falsy value',
      template: 'Hello, {^now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          resolve('');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('later'));
        return frag;
      })()
    },
    {
      description: 'Not Exists with an else where reference is a promise that rejects',
      template: 'Hello, {^now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          reject();
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('later'));
        return frag;
      })()
    },
    {
      description: 'Not Exists with sibling exists',
      template: '<div>{^brother}not brother{/brother}</div><div>{^sister} and not sister{/sister}</div>',
      context: {
        brother: false,
        sister: ''
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('not brother'));
        frag.appendChild(div);
        div = document.createElement('div');
        div.appendChild(document.createTextNode(' and not sister'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Not Exists with sibling exists in attribute',
      template: '<div class="{^brother}brother{/brother}{^sister} sister{/sister}"></div>',
      context: {
        brother: false,
        sister: ''
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'brother sister');
        frag.appendChild(div);
        return frag;
      })()
    }
  ]
};

module.exports = suite;
