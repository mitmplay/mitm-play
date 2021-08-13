<script> // feat: profile
import { source } from './stores.js';
const _c = 'color: blueviolet'

export let item;
export let onChange;

function clickHandler(e) {
  let {item} = e.target.dataset;
  const { editor: { _profile, _profileEdit }, files } = mitm;
  const obj = files.profile[item];
  const url = item;
  console.log(`%cProfile: ${item}`, _c);

  if (_profile===undefined) {
    _profileEdit(obj.content);
  } else {
    _profile.setValue(obj.content || '');
    _profile.revealLine(1);
  }
  setTimeout(() => {
    onChange(false);

    source.update(n => {
      return {
        ...n,
        goDisabled: (url===undefined),
        content: obj.content,
        fpath: obj.fpath,
        path: obj.path,
        item,
      }
    });
  }, 1);
}
</script>

<div class="td-item {$source.fpath===item.fpath}"
  data-item={item.element}
  on:click="{clickHandler}"
>{item.title}</div>

<style>
.td-item {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;
  border-bottom: 1px solid #c0d8cca1;
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
}
</style>
