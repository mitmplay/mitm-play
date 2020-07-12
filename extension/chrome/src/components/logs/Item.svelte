<script>
import { source } from './stores.js';
export let item;

function empty() {
  source.set({
    respHeader: {},
    headers: '',
    content: '',
    logid: '',
    title: '',
    path: '',
    url: '',
  })
}

function clickHandler(e) {
  let {logid} = e.currentTarget.dataset;
  if (logid===$source.logid) {
    empty();
  } else {
    empty();
    const o = window.mitm.files.log[logid];
    const src = {
      respHeader: o.respHeader,
      headers: '<empty>',
      content: '<empty>',
      logid: logid,
      title: o.title,
      path: o.path,
      url: logid.replace(/^.+\.mitm-play/,'https://localhost:3001'),
    }
    if (o.title.match('.png')) {
      setTimeout(() => {
        source.update(n => src)
      }, 0);
    } else {
      ws__send('getContent', {fpath: logid}, ({headers, content}) => {
        source.update(n => {
          return {
            ...src,
            headers,
            content,
          }
        })
      })
    }
  }
}

function s({general:g}) {
  return `_${Math.trunc(g.status/100)}`;
}

function m({general:g}) {
  return `${g.method.toLowerCase()}`;
}
function m2({general:g}) {
  return g.method + (g.ext ? ` <${g.ext.toUpperCase()}> ` : '');
}
function u({general:g}) {
  if (g.url.match('/log/')) {
    return g.url.split('@')[1];
  } else {
    return `${g.url.split('?')[0]}`;
  }
}
function p({general:g}) {
  if (g.url.match('/log/')) {
    return '';
  } else {
    const parms = g.url.split('?')[1];
    return parms ? `?${parms}` : '';
  }
}
</script>

<tr class="tr">
  <td class="{item.logid ? 'selected' : ''}">
    <div class="td-item {$source.logid===item.logid}"
    data-logid={item.logid}
    on:click="{clickHandler}"
    >
      <span class="status {s(item)}">{item.general.status}</span> 
      <span class="method {m(item)}">{m2(item)}</span> 
      <span class="url">{u(item)}</span> 
      <span class="prm">{p(item)}</span> 
    </div>
  </td>
</tr>

<style>
.td-item:hover {
  color: blue;
  font-weight: bolder;
}
td {
  border-bottom: 3px solid #c0d8cca1;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
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
.status {
  color: green;
  font-weight: bold;
}
.status._4,
.status._5 {
  color: red;
}
.method {
  color: green;
  font-weight: bold;
}
.method.post {
  color: #a7267f;
}
.prm {
  color: #ccb7b7;
}
</style>