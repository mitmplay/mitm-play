<script>
import { debug } from 'svelte/internal';

import { tags } from './stores.js';  
const rmethod = /^(GET|PUT|POST|DELETE):([\w~-]+:|)(.+)/ // feat: tags in url
const replace = (s,p1,p2,p3) => p3

function unique(value, index, self) {
  return self.indexOf(value) === index;
}

function oneSite(ns) {
  const {toRegex} = window.mitm.fn;
  if ($tags.filterUrl) {
    const rgx = toRegex(ns.replace(/~/,'[^.]*'));
    return mitm.browser.activeUrl.match(rgx) || ns==='_global_';
  } else {
    return true;
  }
}

function itemlist(tags) {
  console.log('itemlist called...')
  const { __tag2, __tag3 } = tags
  const { routes } = window.mitm
  let urls = []
  for (const ns in __tag2) {
    if (oneSite(ns)) {
      const gtags =  __tag2[ns]
      for (const gtag in gtags) {
        if (gtags[gtag] && !gtag.match(/(url|flag|args):/)) {
          if (gtag.match('url:')) {
            const key = gtag.split(':').pop()
            for (const url in __tag3[ns]) {
              console.log({url, key})
              if (url.match(key)) {
                urls.push(url)
              }
            }
          } else if (gtag.match(':')) {
            let arr = routes[ns][gtag]
            if (!Array.isArray(arr)) {
              arr = Object.keys(arr)              
            }
            urls = urls.concat(urls, arr);
          }
        }
      }
    }
  }
  for (const ns in __tag3) {
    if (oneSite(ns)) {
      const _ns = __tag3[ns]
      if (Array.isArray(_ns)) {
        urls = urls.concat(urls, _ns);
      } else {
        for (const url in _ns) {
          if (_ns[url]) {
            let ok = true
            const rules = _ns[url]
            for (const id in rules) {
              if (typeof rules[id]!=='string') {
                const tags = rules[id]
                for (const tag in tags) {
                  if (tags[tag]===false) {
                    ok = false
                    break
                  }
                }
              }
              if (rules[id]===false) {
                ok = false
              }
            }
            ok && (urls.push(url))
          }
        }
      }
    }
  }
  urls = urls.map(str => (str+'').replace(rmethod, replace))
  return urls.filter(unique).sort() //(a, b) => b.length - a.length
}
</script>

<ul>
  {#each itemlist($tags) as item}
    <li><div class="url">* {item}</div></li>
  {/each}
</ul>

<style>
.url {
  font-size: 12px;
  font-weight: 600;
  margin-left: 17px;
  color: chocolate;
  font-family: monospace;
}
</style>
