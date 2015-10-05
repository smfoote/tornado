let suite = {
  name: 'Not Exists',
  tests: [
    {
      description: 'Not Exists alone (no other HTML), with text inside.',
      template: '{^name}no name exists{/name}',
      context: {name: false},
      expectedHTML: 'no name exists'
    },
    {
      description: 'Not Exists alone with reference inside',
      template: '{^nom}{name} is not French{/nom}',
      context: {name: 'Dorothy'},
      expectedHTML: 'Dorothy is not French'
    },
    {
      description: 'Not Exists with HTML inside',
      template: '{^name}<div>Hello, <span>world</span></div>{/name}',
      context: {nom: 'Dorothy'},
      expectedHTML: '<div>Hello, <span>world</span></div>'
    },
    {
      description: 'Not Exists inside HTML',
      template: '<div>Hello, {^name}<span>world</span>{/name}</div>',
      context: {nom: 'Dorothy'},
      expectedHTML: '<div>Hello, <span>world</span></div>'
    },
    {
      description: ' Not Exists in an attribute',
      template: '<div class="{^isSelected}deselected{/isSelected}"></div>',
      context: {isSelected: false},
      expectedHTML: '<div class="deselected"></div>'
    },
    {
      description: 'Not Exists in an attribute with an else',
      template: '<div class="{^isSelected}not-selected{:else}selected{/isSelected}"></div>',
      context: {isSelected: true},
      expectedHTML: '<div class="selected"></div>'
    },
    {
      description: 'Not Exists where reference is 0',
      template: 'Hello, {^zero}world{/zero}',
      context: {zero: 0},
      expectedHTML: 'Hello, '
    },
    {
      description: 'Not Exists where reference is empty string',
      template: 'Hello, {^name}world{/name}',
      context: {name: ''},
      expectedHTML: 'Hello, world'
    },
    {
      description: 'Not Exists where reference is empty array',
      template: 'Hello, {^name}world{/name}',
      context: {name: []},
      expectedHTML: 'Hello, world'
    },
    {
      description: 'Not Exists where reference is false',
      template: 'Hello, {^name}world{/name}',
      context: {name: false},
      expectedHTML: 'Hello, world'
    },
    {
      description: 'Not Exists with else where reference is truthy',
      template: 'Hello, {^name}world{:else}abyss{/name}',
      context: {name: true},
      expectedHTML: 'Hello, abyss'
    },
    {
      description: 'Not Exists with else where reference is falsy',
      template: 'Hello, {^name}world{:else}abyss{/name}',
      context: {name: false},
      expectedHTML: 'Hello, world'
    },
    {
      description: 'Not Exists where reference has dots',
      template: 'Hello, {^member.lastName}fullName{/member.lastName}',
      context: {member: { firstName: 'Smith'} },
      expectedHTML: 'Hello, fullName'
    },
    {
      description: 'Not Exists where reference is a promise',
      template: 'Hello, {^now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
        })
      },
      expectedHTML: 'Hello, '
    },
    {
      description: 'Not Exists where reference is a promise that resolves to a falsy value',
      template: 'Hello, {^now}later{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedHTML: 'Hello, later'
    },
    {
      description: 'Not Exists with a pending where reference is a promise',
      template: 'Hello, {^now}later{:pending}coming soon{/now}',
      context: {
        now: function() {
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve(false);
            }, 100);
          });
        }
      },
      expectedHTML: 'Hello, <div class="tornado-pending">coming soon</div>',
      expectedHTMLResolved: 'Hello, later'
    },
    {
      description: 'Not Exists with an else where reference is a promise that resolves to a falsy value',
      template: 'Hello, {^now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve) => {
          resolve('');
        })
      },
      expectedHTML: 'Hello, later'
    },
    {
      description: 'Not Exists with an else where reference is a promise that rejects',
      template: 'Hello, {^now}later{:else}never{/now}',
      context: {
        now: new Promise((resolve, reject) => {
          reject();
        })
      },
      expectedHTML: 'Hello, later'
    },
    {
      description: 'Not Exists with sibling exists',
      template: '<div>{^brother}not brother{/brother}</div><div>{^sister} and not sister{/sister}</div>',
      context: {
        brother: false,
        sister: ''
      },
      expectedHTML: '<div>not brother</div><div> and not sister</div>'
    },
    {
      description: 'Not Exists with sibling exists in attribute',
      template: '<div class="{^brother}brother{/brother}{^sister} sister{/sister}"></div>',
      context: {
        brother: false,
        sister: ''
      },
      expectedHTML: '<div class="brother sister"></div>'
    },
    {
      description: 'Not Exists using helper syntax ( {@notExists key="key"}...{/notExists} )',
      template: '{@notExists key="name"}no name exists{/notExists}',
      context: {name: false},
      expectedHTML: 'no name exists'
    }
  ]
};

export default suite;
