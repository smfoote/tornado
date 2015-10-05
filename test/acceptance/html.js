let suite = {
  name: 'HTML',
  tests: [
    {
      description: 'Empty element, no attributes',
      template: '<div></div>',
      context: {},
      expectedHTML: '<div></div>'
    },
    {
      description: 'Void element, no attributes',
      template: '<input>',
      context: {},
      expectedHTML: '<input>'
    },
    {
      description: 'HTML comment with text inside',
      template: '<!-- hi there -->',
      context: {},
      expectedHTML: '<!-- hi there -->'
    },
    {
      description: 'HTML comment with HTML inside',
      template: '<!-- <script>alert(\'bad stuff!\');</script> -->',
      context: {},
      expectedHTML: '<!-- <script>alert(\'bad stuff!\');</script> -->'
    },
    {
      description: 'HTML attribute whose value contains characters that look like an HTML comment',
      template: '<div class="<!-- comment -->"></div>',
      context: {},
      expectedHTML: '<div class="<!-- comment -->"></div>'
    },
    {
      description: 'Empty element with one attribute',
      template: '<div id="test"></div>',
      context: {},
      expectedHTML: '<div id="test"></div>'
    },
    {
      description: 'Empty element with multiple attributes',
      template: '<div id="test" class="hello" data-url="linkedin.com"></div>',
      context: {},
      expectedHTML: '<div id="test" class="hello" data-url="linkedin.com"></div>'
    },
    {
      description: 'Element with text inside',
      template: '<p>Is this thing on?</p>',
      context: {},
      expectedHTML: '<p>Is this thing on?</p>'
    },
    {
      description: 'Element with element inside',
      template: '<div><p></p></div>',
      context: {},
      expectedHTML: '<div><p></p></div>'
    },{
      description: 'Element with text and element inside',
      template: '<div>Text<p class="inside"></p></div>',
      context: {},
      expectedHTML: '<div>Text<p class="inside"></p></div>'
    },
    {
      description: 'Element with html in attribute',
      template: '<a href="<img>">Click</a>',
      context: {},
      expectedHTML: '<a href="<img>">Click</a>'
    },
    {
      description: 'Textarea with text inside',
      template: '<textarea>var test = hello;</textarea>',
      context: {},
      expectedHTML: '<textarea>var test = hello;</textarea>'
    },
    {
      description: 'Textarea with HTML inside',
      template: '<textarea><script>alert("Hacked!");</script></textarea>',
      context: {},
      expectedHTML: '<textarea>&lt;script&gt;alert("Hacked!");&lt;/script&gt;</textarea>'
    },
    {
      description: 'SVG created with a namespace',
      template: `<svg version="1.1" baseProfile="full" width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red"/></svg>`,
      context: {},
      expectedHTML: `<svg version="1.1" baseProfile="full" width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red"></rect></svg>`
    }
  ]
};

export default suite;
