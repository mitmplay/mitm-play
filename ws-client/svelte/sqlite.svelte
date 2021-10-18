<script>
  import { onMount, onDestroy } from 'svelte';
  import Json from './Json.svelte';

  let lst = {}
  let obj = {rows: []}
  let path= false;
  let srch= false;
  let body= true;
  
  onMount(async () => {
    const rows = (window.innerHeight-100)/17.5
    console.log({rows})
    const _limit_ = rows
    const _distinct_ = ['session']
    const _where_= 'id>0 orderby id:d'
    obj = await mitm.fn.sqlList({_distinct_, _where_, _limit_}, 'log')
    obj.rows.forEach(item => {
      lst[item.session] = []
    });
  })

  async function detailClick(e) {
    const ss = e.target.textContent
    console.log(ss)
    if (!lst[ss]?.length) {
      const obj = await mitm.fn.sqlList({_where_: `session=${ss} orderby id`}, 'log')
      lst[ss] = obj.rows.map(x => {
        x.meta = JSON.parse(x.meta)
        if (x.meta.general.ext==='json') {
          x.data = JSON.parse(x.data)
          delete x.data.general
        }
        return x
      })
      console.log('lst:', obj.rows)
    }
  }

  async function expClick(e) {
    if (body) {
      const details = e.currentTarget.parentNode
      setTimeout(() => {
        if (details.attributes.open) {
          details.children[2].setAttribute('open','')
          const arr = details.querySelectorAll('.row-data.content details:is(.respBody,.respHeader)')
          for (const node of arr) {
            node.setAttribute('open','')
          }
        }
      }, 0);
    }
  }

  function host(url) {
    const obj = new URL(url)
    let msg = path ? obj.pathname : obj.origin + obj.pathname
    if (srch) {
      msg += obj.search
    }
    return msg.length>90 ? msg.slice(0, 90)+'...' : msg
  }
</script>

<div>
<b>Sqlite Logs!</b>
<label for=no-host>
  <input type=checkbox id=no-host bind:checked={path} />no-host
</label>
<label for=srch>
  <input type=checkbox id=srch bind:checked={srch} />srch
</label>
<label for=body>
  <input type=checkbox id=body bind:checked={body} />exp-body
</label>
{#each obj.rows as item}
  <details class='session' data-ss={item.session} on:click={detailClick}>
    <summary>
      {item.session}
    </summary>
    {#if lst[item.session].length}
      {#each lst[item.session] as i2}
        <details class='rows'>
          <summary class='title st{Math.trunc(i2.meta.general.status/100)}x' data-id={i2.id} data-ss={item.session} on:click={expClick}>
            {i2.meta.general.status}
            {i2.meta.general.method}
            {host(i2.url, path, srch)}
          </summary>
          <details class='row-data header'>
            <summary class='title header'>header</summary>
            <Json json={i2.meta}/>
          </details>
          <details class='row-data content'>
            <summary class='title content'>content</summary>
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
details.rows {
  padding-left: 16px;
}
details.row-data {
  padding-left: 14px;
}
summary.title, .row-data pre {
  font-family: Consolas, Monaco, Courier, monospace;
  font-size: small;
  margin: 0;
}
summary.st2x {
  color:#30047e;
}
summary.st3x, summary.st4x, summary.st5x {
  color: #b40000;
}

summary.title:hover {
  background-color: lightgoldenrodyellow;
}
</style>