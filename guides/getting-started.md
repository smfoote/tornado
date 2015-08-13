---
title: Getting Started
layout: default
permalink: /guides/getting-started/
---

## Background

Tornado is heavily inspired by [Dust](http://www.dustjs.com/), with an increased emphasis on security, performance, extensibility, and modern web standards. If you have used Dust, the syntax and features of Tornado will be familiar.

## Writing Templates

A Tornado template consists of (valid) HTML, data references, and helpers. Tornado includes several built-in helpers (see below), and more helpers can be found in the [helper store](/store/helpers).

### References

Wrap a key from your context in curly braces (`{example}`) and Tornado will insert the value related to that key into your HTML.

Tornado Template

```
<p>Hello, {name}</p>
```

Context

```
{
  name: 'world'
}
```

Result

```
<p>Hello, world</p>
```

### Exists (`?`) and Not-Exists (`^`) Helpers

The exists and not-exists helpers output their contents if their values are truthy or falsy, respectively (see the [syntax docs](/docs/template) for info on what is truthy in Tornado).

```
{?isAllowed}
  <p>The content in here will only be displayed if <code>isAllowed</code> is truthy.</p>
{/isAllowed}
```

#### `{:else}` and `{:pending}`

Use `{:else}` to output content if the truthiness check fails:

```
{?authorized}
  <p>Here is your top secret information</p>
{:else}
  <p>Nice try. You're not authorized</p>
{/authorized}
```

Tornado understands [JavaScript Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). Use `{:pending}` to display placeholder content while you wait for the Promise to resolve:

Tornado Template

```
{?authorized}
  <p>Looks like your credentials check out</p>
{:pending}
  <p>Checking your credentials</p>
{:else}
  <p>Not authorized!</p>
{/authorized}
```

Context

```
{
  authorized: function() {
    return $.getJSON('/checkAuth').then(function(res) {
      return res.isAuthorized;
    });
  }
}
```

### Section Helper (`#`)

When you use a section helper, the value of the given key becomes the new context within the body of the section.

Tornado Template

```
{#user}
  <p>The user's name is {name}, and email is {email}</p>
{/user}
```

Context

```
{
  user: {
    name: 'Jimmy',
    email: 'jimmy@example.com'
  }
}
```

#### Looping with the Section Helper

When the new context is an array, Tornado will output the section body for each item in the array. NOTE: The current context can be referenced with a dot: `{.}`.

Tornado Template

```
<ul>
{#colors}
  <p>{.}</p>
{/colors}
</ul>
```

Context

```
{
  colors: ['red', 'white', 'blue']
}
```

### Partial Helper (`>`)

The partial helper will insert another template into your current template. The inserted template will be rendered with the context from the paretn template.

```
<ul class="results">
{#searchResults}
  {>searchResult/}
{/searchResults}
</li>
```

### Named Helper (`@`)

Each of the built-in helpers mentioned above can also use the named helper syntax (e.g. `{@section key="searchResults"}`). All other helpers must use the named helper syntax.

### And More!


## Rendering Templates

A rendered Tornado template outputs a [Document Fragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).
