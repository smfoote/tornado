# Tornado&mdash;Fast, Secure, HTML templates

Tornado is an HTML templating language for the server and the browser. Tornado renders DOM immediately and dynamic values asynchronously as the data becomes available.

## Using Tornado

The easiest way to try Tornado is with the [sandbox](http://smfoote.github.io/tornado/). A preview release of Tornado is expected to be available by June 1, 2015, but if you want to start using Tornado before then, you can build it yourself following the steps below.

Clone the Tornado repository:

```
$ git clone
```

Install [Node.js](https://nodejs.org/) and Grunt if they are not already installed. Then, from the project's root directory, run:

```
$ grunt
```

You now have a parser, compiler, and runtime available in the `dist/` directory. For an example of how to package these up using Browserify, see [test/sandbox/sandbox.js](test/sandbox/sandbox.js), [test/sandbox/index.html](test/sandbox/index.html), and the Browserify Grunt task in [Gruntfile.js](Gruntfile.js).

## Contributing

If you are reading this section, you are awesome! Thanks for your interest in contributing. For more information on contributing, please review the [Tornado Constitution](constitution/CONTENTS.md). Several aspects of the project, including building, testing, and packaging are still in flux. However, following the steps below will get you up and running.

### Sandbox

You can use the Sandbox to try out your changes and see output, compiled template, and the AST. To prepare the Sandbox, run:

```
$ grunt sandbox
```

Then open /test/sandbox/index.html in your browser.

### Tests

Acceptance tests are found in [tests/acceptance/](tests/acceptance/). To run the tests:

```
grunt acceptance
```

Then open tests/acceptance/index.html in your browser.

## Known Issues

- Server side rendering is not yet supported.
