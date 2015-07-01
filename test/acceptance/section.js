let suite = {
  name: 'Section',
  tests: [
    {
      description: 'Section alone (no other HTML), with text inside, reference is not an array',
      template: '{#name}name exists{/name}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('name exists'));
        return frag;
      })()
    },
    {
      description: 'Section alone (no other HTML), with text inside, reference is an array',
      template: '{#name}name exists{/name}',
      context: {name: [1, 2]},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('name exists'));
        frag.appendChild(document.createTextNode('name exists'));
        return frag;
      })()
    },
    {
      description: 'Section alone (no other HTML), with text and refernce inside, reference is not an array',
      template: '{#name}{.} exists{/name}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        frag.appendChild(document.createTextNode(' exists'));
        return frag;
      })()
    },
    {
      description: 'Section alone (no other HTML), with text inside, reference is an array',
      template: '{#name}{.} exists{/name}',
      context: {name: [1, 2]},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('1'));
        frag.appendChild(document.createTextNode(' exists'));
        frag.appendChild(document.createTextNode('2'));
        frag.appendChild(document.createTextNode(' exists'));
        return frag;
      })()
    },
    {
      description: 'Section with HTML inside',
      template: '{#name}<div>Hello, <span>world</span></div>{/name}',
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
      description: 'Section inside HTML',
      template: '<div>Hello, {#name}<span>world</span>{/name}</div>',
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
      description: 'Section inside HTML',
      template: '<div>Hello, ({#name}{.} {/name}). Good numbers.</div>',
      context: {name: [1,2,3,4]},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Hello, ('));
        let frag2 = document.createDocumentFragment();
        frag2.appendChild(document.createTextNode('1'));
        frag2.appendChild(document.createTextNode(' '));
        frag2.appendChild(document.createTextNode('2'));
        frag2.appendChild(document.createTextNode(' '));
        frag2.appendChild(document.createTextNode('3'));
        frag2.appendChild(document.createTextNode(' '));
        frag2.appendChild(document.createTextNode('4'));
        frag2.appendChild(document.createTextNode(' '));
        div.appendChild(frag2);
        div.appendChild(document.createTextNode('). Good numbers.'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Section in an attribute',
      template: '<div class="{#colors}{.} {/colors}"></div>',
      context: {colors: ['red', 'blue']},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'red blue ');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Section in an attribute with an else',
      template: '<div class="{#colors}{.}{:else}colorless{/colors}"></div>',
      context: {colors: []},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'colorless');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Section changes context',
      template: 'Hello, {#member}{lastName}{/member}',
      context: {member: { lastName: 'Smith'} },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('Smith'));
        return frag;
      })()
    },
    {
      description: 'Section where reference has dots',
      template: 'Hello, {#member.lastName}{.}{/member.lastName}',
      context: {member: { lastName: 'Smith'} },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('Smith'));
        return frag;
      })()
    },
    {
      description: 'Section where reference is a promise',
      template: 'Hello, {#now}{.}{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode('and later'));
        return frag;
      })()
    },
    {
      description: 'Section where reference is a promise that resolves to a falsy value',
      template: 'Hello, {#now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
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
      description: 'Section with a pending where reference is a promise',
      template: 'Hello, {#now}later{:pending}coming soon{/now}',
      context: {
        now: function() {
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve(true);
            }, 100);
          });
        }
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        let div = document.createElement('div');
        div.setAttribute('class', 'tornado-pending');
        div.appendChild(document.createTextNode('coming soon'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Section with an else where reference is a promise that resolves to a falsy value',
      template: 'Hello, {#now}later{:else}never{/now}',
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
      description: 'Section with an else where reference is a promise that rejects',
      template: 'Hello, {#now}later{:else}never{/now}',
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
      description: 'Section with dotted reference where first part is a promise',
      template: 'Hello, {#right.now}later{/right.now}',
      context: {
        right: new Promise((resolve) => {
          resolve({now: true});
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
      description: 'Section with sibling exists',
      template: '<div>{#brother}brother{/brother}</div><div>{#sister} and sister{/sister}</div>',
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
      description: 'Section with sibling exists in attribute',
      template: '<div class="{#brother}brother{/brother}{#sister} sister{/sister}"></div>',
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
      description: 'Section where reference is a function',
      template: '{#fun}Way fun!{/fun}',
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
      description: 'Section where dotted reference contains a function',
      template: '{#fun.fun}Way fun!{/fun.fun}',
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
      description: 'Section where reference is a function that returns a Promise',
      template: '{#fun}Way fun!{/fun}',
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
      description: 'Section where dotted reference contains a function that returns a Promise',
      template: '{#fun.fun}Way fun!{/fun.fun}',
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
    }
  ]
};

export default suite;
