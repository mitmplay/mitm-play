<script>
  import { onMount, onDestroy } from 'svelte';
  import Json from './Json.svelte';

  let lst = {}
  let obj = {rows: []}
  let query= false;
  let path = true;
  let body = true;
  
  onMount(async () => {
    const rows = (window.innerHeight-100)/17.5
    console.log({rows})
    const _limit_ = rows
    const _count_ = {total:'id'}
    const _distinct_ = ['session']
    const _where_= 'id>0 orderby id:d'
    obj = await mitm.fn.sqlList({_count_, _distinct_, _where_, _limit_}, 'log')
    obj.rows.forEach(item => {
      lst[item.session] = []
    });
  })

  async function detailClick(e) {
    const ss = e.currentTarget.dataset.ss
    if (!lst[ss]?.length) {
      const obj = await mitm.fn.sqlList({_where_: `session=${ss} orderby id`}, 'log')
      lst[ss] = obj.rows.map(x => {
        x.meta = JSON.parse(x.meta)
        if (x.meta.general.ext==='json') {
          x.data = JSON.parse(x.data)
          delete x.data.general
          if (x.meta.general.method==='GET') {
            delete x.data.reqsBody
          }
        }
        return x
      })
      console.log(ss, obj.rows)
    }
  }

  async function expClick(e) {
    if (body) {
      const details = e.currentTarget.parentNode
      setTimeout(() => {
        if (details.attributes.open) {
          details.children[2].setAttribute('open','')
          const arr1 = details.querySelectorAll('.sv-content:is(.mt-GET,.mt-DELETE) details:is(.sv-respBody,.sv-respHeader)')
          const arr2 = details.querySelectorAll('.sv-content:is(.mt-PUT,.mt-POST) details:is(.sv-reqsBody)')
          for (const node of arr1) { node.setAttribute('open', '') }
          for (const node of arr2) { node.setAttribute('open', '') }
        }
      }, 0);
    }
  }

  function host(url) {
    const obj = new URL(url)
    let msg = path ? obj.pathname : obj.origin + obj.pathname
    if (query) {
      msg += obj.search
    }
    return msg.length>90 ? msg.slice(0, 90)+'...' : msg
  }
</script>

<div>
<b>Sqlite Logs!</b>
<label for=sv-body>
  <input type=checkbox id=sv-body bind:checked={body} />exp-body
</label>
<label for=sv-no-host>
  <input type=checkbox id=sv-no-host bind:checked={path} />no-host
</label>
<label for=sv-query>
  <input type=checkbox id=sv-query bind:checked={query} />query
</label>
{#each obj.rows as item}
  <details class=sv-session data-ss={item.session} on:click={detailClick}>
    <summary>
      {item.session}<span class=sv-total>({item.total})</span>
    </summary>
    {#if lst[item.session].length}
      {#each lst[item.session] as i2}
        <details class='sv-rows'>
          <summary 
          data-id={i2.id}
          data-ss={item.session}
          class='sv-title st{Math.trunc(i2.meta.general.status/100)}x'
          on:click={expClick}>
            <span class=sv-{i2.meta.general.status}>{i2.meta.general.status}</span>
            <span class=sv-{i2.meta.general.method}>{i2.meta.general.method.padEnd(4,'.')}</span>
            <span class=sv-{path?'path':'fullpath'}>{host(i2.url, path, query)}</span>
          </summary>
          <details class='sv-row-data sv-header'>
            <summary class='sv-title sv-header'>header</summary>
            <Json json={i2.meta}/>
          </details>
          <details class='sv-row-data sv-content mt-{i2.meta.general.method}'>
            <summary class='sv-title sv-content'>content</summary>
            {#if i2.meta.general.ext==='json'}
              <Json json={i2.data}/>
            {:else}
              <pre>{i2.data}</pre>
            {/if}
          </details>
        </details>        
      {/each}
    {:else}
      loading-1...          
    {/if}
  </details>
{/each}
</div>

<style>
[type=checkbox] {
  vertical-align: middle;
}
.sv-rows {
  padding-left: 16px;
}
.sv-row-data {
  padding-left: 14px;
}
.sv-total {
  font-size: x-small;
  vertical-align: text-top;
  color: darkmagenta;
}
.sv-title, .sv-row-data pre {
  font-family: monospace;
  font-weight: bold;
  font-size: small;
  margin: 0;
}
summary:is(.st2x) {
  color:#30047e;
}
summary:is(.st3x,.st4x,.st5x) {
  color: #b40000;
}
.sv-POST,.sv-PUT {
  color: crimson;
}
.sv-DELETE {
  color: red
}
.sv-path {
  color: darkgreen;
}
.sv-fullpath {
  color: darkmagenta;
}
.sv-title:hover {
  background-color: lightgoldenrodyellow;
}
</style>
