<script>
import stringify from "json-stringify-pretty-compact";

export let json = {}

let keys = Object.keys(json) 
</script>

<div class=sv-item>
{#each keys as key}
<details class='sv-data sv-{key}'>
  <summary class=sv-title>{key}</summary>
  <pre class='sv-{key}'>{stringify(json[key])}</pre>
</details>
{/each}
</div>

<style>
.sv-item {
  padding-left: 14px;
}
.sv-title, pre {
  font-family: Consolas, Monaco, Courier, monospace;
  font-size: small;
  margin: 0;
}
.sv-title:hover {
  background-color: lightgoldenrodyellow;
}
.sv-respBody {
  color: blueviolet;
  font-weight: 600;
}
</style>
