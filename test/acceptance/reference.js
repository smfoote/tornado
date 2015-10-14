let suite = {
  name: 'Reference',
  tests: [
    {
      description: 'Reference alone should render a text node in a document fragment',
      template: '{name}',
      context: {name: 'Dorothy'},
      expectedHTML: 'Dorothy'
    },
    {
      description: 'Reference before some text',
      template: '{name} of Kansas',
      context: {name: 'Dorothy'},
      expectedHTML: 'Dorothy of Kansas'
    },
    {
      description: 'Reference after some text',
      template: 'Helen {name}',
      context: {name: 'Hunt'},
      expectedHTML: 'Helen Hunt'
    },
    {
      description: 'Reference surrounded by text',
      template: 'Ruby {color} slippers',
      context: {color: 'red'},
      expectedHTML: 'Ruby red slippers'
    },
    {
      description: 'Reference before an element',
      template: '{name}<div></div>',
      context: {name: 'Dorothy'},
      expectedHTML: 'Dorothy<div></div>'
    },
    {
      description: 'Reference after an element',
      template: '<div></div>{name}',
      context: {name: 'Hunt'},
      expectedHTML: '<div></div>Hunt'
    },
    {
      description: 'Reference surrounded by elements',
      template: '<span></span>{color}<span></span>',
      context: {color: 'red'},
      expectedHTML: '<span></span>red<span></span>'
    },
    {
      description: 'Reference in an element',
      template: '<div>{name}</div>',
      context: {name: 'Dorothy'},
      expectedHTML: '<div>Dorothy</div>'
    },
    {
      description: 'Reference in an element with other text',
      template: '<div>{name} is a dog</div>',
      context: {name: 'Toto'},
      expectedHTML: '<div>Toto is a dog</div>'
    },
    {
      description: 'Reference in a nested element without other text',
      template: '<div><span>{name}</span></div>',
      context: {name: 'Toto'},
      expectedHTML: '<div><span>Toto</span></div>'
    },
    {
      description: 'Reference in a nested element with other text',
      template: '<div><span>{name} is a dog</span></div>',
      context: {name: 'Toto'},
      expectedHTML: '<div><span>Toto is a dog</span></div>'
    },
    {
      description: 'Reference in an attribute',
      template: '<div class="{name}"></div>',
      context: {name: 'Dorothy'},
      expectedHTML: '<div class="Dorothy"></div>'
    },
    {
      description: 'Reference in an attribute with other text in the attribute',
      template: '<div class="oz {name}"></div>',
      context: {name: 'Dorothy'},
      expectedHTML: '<div class="oz Dorothy"></div>'
    },
    {
      description: 'Reference with a dot separated path',
      template: '{character.firstName}',
      context: {character: {firstName: 'Dorothy'}},
      expectedHTML: 'Dorothy'
    },
    {
      description: 'Reference with a dot separated path where last step does not exist',
      template: 'Hello, {character.firstName}',
      context: {character: {}},
      expectedHTML: 'Hello, '
    },
    {
      description: 'Reference with a dot separated path where first step does not exist',
      template: 'Hello, {character.firstName}',
      context: {},
      expectedHTML: 'Hello, '
    },
    {
      description: 'Single dot reference',
      template: '{.}',
      context: 'Dorothy',
      expectedHTML: 'Dorothy'
    },
    {
      description: 'Reference is a promise',
      template: '<div>{now}</div>',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
        })
      },
      expectedHTML: '<div>and later</div>'
    },
    {
      description: 'Reference at fragment root is a promise',
      template: '{now}',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
        })
      },
      expectedHTML: 'and later'
    },
    {
      description: 'Reference is a promise that rejects',
      template: '<div>{now}</div>',
      context: {
        now: new Promise((resolve, reject) => {
          reject();
        })
      },
      expectedHTML: '<div></div>'
    },
    {
      description: 'Reference in an attribute is a promise',
      template: '<div class="{now}"></div>',
      context: {
        now: new Promise((resolve) => {
          resolve('later');
        })
      },
      expectedHTML: '<div class="later"></div>'
    },
    {
      description: 'Reference is a function that returns a string',
      template: '<blockquote>The name is {lastName}, {fullName}.</blockquote>',
      context: {
        fullName: function() {
          return this.firstName + ' ' + this.lastName;
        },
        firstName: 'James',
        lastName: 'Bond'
      },
      expectedHTML: '<blockquote>The name is Bond, James Bond.</blockquote>'
    },
    {
      description: 'Reference is a function that returns a Promise',
      template: '<blockquote>The name is {lastName}, {fullName}.</blockquote>',
      context: {
        fullName: function() {
          return new Promise((resolve) => {
            resolve(this.firstName + ' ' + this.lastName);
          });
        },
        firstName: 'James',
        lastName: 'Bond'
      },
      expectedHTML: '<blockquote>The name is Bond, James Bond.</blockquote>'
    },
    {
      description: 'Reference with dots, where first part of path is a function returning an object',
      template: '<blockquote>The name is {name.lastName}.</blockquote>',
      context: {
        name: function() {
          return {
            firstName: 'James',
            lastName: 'Bond'
          };
        }
      },
      expectedHTML: '<blockquote>The name is Bond.</blockquote>'
    },
    {
      description: 'Reference with dots, where first part of path is a function returning a Promise',
      template: '<blockquote>The name is {name.lastName}.</blockquote>',
      context: {
        name: function() {
          return new Promise((resolve) => {
            resolve({
              firstName: 'James',
              lastName: 'Bond'
            });
          });
        }
      },
      expectedHTML: '<blockquote>The name is Bond.</blockquote>'
    }
  ]
};

export default suite;
