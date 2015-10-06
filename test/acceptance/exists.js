let suite = {
  name: 'Exists',
  tests: [
    {
      description: 'Exists alone (no other HTML), with text inside.',
      template: '{?name}name exists{/name}',
      context: {name: 'Dorothy'},
      expectedHTML: 'name exists'
    },
    {
      description: 'Exists alone with reference inside',
      template: '{?name}{name} exists{/name}',
      context: {name: 'Dorothy'},
      expectedHTML: 'Dorothy exists'
    },
    {
      description: 'Exists with HTML inside',
      template: '{?name}<div>Hello, <span>world</span></div>{/name}',
      context: {name: 'Dorothy'},
      expectedHTML: '<div>Hello, <span>world</span></div>'
    },
    {
      description: 'Exists inside HTML',
      template: '<div>Hello, {?name}<span>world</span>{/name}</div>',
      context: {name: 'Dorothy'},
      expectedHTML: '<div>Hello, <span>world</span></div>'
    },
    {
      description: 'Exists in an attribute',
      template: '<div class="{?isSelected}selected{/isSelected}"></div>',
      context: {isSelected: true},
      expectedHTML: '<div class="selected"></div>'
    },
    {
      description: 'Exists in an attribute with an else',
      template: '<div class="{?isSelected}selected{:else}not-selected{/isSelected}"></div>',
      context: {isSelected: false},
      expectedHTML: '<div class="not-selected"></div>'
    },
    {
      description: 'Exists where reference is 0',
      template: 'Hello, {?zero}world{/zero}',
      context: {zero: 0},
      expectedHTML: 'Hello, world'
    },
    {
      description: 'Exists where reference is empty string',
      template: 'Hello, {?name}world{/name}',
      context: {name: ''},
      expectedHTML: 'Hello, '
    },
    {
      description: 'Exists where reference is empty array',
      template: 'Hello, {?name}world{/name}',
      context: {name: []},
      expectedHTML: 'Hello, '
    },
    {
      description: 'Exists where reference is false',
      template: 'Hello, {?name}world{/name}',
      context: {name: false},
      expectedHTML: 'Hello, '
    },
    {
      description: 'Exists with else where reference is truthy',
      template: 'Hello, {?name}world{:else}abyss{/name}',
      context: {name: true},
      expectedHTML: 'Hello, world'
    },
    {
      description: 'Exists containing multiple HTML elements, followd by refernece',
      template: 'Hello, {?name}<span>world</span>.{/name} My name is {name}.',
      context: {name: 'Dorothy'},
      expectedHTML: 'Hello, <span>world</span>. My name is Dorothy.'
    },
    {
      description: 'Exists with else where reference is falsy',
      template: 'Hello, {?name}world{:else}abyss{/name}',
      context: {name: false},
      expectedHTML: 'Hello, abyss'
    },
    {
      description: 'Exists where reference has dots',
      template: 'Hello, {?member.lastName}fullName{/member.lastName}',
      context: {member: { lastName: 'Smith'} },
      expectedHTML: 'Hello, fullName'
    },
    {
      description: 'Exists where reference is a promise',
      template: 'Hello, {?now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
        })
      },
      expectedHTML: 'Hello, later'
    },
    {
      description: 'Exists where reference is a promise that resolves to a falsy value',
      template: 'Hello, {?now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedHTML: 'Hello, '
    },
    {
      description: 'Exists with an else where reference is a promise that resolves to a falsy value',
      template: 'Hello, {?now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedHTML: 'Hello, never'
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
      expectedHTML: 'Hello, <div class="tornado-pending">coming soon</div>',
      expectedHTMLResolved: 'Hello, later'
    },
    {
      description: 'Exists with an else where reference is a promise that rejects',
      template: 'Hello, {?now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          reject();
        })
      },
      expectedHTML: 'Hello, never'
    },
    {
      description: 'Exists with sibling exists',
      template: '<div>{?brother}brother{/brother}</div><div>{?sister} and sister{/sister}</div>',
      context: {
        brother: true,
        sister: true
      },
      expectedHTML: '<div>brother</div><div> and sister</div>'
    },
    {
      description: 'Exists with sibling exists in attribute',
      template: '<div class="{?brother}brother{/brother}{?sister} sister{/sister}"></div>',
      context: {
        brother: true,
        sister: true
      },
      expectedHTML: '<div class="brother sister"></div>'
    },
    {
      description: 'Exists where reference is a function',
      template: '{?fun}Way fun!{/fun}',
      context: {
        fun: function() {
          return true;
        }
      },
      expectedHTML: 'Way fun!'
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
      expectedHTML: 'Way fun!'
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
      expectedHTML: 'Way fun!'
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
      expectedHTML: 'Way fun!'
    },
    {
      description: 'Exists using helper syntax ( {@exists key="key"}...{/exists} )',
      template: '{@exists key="name"}name exists{/exists}',
      context: {name: 'Dorothy'},
      expectedHTML: 'name exists'
    }
  ]
};

export default suite;
