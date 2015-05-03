# Acceptance Tests

Acceptance tests are tests that take a template (or multiple templates) and expect a given output. These tests are run through the Tornado `testRunner`, and must conform to the format defined below. Each acceptance test file should export a `tests` array with each of the tests.

## Test DSL

```
{
  description: 'A string describing the test',
  template: 'The Tornado template as a string',
  context: {} // The context to be used to render the template. If not provided, and empty object is used.
  expectedDom: function() {
    // Either the expected DOM or a function that returns the expected DOM
  },
  expectedHtml: 'The expected HTML as a string (mostly to ensure that the expected DOM is correct)',
  errorMessage: 'An optional string describing what went wrong'
}
```
