<script>
import stringify from "json-stringify-pretty-compact";

export let general = {}
export let json = {}

let keys = Object.keys(json) 
</script>

<div class=sv-item>
{#each keys as key}
<details class='sv-data sv-{key} st{Math.trunc(general.status/100)}x'>
  <summary class=sv-title>{key}</summary>
  <pre>{stringify(json[key])}</pre>
</details>
{/each}
</div>

<style lang="scss">
.sv-item {
  padding-left: 14px;
}
.sv-title, pre {
  font-family: monospace;
  font-size: small;
  margin: 0;
}
.sv-title:hover {
  background-color: lightgoldenrodyellow;
}
.sv-respBody {
  color: blueviolet;
  font-weight: 600;
  &:is(.st4x,.st5x) {
    color: red;
  }
}
.sv-reqsBody {
  color: mediumvioletred;
  font-weight: 600;
}
</style>
