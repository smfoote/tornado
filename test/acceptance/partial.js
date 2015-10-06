/*eslint no-eval:0 */
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
      expectedHTML: '<div>I am the partial</div>'
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
      expectedHTML: '<span>Before</span><div>I am the partial</div><span>After</span>'
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
      expectedHTML: '<main><div>I am the partial</div></main>'
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
      expectedHTML: '<div class="&quot;/&amp;gt;<script>alert(&quot;bad stuff&quot;)</script>"></div>'
    }
  ]
};

export default suite;
