<script> // feat: profile
import { cfg, resize } from '../monaco/init';
import { source } from './stores.js';

export let item;
export let onChange;

function initCodeEditor(src) {
  console.log('load monaco: profile')
  const element = window.document.getElementById('profile');
  const _profile =  window.monaco.editor.create(element, cfg);
  const ro = new ResizeObserver(resize(_profile))
  ro.observe(element);

  window.mitm.editor._profile = _profile;
  window.mitm.editor._profileEl = element;

  _profile.onDidChangeModelContent(onChange);
  _profile.setValue(src);
}

function clickHandler(e) {
  let {item} = e.target.dataset;
  const url = item;
  const { editor: { _profile }, files } = window.mitm;
  const obj = files.profile[item];
  console.log(item, obj);

  if (_profile===undefined) {
    initCodeEditor(obj.content);
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

<tr class="tr">
  <td>
    <div class="td-item {$source.fpath===item.fpath}"
      data-item={item.element}
      on:click="{clickHandler}"
    >{item.title}</div>
  </td>
</tr>

<style>
.td-item:hover {
  color: blue;
  font-weight: bolder;
}
td {
  border-bottom: 3px solid #c0d8cca1;
}
.td-item,
.td-show {
  cursor: pointer;
  padding: 0.1rem;
  line-height: 15px;
  padding-left: 5px;  
}
.td-item.true {
  color: blue;
  font-weight: bolder;
  background: greenyellow;
}
</style>
