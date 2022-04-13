<script>
import { tags } from './stores.js';
import Tags2Title from './Tags2_Title.svelte';
const {machMethod, removeMethod} = window.mitm.fn;
const _c = 'color: blueviolet'

export let items;
export let ns;

function clicked(e) {
  const { resetRule2, resetRule3 } = window.mitm.fn;
  const {__tag1,__tag2,__tag3} = $tags;
  const {item} = e.target.dataset;
  const namespace = __tag2[ns];
  const tagx = {};
  for (let itm in namespace) {
    tagx[itm] = namespace[itm]
  }
  setTimeout(()=>{
    console.log('%cTags: e', _c, {__tag2,__tag3});
    resetRule2($tags, item, ns, tagx)
    resetRule3($tags, item, ns)
    tags.set({
      ...$tags,
      __tag1,
      __tag2,
      __tag3,
    })
  }, 10);
}

function itemlist(items) {
  const {fn: {sortTag}} = window.mitm;
  let arr = Object.keys(items);
  if ($tags.uniq) {
    arr = arr.filter(x => x.match(':')).filter(x => !x.match('url:'))
  }
  return arr.sort(sortTag);
}

function routetag(tags, item) {
  const {__tag1, __tag2, fn: {rclass}} = window.mitm
  const _tags = __tag2[ns][item].tag1 || [] // feat: update __tag2
  const tag2 = item.split(':')

  let klas
  if (tag2[1]) {
    klas = items[item].state ? 'rtag slc' : 'rtag'; // feat: update __tag2
  } else {
    klas = items[item].state ? 'stag slc' : ''; // feat: update __tag2
  }
  if (item.match('url:')) {
    klas += ' url'
  }
  if (_tags.length) {
    let isTagsOk = false
    for (const tag of _tags) { //# __tag2_TO_tag1_RULES
      const tg = tag.replace(/^!/,'')
      if (tag[0]==='!' && __tag1[ns][tg]!==undefined) {
        if (!__tag1[ns][tg]) {
          isTagsOk = true
          break
        }
      } else if (__tag1[ns][tg]) {
        isTagsOk = true
        break
      }
    }
    if (!isTagsOk) {
      klas += ' grey'
    }
  }
  return klas + ` _${tag2.pop().replace(rclass, '-')}`
}

function show(item) {
  const short = {request: 'reqs', response: 'resp'}
  const [k,v] = item.split(':');
  if (v===undefined) {
    return `${k} `
  };
  return `${v}{${short[k] || k}}`;
}

function linkTags(item) {
  const {tag1} = window.mitm.__tag2[ns][item] // feat: update __tag2
  const linkTags = tag1 && tag1.length ? `[${tag1.join(',')}]` : ''
  return linkTags;
}

function isGroup(item) {
  const [sec, tag] = item.split(':')
  return tag && sec!=='url'
}

function urllist(_tags, item) {
  const {__tag2, fn: { noTagInRule, uniq }} = window.mitm;
  const {tag1} = __tag2[ns][item] // feat: update __tag2
  if (tag1 && tag1.length) {
    item = `${item} ${tag1.join(' ')}`
  }
  let obj = window.mitm.routes[ns][item]
  if (obj===undefined) {
    obj = []
  } else if (!Array.isArray(obj)) {
    obj = Object.keys(obj)
  }
  obj = obj.map(x=>noTagInRule(x,_tags.mth)).filter(uniq).sort()
  return obj
}

function alltags(tags, item, path) {
  const { tagsIn__tag3 } = window.mitm.fn;
  return tagsIn__tag3(tags, ns, path, item)
}

function spacex(tags, item, path) {
  let klass = items[item].state ? 'slc' : ''; // feat: update __tag2
  const { rclass, isRuleOff } = window.mitm.fn;
  isRuleOff(tags, ns, path) && (klass += ' grey');
  const _tags = alltags(tags, item, path)
  _tags.length && (klass += ` _${_tags.join(' _')}`)
  return `${klass} _${item.split(':')[1].replace(rclass, '-')}`
}

function q(key) {
  return key.replace(/[@~.]/g, '-')
}

function checked(tags, item) {
  let klas = ''
  if (tags.check && !item) {
    klas += 'hidden'
  }
  return klas
}

function props(tags, item) {
  let props = {}
  if (tags.check) {
    props.disabled = true
  }
  return props
}
</script>

<div data-app=Tags2_1 class="border">
  <!-- feat: auto collapsed between tag2 & tag3 -->
  <Tags2Title on:message {ns}/>
  {#each itemlist(items) as item}
    <div data-app=Tags2_1_items class="t2 {q(ns)} {checked($tags, items[item].state)}">
    {#if isGroup(item)}
      <details>
        <summary class="space1 {routetag($tags, item)}">
          <label>
            <input type="checkbox"
            data-item={item}
            on:click={clicked} 
            bind:checked={items[item].state}
            {...props($tags, items[item].state)}/> <!-- // feat: update __tag2 -->
            <span class="itm {item.match(':') ? 'big' : ''}">{show(item)}</span>
            <span class="link-tags">{linkTags(item)}</span>
          </label> 
        </summary>
        {#each urllist($tags, item) as path}
          <div class="spacex {spacex($tags, item, path)}">
            {#if $tags.mth && machMethod(path)}
              {removeMethod(path)}<span class="with-method">[{machMethod(path)[1]}]</span>
            {:else}
              {path}
            {/if}
          </div>
        {/each}
      </details>
    {:else}
      <div class="space1 {routetag($tags, item)}">
        <label>
          <input type="checkbox"
          data-item={item}
          on:click={clicked} 
          bind:checked={items[item].state}
          {...props($tags, items[item].state)}/> <!-- // feat: update __tag2 -->
          <span class="itm {item.match(':') ? 'big' : ''}">{show(item)}</span>
          <span class="link-tags">{linkTags(item)}</span>
        </label>
      </div>
    {/if}
    </div>
  {/each}
</div>

<style>
.ns {
  margin-left: -3px;
  font-size: 15px;
}
.t2.hidden {
  display: none;
}
.border {
  border: 1px grey solid;
}
summary label {
  margin-left: 11px;
  margin-top: -15px;
  vertical-align: middle;
}
summary label input {
  vertical-align: -0.6px;
}
summary.space1 {
  padding-left: 5px;
}
summary.space1 .link-tags {
  margin-left: -6px;
}
.space1 .link-tags {
  margin-left: -1px;
}
.space1 .link-tags {
  font-size: 10px;
  font-family: roboto;
  color: darkmagenta;
}
.grey .link-tags {
  color: gray;
  font-weight: 100;
}
.space1 {
  color: grey;
  padding-left: 16px;
}
.space1 span {
  font-size: 13px;
  vertical-align: 2px;
}
.space1 .itm {
  margin-left: -2px;
  font-family: serif;
}
.spacex {
  padding-left: 30px;
  color: #ecd7d7;
  font-size: 12px;
  font-family: monospace;
}
.space1.rtag.grey {
  color: #d18a8a;
}
.spacex.slc {
  color: blueviolet;
}
.spacex.grey {
  color: #ecd7d7;
}
.rtag {
  font-size: 13px;
  color: cadetblue;
  background-color: beige;
}
.rtag.url {
  background-color: inherit;
}
.rtag.slc {
  color: red;
  font-weight: bolder;
}
.rtag.slc.url {
  color: #c36e01;
  font-weight: bolder;
}
.stag.slc {
  color: green;
  font-weight: bolder;
}
span.with-method {
  color: coral;
  font-size: 9px;
}
</style>
