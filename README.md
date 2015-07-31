# Tornado&mdash;Fast, Secure, HTML templates

Tornado is an HTML templating language for the server and the browser. In the browser, Tornado renders DOM immediately and dynamic values asynchronously as the data becomes available.

## Trying Tornado

The easiest way to try Tornado is with the [sandbox](http://smfoote.github.io/tornado/). More complete documentation is coming soon.

## Using Tornado

To install the Node.js package:
```
$ npm install tornado.js
```

### Compiling templates in Node

```
var tornado = require('tornado.js');
var fs = require('fs');

var templateString = '<h1>Hello, {name}</h1>';
var templateName = 'hello';

var compiledTemplate = tornado.compile(templateString, templateName);
fs.writeFileSync('hello.js', compiledTemplate);
```

### Compiling templates from the command line

Use `tornado --help` for more information on CLI options
```
$ tornado hello.td > hello.js
```

### Using your compiled templates

Now your templates are compiled and you are ready to use them on your page. You need both the Tornado runtime and the compiled templates on the page, and the Tornado runtime must be included first. For now, the Tornado runtime can be found at [https://raw.githubusercontent.com/smfoote/tornado/master/dist/runtime.js](https://raw.githubusercontent.com/smfoote/tornado/master/dist/runtime.js). A properly released version will be available on or before August 15, 2015.

```
var container = document.getElementById('content-container');
var template = td.getTemplate('hello');
container.appendChild(template.render({ name: 'World' }));
```

## Contributing

If you are reading this section, you are awesome! Thanks for your interest in contributing. For more information on contributing, please review the [Tornado Constitution](constitution/CONTENTS.md). A more comprehensive contributors' guide will be ready soon. In the meantime, following the steps below will get you up and running.

### Building

To build the project, run (this needs to be run after each change is made to code in the `src/` directory):

```
$ grunt
```

### Sandbox

You can use the Sandbox to try out your changes and see output, compiled template, and the AST. To prepare the Sandbox, run:

```
$ grunt sandbox
```

Then open /test/sandbox/index.html in your browser.

### Tests

Acceptance tests are found in [test/acceptance/](test/acceptance/). If you make changes to the tests, run:

```
$ grunt acceptance
```

To see the results of the tests, open tests/acceptance/index.html in your browser.
