/*eslint no-eval: 0 */

let suite = {
  name: 'Partials',
  tests: [
    {
      description: 'Partial alone',
      setup(parser, compiler) {
        let partial = '<div>I am the partial</div>';
        let ast = parser.parse(partial);
        let compiledTemplate = compiler.compile(ast, 'partial');
        eval(compiledTemplate);
      },
      template: '{>partial/}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('I am the partial'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Partial between HTML',
      setup(parser, compiler) {
        let partial = '<div>I am the partial</div>';
        let ast = parser.parse(partial);
        let compiledTemplate = compiler.compile(ast, 'partial');
        eval(compiledTemplate);
      },
      template: '<span>Before</span>{>partial/}<span>After</span>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let span = document.createElement('span');
        span.appendChild(document.createTextNode('Before'));
        frag.appendChild(span);
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('I am the partial'));
        frag.appendChild(div);
        span = document.createElement('span');
        span.appendChild(document.createTextNode('After'));
        frag.appendChild(span);
        return frag;
      })()
    },
    {
      description: 'Partial inside HTML body',
      setup(parser, compiler) {
        let partial = '<div>I am the partial</div>';
        let ast = parser.parse(partial);
        let compiledTemplate = compiler.compile(ast, 'partial');
        eval(compiledTemplate);
      },
      template: '<main>{>partial/}</main>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let main = document.createElement('main');
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('I am the partial'));
        main.appendChild(div);
        frag.appendChild(main);
        return frag;
      })()
    },
    {
      description: 'Partial in HTML attribute',
      setup(parser, compiler) {
        let partial = '"/><script>alert("bad stuff")</script>';
        let ast = parser.parse(partial);
        let compiledTemplate = compiler.compile(ast, 'partial');
        eval(compiledTemplate);
      },
      template: '<div class="{>partial/}"></div>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', '"/&gt;<script>alert("bad stuff")</script>');
        frag.appendChild(div);
        return frag;
      })()
    }
  ]
};

export default suite;
