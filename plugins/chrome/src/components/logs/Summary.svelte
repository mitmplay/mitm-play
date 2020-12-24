<script>
export let item; 
export let key;

let _checked = false;

function data(i) {
  const id = Object.keys(i)[0]
  const arr = i[id].path.split('/')
  arr.pop()
  return arr.join('/')
}

function clickHandler(e) {
  const node = e.currentTarget;
  let {path} = node.parentElement.dataset;
  _checked = node.checked;
}
</script>

<summary data-path={data(item)} class="{_checked}">
  <input on:click="{clickHandler}" type="checkbox" />
  {@html key}
</summary>

<style>
  summary.true {
    background: #f3dddd;
  }
  summary:hover {
    background: #eae4f1;
  }
  input[type="checkbox"] {
    vertical-align: middle;
  }
</style>