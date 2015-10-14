/*eslint no-eval:0 */
let suite = {
  name: 'Blocks and Inline Partials',
  tests: [
    {
      description: 'Block with no inline partial',
      template: '{+block/}',
      context: {},
      expectedHTML: ''
    },
    {
      description: 'Block with default text, no inline partial',
      template: '{+block}Default{/block}',
      context: {},
      expectedHTML: 'Default'
    },
    {
      description: 'Multiple blocks, same name, different default text.',
      template: '{+block}Default{/block} and {+block}Default2{/block}',
      context: {},
      expectedHTML: 'Default and Default2'
    },
    {
      description: 'Multiple blocks, different names.',
      template: '{+block}Default{/block} and {+block2}Default2{/block2}',
      context: {},
      expectedHTML: 'Default and Default2'
    },
    {
      description: 'Block inside html',
      template: '<b>{+block}Default{/block}</b>',
      context: {},
      expectedHTML: '<b>Default</b>'
    },
    {
      description: 'Block inside attribute',
      template: '<div class="{+block}Default{/block}"></div>',
      context: {},
      expectedHTML: '<div class="Default"></div>'
    },
    {
      description: 'Block with inline-partial',
      template: '{+block/}{<block}Hello!{/block}',
      context: {},
      expectedHTML: 'Hello!'
    },
    {
      description: 'Block with default and inline-partial',
      template: '{+block}default{/block}{<block}Hello!{/block}',
      context: {},
      expectedHTML: 'Hello!'
    },
    {
      description: 'Multiple blocks with default and inline-partial',
      template: '{+block}default{/block}{+block}default2{/block}{<block}Hello!{/block}',
      context: {},
      expectedHTML: 'Hello!Hello!'
    },
    {
      description: 'Block inside attribute with inline-partial',
      template: '<div class="{+block}Default{/block}"></div>{<block}yellow{/block}',
      context: {},
      expectedHTML: '<div class="yellow"></div>'
    },
    {
      description: 'Block in parent template, inline-partial in child template',
      setup(parser, compiler) {
        let parent = '<div>{+content/}</div>';
        let ast = parser.parse(parent);
        let compiledTemplate = compiler.compile(ast, 'parent');
        eval(compiledTemplate);
      },
      template: '{>parent/}{<content}Child content{/content}',
      context: {},
      expectedHTML: '<div>Child content</div>'
    }
  ]
};

export default suite;
