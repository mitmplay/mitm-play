<script>
import {spring} from 'svelte/motion'
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();
  
let dropTarget;
function draggable(node, params) {
  
  let lastX;
  let parentX;
  let offsetX = 0
  const offset = spring({x: offsetX, y: 0}, {
		stiffness: 0.2,
		damping: 0.4
	});

  offset.subscribe(offset => {
    const parent = node.parentNode;
    if (parent) {
      const left = parentX + offset.x
      parent.style.left = `${left}px`;
      parent.style.width = `calc(100vw - ${left}px`;
    }
  })

  node.addEventListener('mousedown', handleMousedown);

  function handleMousedown(event) {
    event.preventDefault()
		lastX = event.clientX;
    parentX = node.parentNode.offsetLeft;
    node.classList.add('dragged')

    dispatch('dragstart', {target:node, lastX});

		window.addEventListener('mousemove', handleMousemove);
		window.addEventListener('mouseup', handleMouseup);
	}

  function handleMousemove(e) {
    offsetX += e.clientX - lastX;
    offset.set({x: offsetX, y: 0});
    
		lastX = e.clientX;
    dispatch('drag', {target:node, left: node.parentNode.offsetLeft});
	}

  function handleMouseup(event) {
    offsetX = 0;
    dropTarget = null;
    lastX = undefined;
    parentX = undefined;

    node.classList.remove('dragged');
    offset.set({x: node.offsetLeft, y: 0});
    dispatch('dragend', {target: node, left: node.parentNode.offsetLeft});
    
		window.removeEventListener('mousemove', handleMousemove);
		window.removeEventListener('mouseup', handleMouseup);
	}
  
  return {
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
		}
	}
}
</script>

<div class="resize" use:draggable>.</div>

<style>
.resize {
  width: 2px;
  position: absolute;
  height: calc(100vh - 27px);
  background-color: #f3c49d;
  cursor: col-resize;
  z-index: 5;
}
</style>