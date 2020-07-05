<script>
import {spring} from 'svelte/motion'

let dropTarget;
function draggable(node, params) {
  
  let lastX;
  let parentX;
  let startRect;
  let offsetX = 0
  const offset = spring({x: offsetX, y: 0}, {
		stiffness: 0.2,
		damping: 0.4
	});

  offset.subscribe(offset => {
    const parent = node.parentNode;
    if (parent) {
      console.log(parent.offsetLeft, offset.x)
      parent.style.left = (parentX + offset.x) + 'px';
    }
  })

  node.addEventListener('mousedown', handleMousedown);

  function handleMousedown(event) {
    event.preventDefault()
		lastX = event.clientX;
    parentX = node.parentNode.offsetLeft;
    if (!startRect) startRect = node.getBoundingClientRect();
    node.classList.add('dragged')

		node.dispatchEvent(new CustomEvent('dragstart', {detail: { lastX }}));

		window.addEventListener('mousemove', handleMousemove);
		window.addEventListener('mouseup', handleMouseup);
	}

  function handleMousemove(event) {
    const dx = event.clientX - lastX;
    offsetX += dx;
    offset.set({x: offsetX + dx, y: 0})
    
		lastX = event.clientX;
		node.dispatchEvent(new CustomEvent('drag', {detail: {lastX, dx}}))
	}

  function handleMouseup(event) {
    const parent = node.parentNode;
    window._codeResize = parent.offsetLeft;
    parent.style.left = parent.offsetLeft + 'px';

    offsetX = 0;
    lastX = undefined;
    parentX = undefined;
    startRect = undefined;

    dropTarget = null;
    node.classList.remove('dragged');
    offset.set({x: node.offsetLeft, y: 0});
		node.dispatchEvent(new CustomEvent('dragend', {detail: { lastX }}));
    
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