let tests = [
  {
    description: 'Reference alone should render a text node in a document fragment',
    template: '{name}',
    context: {name: 'Dorothy'},
    expectedDom: (() => {
      let frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode('Dorothy'));
      return frag;
    })(),
    expectedHtml: 'Dorothy'
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
    })(),
    expectedHtml: 'Dorothy of Kansas'
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
    })(),
    expectedHtml: 'Helen Hunt'
  },
  {
    description: 'Reference surrounded by text',
    template: 'Ruby {color} slippers',
    context: {name: 'red'},
    expectedDom: (() => {
      let frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode('Ruby '));
      frag.appendChild(document.createTextNode('red'));
      frag.appendChild(document.createTextNode(' slippers'));
      return frag;
    })(),
    expectedHtml: 'Ruby red slippers'
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
    })(),
    expectedHtml: 'Dorothy<div></div>'
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
    })(),
    expectedHtml: '<div></div>Hunt'
  },
  {
    description: 'Reference surrounded by elements',
    template: '<span></span>{color}<span></span>',
    context: {name: 'red'},
    expectedDom: (() => {
      let frag = document.createDocumentFragment();
      frag.appendChild(document.createElement('span'));
      frag.appendChild(document.createTextNode('red'));
      frag.appendChild(document.createElement('span'));
      return frag;
    })(),
    expectedHtml: '<span></span>red<span></span>'
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
    })(),
    expectedHtml: '<div>Dorothy</div>'
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
    })(),
    expectedHtml: '<div>Toto is a dog</div>'
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
    })(),
    expectedHtml: '<div><span>Toto</span></div>'
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
    })(),
    expectedHtml: '<div class="Dorothy"></div>'
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
    })(),
    expectedHtml: '<div class="oz Dorothy"></div>'
  },
  {
    description: 'Reference with a dot separated path',
    template: '{character.firstName}',
    context: {character: {firstName: 'Dorothy'}},
    expectedDom: (() => {
      let frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode('Dorothy'));
      return frag;
    })(),
    expectedHtml: 'Dorothy'
  },
  {
    description: 'Single dot reference',
    template: '{.}',
    context: 'Dorothy',
    expectedDom: (() => {
      let frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode('Dorothy'));
      return frag;
    })(),
    expectedHtml: 'Dorothy'
  },
  {
    description: 'Reference is a promise',
    template: '<div>{now}</div>',
    context: {
      now: new Promise((resolve, reject) => {
        resolve('and later')
      })
    },
    expectedDom: (() => {
      let frag = document.createDocumentFragment();
      let div = document.createElement('div');
      div.appendChild(document.createTextNode('and later'));
      frag.appendChild(div);
      return frag;
    })(),
    expectedHtml: '<div>and later</div>'
  }
];

module.exports = tests;
