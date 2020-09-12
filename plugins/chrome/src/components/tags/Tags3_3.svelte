<script>
import { tags } from './stores.js';

export let items;

function clicked(e) {
  setTimeout(()=>{
    const {item} = e.target.dataset;
    console.log('e', items[item]);
  }, 50);
}
</script>

{#each Object.keys(items) as item}
  <div class="space3">
    <label>
      <input type="checkbox"
      data-item={item}
      on:click={clicked} 
      bind:checked={items[item]}/>
      {item}
    </label>
  </div>
{/each}

<style>
.space3 {
  padding-left: 30px;
}
</style>
