<script>
import stringify from "json-stringify-pretty-compact";

export let json = {}

let keys = Object.keys(json) 
</script>

<div class=item>
{#each keys as key}
<details class='data {key}'>
  <summary class=title>{key}</summary>
  <pre class={key}>{stringify(json[key])}</pre>
</details>
{/each}
</div>

<style>
div.item {
  padding-left: 14px;
}
summary.title, pre {
  font-family: Consolas, Monaco, Courier, monospace;
  font-size: small;
  margin: 0;
}
summary.title:hover {
  background-color: lightgoldenrodyellow;
}
</style>
