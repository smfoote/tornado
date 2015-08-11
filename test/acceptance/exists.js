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
      })()
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
      })()
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
      })()
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
      })()
    },
    {
      description: 'Exists in an attribute',
      template: '<div class="{?isSelected}selected{/isSelected}"></div>',
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
      description: 'Exists in an attribute with an else',
      template: '<div class="{?isSelected}selected{:else}not-selected{/isSelected}"></div>',
      context: {isSelected: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'not-selected');
        frag.appendChild(div);
        return frag;
      })()
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
      })()
    },
    {
      description: 'Exists where reference is empty string',
      template: 'Hello, {?name}world{/name}',
      context: {name: ''},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        return frag;
      })()
    },
    {
      description: 'Exists where reference is empty array',
      template: 'Hello, {?name}world{/name}',
      context: {name: []},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        return frag;
      })()
    },
    {
      description: 'Exists where reference is false',
      template: 'Hello, {?name}world{/name}',
      context: {name: false},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        return frag;
      })()
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
      })()
    },
    {
      description: 'Exists containing multiple HTML elements, followd by refernece',
      template: 'Hello, {?name}<span>world</span>.{/name} My name is {name}.',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        let span = document.createElement('span');
        span.appendChild(document.createTextNode('world'));
        frag.appendChild(span);
        frag.appendChild(document.createTextNode('.'));
        frag.appendChild(document.createTextNode(' My name is '));
        frag.appendChild(document.createTextNode('Dorothy'));
        frag.appendChild(document.createTextNode('.'));
        return frag;
      })()
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
      })()
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
      })()
    },
    {
      description: 'Exists where reference is a promise',
      template: 'Hello, {?now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
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
      description: 'Exists where reference is a promise that resolves to a falsy value',
      template: 'Hello, {?now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        return frag;
      })()
    },
    {
      description: 'Exists with an else where reference is a promise that resolves to a falsy value',
      template: 'Hello, {?now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('never'));
        return frag;
      })()
    },
    {
      description: 'Exists with a pending where reference is a promise',
      template: 'Hello, {?now}later{:pending}coming soon{/now}',
      context: {
        now: function() {
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve(true);
            }, 100);
          });
        }
      },
      expectedHTML: 'Hello, <div class="tornado-pending">coming soon</div>'
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
      })()
    },
    {
      description: 'Exists with sibling exists',
      template: '<div>{?brother}brother{/brother}</div><div>{?sister} and sister{/sister}</div>',
      context: {
        brother: true,
        sister: true
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('brother'));
        frag.appendChild(div);
        div = document.createElement('div');
        div.appendChild(document.createTextNode(' and sister'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Exists with sibling exists in attribute',
      template: '<div class="{?brother}brother{/brother}{?sister} sister{/sister}"></div>',
      context: {
        brother: true,
        sister: true
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'brother sister');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Exists where reference is a function',
      template: '{?fun}Way fun!{/fun}',
      context: {
        fun: function() {
          return true;
        }
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Way fun!'));
        return frag;
      })()
    },
    {
      description: 'Exists where dotted reference contains a function',
      template: '{?fun.fun}Way fun!{/fun.fun}',
      context: {
        fun: function() {
          return {
            fun: true
          };
        }
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Way fun!'));
        return frag;
      })()
    },
    {
      description: 'Exists where reference is a function that returns a Promise',
      template: '{?fun}Way fun!{/fun}',
      context: {
        fun: function() {
          return new Promise(function(resolve) {
            resolve(true);
          });
        }
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Way fun!'));
        return frag;
      })()
    },
    {
      description: 'Exists where dotted reference contains a function that returns a Promise',
      template: '{?fun.fun}Way fun!{/fun.fun}',
      context: {
        fun: function() {
          return new Promise(function(resolve) {
            resolve({fun: true});
          });
        }
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Way fun!'));
        return frag;
      })()
    },
    {
      description: 'Exists using helper syntax ( {@exists key="key"}...{/exists} )',
      template: '{@exists key="name"}name exists{/exists}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('name exists'));
        return frag;
      })()
    }
  ]
};

export default suite;
