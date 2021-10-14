<script>
  import { onMount, onDestroy } from 'svelte';

  let lst = {}
  let obj = {rows: []}
  onMount(async () => {
    const _distinct_ = ['session']
    const _where_= 'id>0 orderby id:d'
    obj = await mitm.fn.sqlList({_distinct_, _where_}, 'log')
    obj.rows.forEach(item => {
      lst[item.session] = []
    });
  })

  async function detailClick(e) {
    const ss = e.target.textContent
    console.log(ss)
    if (!lst[ss]?.length) {
      const obj = await mitm.fn.sqlList({_where_: `session=${ss} orderby id`}, 'log')
      lst[ss] = obj.rows
      console.log('lst:', obj.rows)
    }
  }
</script>

<div>
<b>Sqlite Logs!</b>
{#each obj.rows as item}
  <details class='session' data-ss={item.session} on:click={detailClick}>
    <summary>
      {item.session}
    </summary>
    {#if lst[item.session].length}
      {#each lst[item.session] as i2}
        <details class='rows'>
          <summary data-id={i2.id} data-ss={item.session}>
            <span>{i2.id}</span>
            <span>{i2.url.length>80 ? i2.url.slice(0, 80)+'...' : i2.url}</span>
          </summary>
          <details class='row-data'>
            <summary>header...</summary>
            <pre>{i2.meta}</pre>
          </details>
          <details class='row-data'>
            <summary>body...</summary>
            <pre>{i2.data}</pre>
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
details.rows {
  padding-left: 16px;
}
details.row-data {
  padding-left: 16px;
}
</style>