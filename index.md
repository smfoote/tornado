---
title: Tornado.js
layout: default
---
<div id="input">
 <textarea id="template" placeholder="Template goes here"><h3>What's on reddit:</h3>
<ul>
  {#reddit.data.children}
    <li>
      {#data.thumbnail}
        <img src="{.}">
      {/data.thumbnail}
      <p>{data.author}</p>
      <a href="{data.url}">{data.title}</a>
    </li>
  {:pending}
    <div class="container">
      <div class="img-placeholder"></div>
      <div class="content-container">
        <div class="headline-placeholder"></div>
        <div class="description-placeholder">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="img-placeholder"></div>
      <div class="content-container">
        <div class="headline-placeholder"></div>
        <div class="description-placeholder">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  {/reddit.data.children}
</ul></textarea>
 <textarea id="context" placeholder="Context goes here">{
  reddit: fetch('http://www.reddit.com/.json?limit=10').then(function(res) {
    return res.json();
  })
}</textarea></textarea>
 <button id="render">Render</button>
</div>
<div id="output">
 <h2>Actual output</h2>
 <div class="output"></div>
 <h2>Stringified output</h2>
 <pre class="string"></pre>
 <h2>Compiled Template</h2>
 <pre class="compiled"></pre>
 <h2>Abstract Syntax Tree</h2>
 <pre class="ast"></pre>
</div>
<script src="test/sandbox/bundle.js"></script>
