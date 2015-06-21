{?results}
<ul class="results">
  {#results}
    <li class="result {type}">
      <h3>{headerText}</h3>
      <h4>{headline}</h4>
      <img src="{imageUrl}" alt="{fullName}">
      {?connections}
        <ul>
          {#connections}
            <li>{fullName} - {position}</li>
          {/connections}
        </ul>
      {/connections}
    </li>
  {/results}
</ul>
{/results}
