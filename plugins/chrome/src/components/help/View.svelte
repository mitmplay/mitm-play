<script>
import { onMount } from 'svelte';
import { source } from './stores.js';
const _c = 'color: blueviolet'

onMount(() => {
  console.log('%cHelp: onMount help/view', _c);
  document.querySelector('#markdown').onclick = function(e) {
    const { hash, href } = e.target;
    if (href===undefined) {
      return
    }
    console.log('%cHelp: clicked', _c, hash);
    if (href.match(/^chrome-extension/)) {
      if (hash) {
        e.preventDefault();
        e.stopPropagation();
        // location.hash = hash;
        const behavior = 'auto';
        const element = document.querySelector(hash);
        const top = element.getBoundingClientRect().top - 40;
        const _window = document.querySelector('.show-container');
        _window.scroll({top, behavior});
      } else {
        console.log('Link having incorrect href!')
      }
    } else {
      let node = e.target
      while (node.id!=='markdown') {
        if (node.nodeName==='A') {
          console.log('%cHelp: anchor', _c);
          if (node.href.match(/https?:\//)) {
            e.preventDefault();
            e.stopPropagation();
            chrome.tabs.create({ url: node.href });
          }
          break;
        }
        node = node.parentElement;
      }
    }
  };
});

let mermaid;
const r = /(%.{2}|[~.])/g;
function content(src) {
  !mermaid && (mermaid = window.mermaid);
  // console.log('plot the content...');
  setTimeout(() => {
    if (document.querySelector('#markdown .mermaid')) {
      mermaid.init();
    }
    const arr = document.querySelectorAll('div.details')
    for (let node of arr) {
      const title = node.getAttribute('title')
      const details = document.createElement('details')
      details.innerHTML = `<summary class="test">${title}</summary>`
      const childs = []
      for (let child of node.children) {
        childs.push(child)
      }
      for (let child of childs) {
        details.appendChild(child)
      }
      node.appendChild(details)
      node.classList.remove('details')
    }
    if (!document.querySelector('#markdown a.up')) {
      let _top;
      const h1 = document.querySelector('h1');
      const arr = document.querySelectorAll('h1,h2,h3,h4,h5');
      h1 && (_top = ` <a class="up" href="#${h1.id}"> ↑ </a>`); 
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
