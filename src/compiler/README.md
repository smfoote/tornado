# Comiler Architecture

The compiler receives an AST from the parser, then passes over that AST in 3 stages (checks, transforms, generates). Each stage may have multiple passes, and each pass is run in order. The output of this process is a set of code generation instructions that are fed to a code generator, and the code generator outputs compiled code.

## Checks

Check for bad Tornado code. A linter could be implemented in the check stage.

## Transforms

The Tornado grammar accepts anything that appears to be valid Tornado/HTML (which keeps logic in the parser to a minimum). The transform stage walks and transforms the AST as necessary. In this stage, HTML entities can be replaced with unicode characters, elements with non-HTML XML Namespaces can be marked as such (e.g. SVG elements), and inconsistent attribute names can be adjusted. Optionally, whitespace and blacklisted elements (e.g. `script` or `style`) can be stripped.

## Generates

The transformed AST is fed to the generates stage. The generate passes are used to create a series of code generation instructions. This will probably happen in a single pass, but multiple passes are possible.

## Code generation

The series of code generation instructions are fed to a code generator. Because the instructions are language agnostic, code generators can be created for virtually any programming language. The code generator executes each of the instructions and outputs a string, which is the compiled code.

### Code Generation Instructions

Instruction Format:

#### action

```
['open', 'close', 'insert']
```
The action to be performed by the code generator

#### nodeType

```
[
  'TORNADO_BODY', 'TORNADO_REFERENCE', 'TORNADO_COMMENT', 'TORNADO_PARTIAL', 'PLAIN_TEXT',
  'HTML_ELEMENT', 'HTML_ATTRIBUTE', 'HTML_COMMENT'
]
```
The type of node to be acted upon

#### tdBody

```
\d+
```
The index of the Tornado body the node is in.

#### Example:

```
{
  action: 'open',
  nodeType: 'TORNADO_BODY',
  tdBody: 0
}
```
The action above should open a new Tornado Body within tdBody 0.
