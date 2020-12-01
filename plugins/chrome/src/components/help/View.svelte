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

let mermaid;
const r = /(%.{2}|[~.])/g;
function content(src) {
  !mermaid && (mermaid = window.mermaid);
  console.log('plot the content...');
  setTimeout(() => {
    if (document.querySelector('#markdown div.mermaid')) {
      mermaid.init();
    }
    if (!document.querySelector('#markdown a.up')) {
      let _top;
      const h1 = document.querySelector('h1');
      const arr = document.querySelectorAll('h1,h2,h3,h4,h5');
      h1 && (_top = ` <a class="up" href="#${h1.id}">{up}</a>`); 
      for (let [i, node] of arr.entries()) {
        if (_top && i > 0) {
          node.innerHTML = `${node.innerHTML}${_top}`
        }
        node.id = node.id.replace(r, '');
        console.log(node);
      }
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
