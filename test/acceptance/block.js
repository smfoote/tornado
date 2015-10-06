/*eslint no-eval:0 */
let suite = {
  name: 'Blocks and Inline Partials',
  tests: [
    {
      description: 'Block with no inline partial',
      template: '{+block/}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        return frag;
      })()
    },
    {
      description: 'Block with default text, no inline partial',
      template: '{+block}Default{/block}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Default'));
        return frag;
      })()
    },
    {
      description: 'Multiple blocks, same name, different default text.',
      template: '{+block}Default{/block} and {+block}Default2{/block}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Default'));
        frag.appendChild(document.createTextNode(' and '));
        frag.appendChild(document.createTextNode('Default2'));
        return frag;
      })()
    },
    {
      description: 'Multiple blocks, different names.',
      template: '{+block}Default{/block} and {+block2}Default2{/block2}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Default'));
        frag.appendChild(document.createTextNode(' and '));
        frag.appendChild(document.createTextNode('Default2'));
        return frag;
      })()
    },
    {
      description: 'Block inside html',
      template: '<b>{+block}Default{/block}</b>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let b = document.createElement('b');
        b.appendChild(document.createTextNode('Default'));
        frag.appendChild(b);
        return frag;
      })()
    },
    {
      description: 'Block inside attribute',
      template: '<div class="{+block}Default{/block}"></div>',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'Default');
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Block with inline-partial',
      template: '{+block/}{<block}Hello!{/block}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello!'));
        return frag;
      })()
    },
    {
      description: 'Block with default and inline-partial',
      template: '{+block}default{/block}{<block}Hello!{/block}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello!'));
        return frag;
      })()
    },
    {
      description: 'Multiple blocks with default and inline-partial',
      template: '{+block}default{/block}{+block}default2{/block}{<block}Hello!{/block}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('Hello!'));
        frag.appendChild(document.createTextNode('Hello!'));
        return frag;
      })()
    },
    {
      description: 'Block inside attribute with inline-partial',
      template: '<div class="{+block}Default{/block}"></div>{<block}yellow{/block}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.setAttribute('class', 'yellow');
        frag.appendChild(div);
        return frag;
      })()
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
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Child content'));
        frag.appendChild(div);
        return frag;
      })()
    },
    {
      description: 'Block with default in parent template, inline-partial in child template',
      setup(parser, compiler) {
        let parent = '<div>{+content}default{/content}</div>';
        let ast = parser.parse(parent);
        let compiledTemplate = compiler.compile(ast, 'parent');
        eval(compiledTemplate);
      },
      template: '{>parent/}{<content}Child content{/content}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        let div = document.createElement('div');
        div.appendChild(document.createTextNode('Child content'));
        frag.appendChild(div);
        return frag;
      })()
    }
  ]
};

export default suite;
