let suite = {
  name: 'HTML',
  tests: [
    {
      description: 'Empty element, no attributes',
      template: '<div></div>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Void element, no attributes',
      template: '<input>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('input');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Empty element with one attribute',
      template: '<div id="test"></div>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('id', 'test');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Empty element with multiple attributes',
      template: '<div id="test" class="hello" data-url="linkedin.com"></div>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('id', 'test');
        div.setAttribute('class', 'hello');
        div.setAttribute('data-url', 'linkedin.com');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Element with text inside',
      template: '<p>Is this thing on?</p>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('p');
        div.appendChild(document.createTextNode('Is this thing on?'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Element with element inside',
      template: '<div><p></p></div>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        let p = document.createElement('p');
        div.appendChild(p);
        frag.appendChild(div);
        return frag;
      })()
    },{
      description: 'Element with text and element inside',
      template: '<div>Text<p class="inside"></p></div>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        let p = document.createElement('p');
        div.appendChild(document.createTextNode('Text'));
        p.setAttribute('class', 'inside');
        div.appendChild(p);
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Element with html in attribute',
      template: '<a href="<img>">Click</a>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let a = document.createElement('a');
        a.setAttribute('href', '<img>');
        a.appendChild(document.createTextNode('Click'));
        frag.appendChild(a);
        return frag;
      })()
    },
    {
      description: 'Textarea with text inside',
      template: '<textarea>var test = hello;</textarea>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let ta = document.createElement('textarea');
        ta.defaultValue = 'var test = hello;';
        frag.appendChild(ta);
        return frag;
      })()
    },
    {
      description: 'Textarea with HTML inside',
      template: '<textarea><script>alert("Hacked!");</script></textarea>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let ta = document.createElement('textarea');
        ta.defaultValue = '<script>alert("Hacked!");</script>';
        frag.appendChild(ta);
        return frag;
      })()
    },
    {
      description: 'SVG created with a namespace',
      template: `<svg version="1.1" baseProfile="full" width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red" /></svg>`,
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('version', '1.1');
        svg.setAttribute('baseProfile', 'full');
        svg.setAttribute('width', '300');
        svg.setAttribute('height', '200');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'red');
        svg.appendChild(rect);
        frag.appendChild(svg);
        return frag;
      })()
    }
  ]
};

export default suite;
