let suite = {
  name: 'Section',
  tests: [
    {
      description: 'Section alone (no other HTML), with text inside, reference is not an array',
      template: '{#name}name exists{/name}',
      context: {name: 'Dorothy'},
      expectedHTML: 'name exists'
    },
    {
      description: 'Section alone (no other HTML), with text inside, reference is an array',
      template: '{#name}name exists{/name}',
      context: {name: [1, 2]},
      expectedHTML: 'name existsname exists'
    },
    {
      description: 'Section alone (no other HTML), with text and refernce inside, reference is not an array',
      template: '{#name}{.} exists{/name}',
      context: {name: 'Dorothy'},
      expectedHTML: 'Dorothy exists'
    },
    {
      description: 'Section alone (no other HTML), with text inside, reference is an array',
      template: '{#name}{.} exists{/name}',
      context: {name: [1, 2]},
      expectedHTML: '1 exists2 exists'
    },
    {
      description: 'Section with HTML inside',
      template: '{#name}<div>Hello, <span>world</span></div>{/name}',
      context: {name: 'Dorothy'},
      expectedHTML: '<div>Hello, <span>world</span></div>'
    },
    {
      description: 'Section inside HTML',
      template: '<div>Hello, {#name}<span>world</span>{/name}</div>',
      context: {name: 'Dorothy'},
      expectedHTML: '<div>Hello, <span>world</span></div>'
    },
    {
      description: 'Section inside HTML',
      template: '<div>Hello, ({#name}{.} {/name}). Good numbers.</div>',
      context: {name: [1,2,3,4]},
      expectedHTML: '<div>Hello, (1 2 3 4 ). Good numbers.</div>'
    },
    {
      description: 'Section in an attribute',
      template: '<div class="{#colors}{.} {/colors}"></div>',
      context: {colors: ['red', 'blue']},
      expectedHTML: '<div class="red blue "></div>'
    },
    {
      description: 'Section in an attribute with an else',
      template: '<div class="{#colors}{.}{:else}colorless{/colors}"></div>',
      context: {colors: []},
      expectedHTML: '<div class="colorless"></div>'
    },
    {
      description: 'Section changes context',
      template: 'Hello, {#member}{lastName}{/member}',
      context: {member: { lastName: 'Smith'} },
      expectedHTML: 'Hello, Smith'
    },
    {
      description: 'Section where reference has dots',
      template: 'Hello, {#member.lastName}{.}{/member.lastName}',
      context: {member: { lastName: 'Smith'} },
      expectedHTML: 'Hello, Smith'
    },
    {
      description: 'Section where reference is a promise',
      template: 'Hello, {#now}{.}{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
        })
      },
      expectedHTML: 'Hello, and later'
    },
    {
      description: 'Section where reference is a promise that resolves to a falsy value',
      template: 'Hello, {#now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedHTML: 'Hello, '
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
      expectedHTML: 'Hello, <div class="tornado-pending">coming soon</div>',
      expectedHTMLResolved: 'Hello, later'
    },
    {
      description: 'Section with an else where reference is a promise that resolves to a falsy value',
      template: 'Hello, {#now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedHTML: 'Hello, never'
    },
    {
      description: 'Section with an else where reference is a promise that rejects',
      template: 'Hello, {#now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          reject();
        })
      },
      expectedHTML: 'Hello, never'
    },
    {
      description: 'Section with dotted reference where first part is a promise',
      template: 'Hello, {#right.now}later{/right.now}',
      context: {
        right: new Promise((resolve) => {
          resolve({now: true});
        })
      },
      expectedHTML: 'Hello, later'
    },
    {
      description: 'Section with sibling exists',
      template: '<div>{#brother}brother{/brother}</div><div>{#sister} and sister{/sister}</div>',
      context: {
        brother: true,
        sister: true
      },
      expectedHTML: '<div>brother</div><div> and sister</div>'
    },
    {
      description: 'Section with sibling exists in attribute',
      template: '<div class="{#brother}brother{/brother}{#sister} sister{/sister}"></div>',
      context: {
        brother: true,
        sister: true
      },
      expectedHTML: '<div class="brother sister"></div>'
    },
    {
      description: 'Section where reference is a function',
      template: '{#fun}Way fun!{/fun}',
      context: {
        fun: function() {
          return true;
        }
      },
      expectedHTML: 'Way fun!'
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
      expectedHTML: 'Way fun!'
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
      expectedHTML: 'Way fun!'
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
      expectedHTML: 'Way fun!'
    },
    {
      description: 'Section using the helper syntax ( {@section key="key"}...{/section})',
      template: '<span>{@section key="names"}{.} {/section}</span>',
      context: {
        names: ['Jimmy', 'Prash', 'Steven']
      },
      expectedHTML: '<span>Jimmy Prash Steven </span>'
    }
  ]
};

export default suite;
