<script>
import { onMount } from 'svelte';
import { source } from './stores.js';

onMount(() => {
  document.querySelector('#markdown').onclick = function(e) {
    const { hash } = e.target;
    console.log('clicked', hash);
    if (hash) {
      e.preventDefault();
      e.stopPropagation();
      // location.hash = hash;
      const behavior = 'auto';
      const element = document.querySelector(hash);
      const top = element.getBoundingClientRect().top - 40;
      const _window = document.querySelector('.show-container');
      _window.scroll({top, behavior});
    }
  };
});

const r = /(%.{2}|[~.])/g;
function content(src) {
  console.log('plot the content...');
  setTimeout(() => {
    const arr = document.querySelectorAll('h1,h2,h3,h4,h5');
    for (let node of arr) {
      node.id = node.id.replace(r, '');
      console.log(node);
    }
  }, 1);
  return src.content;
}
</script>

<div class="show-container">
  <div id="markdown">
    {@html content($source)}
  </div>
</div>

<style>
  .show-container {
    position: relative;
    height: calc(100vh - 25px);  
    overflow: auto;
  }
</style>
