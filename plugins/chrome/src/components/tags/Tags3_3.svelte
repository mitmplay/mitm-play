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

    for (let itm in _item.tags) { // feat: update __tag3
      const [group2, id2] = itm.split('url:').pop().split('~');
      if (group1===group2 && item!==itm) {
        if (id2===undefined) {
          _item.tags[itm] = _item.tags[i]
        } else if (id1!==undefined && id1!==id2) {
          _item.tags[itm] = false;
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
  const { rclass } = window.mitm.fn;
  let klas = items[item] ? 'rtag slc' : 'rtag';
  if (item.indexOf('url:')>-1) {
    klas += ' url'
  } else if (item.indexOf(':')>-1) {
    klas += tags.__tag2[ns][item] ? ' slc' : ''
    klas += ' r2'
  }
  if (tags.check && !items.tags[item]) {
    klas += ' hidden'
  }
  return `${klas} _${item.split(':').pop().replace(rclass, '-')}`
}

function title(item) {
  let {tag1=''} = items
  const [key, tag] = item.split(':')
  tag1.length && (tag1 = `<span> [${tag1.join(',')}]</span>`)
  return tag ? `${tag}{${key}}` : `${key}${tag1}`
}
function xitems(tags) {
  const {uniq, sortTag} = window.mitm.fn;
  const arr = Object.keys(items.tags) // feat: update __tag3
  if (tags.__tag2[ns][item]!==undefined) {
    arr.push(item)
  }
  return arr.filter(uniq).sort(sortTag)
}
function check(item) {
  return item.indexOf('url:')===-1 && item.indexOf(':')>-1
}
function props(tags) {
  let props = {}
  if (tags.check) {
    props.disabled = true
  }
  return props
}
</script>

{#each xitems($tags) as item}
  <div class="space3 {routetag($tags, item)}">
    {#if item.match(/^\w?\.?---/)}
      <!-- line -->
    {:else if check(item) }
      <label>
        <input type="checkbox"
        data-item={item}
        checked={$tags.__tag2[ns][item]} disabled/>
        <span>{@html title(item)}</span>
      </label>
    {:else}
      <label>
        <input type="checkbox"
        data-item={item}
        on:click={clicked} 
        bind:checked={items.tags[item]}
        {...props($tags)}/>
        <span>{@html title(item)}</span>      
      </label>
    {/if}
  </div>
{/each}

<style>
.space3 {
  padding-left: 28px;
}
.space3 span {
  font-family: serif;
  vertical-align: 15%;
}
.space3.hidden {
  display: none;
}
:global(.space3 span>span) {
  font-size: 10px;
  font-family: roboto;
  color: darkmagenta;
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
