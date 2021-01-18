<script>
import UrlStyle from './Url-style.svelte';

export let items = {}
export let btn = {}
export let _id = ''

let all = true
let def = true
let arr = []

function allcheck() {
  setTimeout(() => {
    def = all
    for (const id in btn) {
      btn[id] = all
    }
  }, 1)
}
function defcheck() {
  setTimeout(() => {
    for (const id in btn) {
      btn._notag = def
    }
  }, 1)
}

function itemArray(i) {
  arr = Object.keys(i)
  return ''
}
</script>

{itemArray(items)}
<div class="btn-container">
  {#if arr.length>1}
    <label class="checker">
      <input
      type="checkbox"
      on:click="{allcheck}"
      bind:checked={all}/>
      all
    </label>
    <label class="checker">
      <input
      type="checkbox"
      on:click="{defcheck}"
      bind:checked={def}/>
      def
    </label>
  {/if}
  {#each arr as item}
    <label class="checker">
      <input
      type="checkbox"
      bind:checked={btn[item]}/>
      {item}
    </label>
  {/each}
</div>
<UrlStyle {_id} {btn}/>

<style>
.btn-container {
  display: inline;
  font-size: 11px;
}
</style>