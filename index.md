---
title: Tornado.js
layout: default
---
<div id="input">
 <textarea id="template" placeholder="Template goes here"><h2>Tornado Watch</h2>
{#weather}
  <h3>Weather in {location.city}</h3>
  <ul class="forecast">
    <li>
      <h4 class="date">Current</h4>
      {@weatherIcon code=item.condition.code desc=item.condition.text}{item.condition.text}{/weatherIcon}
      <div class="temp">
        <span class="high">{item.condition.temp}</span>
      </div>
    </li>
    {#item.forecast}
      <li>
      <h4 class="date">{date}</h4>
      {@weatherIcon code=code desc=text}{text}{/weatherIcon}
      <div class="temp">
        <span class="high">{high}</span><span class="low">{low}</span>
      </div>
    </li>
    {/item.forecast}
  </ul>
{:pending}
  {#locations}
    <h3 class="header-pl"></h3>
    <ul class="forecast">
      {@repeat count=5}
        <li>
          <h4 class="date-pl"></h4>
          <div class="icon-pl"></div>
          <div class="temp-pl"><span class="high"></span><span class="low"></span></div>
        </li>
      {/repeat}
    </ul>
  {/locations}
{/weather}

<p>Weather data provided by <a href="https://developer.yahoo.com/weather/">Yahoo!</a> Weather icons provided by <a href="http://www.alessioatzeni.com/meteocons/">Meteocons</a>.</p>
</textarea>
  <textarea id="context" placeholder="Context goes here">{
  weather: function() {
    var url = this.baseURL + this.YQLQuery();
    return fetch(url).then(function(res) {
      return res.json().then(function(d) {
        return d.query.results.channel;
      });
    });
  },

  YQLQuery: function() {
    var locationsQuery = this.locations.map(function(location) {
      return 'text="' + location + '"';
    }).join(' OR ');
    var str = 'select * from weather.forecast where woeid in (select woeid from geo.places(1) where ' + locationsQuery + ')';
    return str.replace(' ', '%20').replace('=', '%3D').replace('"', '%22');
  },

  baseURL: 'https://query.yahooapis.com/v1/public/yql?format=json&q=',

  locations: [
    'Salt Lake City, UT',
    'Mountain View, CA'
  ]
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
