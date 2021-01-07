<script>
import { tags } from './stores.js';

export let items;
export let item;
export let path;
export let ns;

function clicked(e) {
  const {__tag3} = $tags;
  const _item = __tag3[ns][path][item]

  setTimeout(()=>{
    const {item: i} = e.target.dataset;
    const [group1, id1] = i.split('url:').pop().split('~');

    for (let itm in _item) {
      const [group2, id2] = itm.split('url:').pop().split('~');
      if (group1===group2 && item!==itm) {
        if (id2===undefined) {
          _item[itm] = _item[i]
        } else if (id1!==id2) {
          _item[itm] = false;
        }
      }
    }
    tags.set({
      ...$tags,
      __tag3,
    })
  }, 50);
}

function routetag(tags, item) {
  let klas = items[item] ? 'rtag slc' : 'rtag';
  if (item.indexOf('url:')>-1) {
    klas += ' url'
  } else if (item.indexOf(':')>-1) {
    klas += tags.__tag2[ns][item] ? ' slc' : ''
    klas += ' r2'
  }
  return klas
}

function uniq(value, index, self) {
  return self.indexOf(value) === index;
}
function title(item) {
  const [key, tag] = item.split(':')
  return tag ? `${tag}{${key}}` : key
}
function xitems(tags) {
  const {fn: {sortTag}} = window.mitm;
  const arr = Object.keys(items)
  if (tags.__tag2[ns][item]!==undefined) {
    arr.push(item)
  }
  return arr.filter(uniq).sort(sortTag)
}
function check(item) {
  return item.indexOf('url:')===-1 && item.indexOf(':')>-1
}
</script>

{#each xitems($tags) as item}
  <div class="space3 {routetag($tags, item)}">
    {#if check(item) }
      <label>
        <input type="checkbox"
        data-item={item}
        checked={$tags.__tag2[ns][item]} disabled/>
        <span>{title(item)}</span>
      </label>
    {:else}
      <label>
        <input type="checkbox"
        data-item={item}
        on:click={clicked} 
        bind:checked={items[item]}/>
        <span>{title(item)}</span>      
      </label>
    {/if}
  </div>
{/each}

<style>
.space3 {
  padding-left: 28px;
}
.space3 span {
  vertical-align: 15%;
}
.rtag {
  font-size: 13px;
  color: cadetblue;
}
.rtag.slc {
  color: #5dac75;
  font-weight: bolder;
}
.rtag.slc.url {
  color: #c36e01;
}
.rtag.slc.r2 {
  color: #ff1616
}
</style>
