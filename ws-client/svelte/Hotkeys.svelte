<script>
import { onMount } from 'svelte';
const _c = 'color: blueviolet'

let keys = []
$: _keys = keys 

onMount(async () => {
  console.log('%cMounted...', _c);
  setTimeout(()=>{
    const {macrokeys: mkey} = window.mitm
    keys = []
    for (const id in mkey) {
      keys.push({id, title: mkey[id]._title})
    }
  }, 1000)
});

</script>

<div class="vbox">
  Hot-keys:
  <ul>
    {#each _keys as obj}
      <li>{obj.id} - {obj.title}</li>
    {/each}
  </ul>
</div>

<style type="text/scss">
  .vbox {
    position: absolute;
    color:blue;
  }
</style>