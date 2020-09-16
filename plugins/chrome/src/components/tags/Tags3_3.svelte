<script>
import { tags } from './stores.js';

export let items;

function clicked(e) {
  setTimeout(()=>{
    const {item} = e.target.dataset;
    console.log('e', items[item]);
  }, 50);
}

function routetag(item) {
  return items[item] ? 'rtag slc' : 'rtag';
}
</script>

{#each Object.keys(items) as item}
  <div class="space3 {routetag(item)}">
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

.rtag {
  color: cadetblue;
  font-size: medium;
  font-style: italic;
  background-color: beige;
}
.rtag.slc {
  color: red;
  font-weight: bolder;
}
</style>
