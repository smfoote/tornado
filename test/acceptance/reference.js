let suite = {
  name: 'Reference',
  tests: [
    {
      description: 'Reference alone should render a text node in a document fragment',
      template: '{name}',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        return frag;
      })()
    },
    {
      description: 'Reference before some text',
      template: '{name} of Kansas',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        frag.appendChild(document.createTextNode(' of Kansas'));
        return frag;
      })()
    },
    {
      description: 'Reference after some text',
      template: 'Helen {name}',
      context: {name: 'Hunt'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Helen '));
        frag.appendChild(document.createTextNode('Hunt'));
        return frag;
      })()
    },
    {
      description: 'Reference surrounded by text',
      template: 'Ruby {color} slippers',
      context: {color: 'red'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Ruby '));
        frag.appendChild(document.createTextNode('red'));
        frag.appendChild(document.createTextNode(' slippers'));
        return frag;
      })()
    },
    {
      description: 'Reference before an element',
      template: '{name}<div></div>',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        frag.appendChild(document.createElement('div'));
        return frag;
      })()
    },
    {
      description: 'Reference after an element',
      template: '<div></div>{name}',
      context: {name: 'Hunt'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createElement('div'));
        frag.appendChild(document.createTextNode('Hunt'));
        return frag;
      })()
    },
    {
      description: 'Reference surrounded by elements',
      template: '<span></span>{color}<span></span>',
      context: {color: 'red'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createElement('span'));
        frag.appendChild(document.createTextNode('red'));
        frag.appendChild(document.createElement('span'));
        return frag;
      })()
    },
    {
      description: 'Reference in an element should render in the element',
      template: '<div>{name}</div>',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Dorothy'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference in an element with other text',
      template: '<div>{name} is a dog</div>',
      context: {name: 'Toto'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Toto'));
        div.appendChild(document.createTextNode(' is a dog'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference in a nested element with other text',
      template: '<div><span>{name}</span></div>',
      context: {name: 'Toto'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        let span = document.createElement('span');
        span.appendChild(document.createTextNode('Toto'));
        div.appendChild(span);
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference in an attribute should render in the attribute',
      template: '<div class="{name}"></div>',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'Dorothy');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference in an attribute with other text in the attribute',
      template: '<div class="oz {name}"></div>',
      context: {name: 'Dorothy'},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'oz Dorothy');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference with a dot separated path',
      template: '{character.firstName}',
      context: {character: {firstName: 'Dorothy'}},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        return frag;
      })()
    },
    {
      description: 'Reference with a dot separated path where last step does not exist',
      template: 'Hello, {character.firstName}',
      context: {character: {}},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    },
    {
      description: 'Reference with a dot separated path where first step does not exist',
      template: 'Hello, {character.firstName}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello, '));
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    },
    {
      description: 'Single dot reference',
      template: '{.}',
      context: 'Dorothy',
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Dorothy'));
        return frag;
      })()
    },
    {
      description: 'Reference is a promise',
      template: '<div>{now}</div>',
      context: {
        now: new Promise((resolve) => {
          resolve('and later');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('and later'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference is a promise that rejects',
      template: '<div>{now}</div>',
      context: {
        now: new Promise((resolve, reject) => {
          reject();
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode(''));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference in an attribute is a promise',
      template: '<div class="{now}"></div>',
      context: {
        now: new Promise((resolve) => {
          resolve('later');
        })
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'later');
        frag.appendChild(div);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('blockquote');
        div.appendChild(document.createTextNode('The name is '));
        div.appendChild(document.createTextNode('Bond'));
        div.appendChild(document.createTextNode(', '));
        div.appendChild(document.createTextNode('James Bond'));
        div.appendChild(document.createTextNode('.'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Reference is a function that returns a Promise',
      template: '<blockquote>The name is {lastName}, {fullName}.</blockquote>',
      context: {
        fullName: function() {
          return new Promise(function(resolve) {
            resolve(this.firstName + ' ' + this.lastName);
          }.bind(this));
        },
        firstName: 'James',
        lastName: 'Bond'
      },
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('blockquote');
        div.appendChild(document.createTextNode('The name is '));
        div.appendChild(document.createTextNode('Bond'));
        div.appendChild(document.createTextNode(', '));
        div.appendChild(document.createTextNode('James Bond'));
        div.appendChild(document.createTextNode('.'));
        frag.appendChild(div);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('blockquote');
        div.appendChild(document.createTextNode('The name is '));
        div.appendChild(document.createTextNode('Bond'));
        div.appendChild(document.createTextNode('.'));
        frag.appendChild(div);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('blockquote');
        div.appendChild(document.createTextNode('The name is '));
        div.appendChild(document.createTextNode('Bond'));
        div.appendChild(document.createTextNode('.'));
        frag.appendChild(div);
        return frag;
      })()
    }
  ]
};

export default suite;
