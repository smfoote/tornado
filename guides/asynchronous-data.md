---
title: Asynchronous Data
layout: default
permalink: /guides/asynchronous-data/
---

## Synchronous API, Asynchronous Data

As you learned in the [Getting Started guide](/guides/getting-started), Tornado templates render synchronously, making the output easy to work with and understand. However, Tornado understands asynchronous data as well. If Tornado encounters asynchronous data (i.e. a Promise) in the context when a template is rendering, an empty placeholder will be inserted. When the Promise resolves, the placeholder will be replaced with the result.

### Placeholder content

Tornado takes this beautiful feature one step further by allowing you to insert placeholder content to be displayed while the asynchronous data is pending (read: loading spinners, jokes, etc.). The placeholder content is inserted using a `{:placeholder}` body, as shown in the example below.

```
{#commentData}
  {#comments}<p>{text}</p> {author}{/comments}
{:pending}
  <p>Loading comments...</p>
{/commentData}
```

Currently the `{:pending}` body can be used only with sections (`#`) and conditionals (`?` and `^`), but will soon be available to be used with all Tornado bodies, including custom helpers.

To take advantage of Tornado's asynchronous features, you need to put Promises in your context. For example:

```
{
  commentData: $.getJSON('/api/v2/comments')
}
```
