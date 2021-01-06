<script>
import { rerender } from './rerender.js';
import { debug } from 'svelte/internal';
import { tags } from './stores.js';  
const rmethod = /^(GET|PUT|POST|DELETE):([\w.~-]+:|)(.+)/ // feat: tags in url
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

function itemlist(rerender) {
  console.log('rerender...');
  const { __tag2, __tag3 } = window.mitm;
  const { isRuleOff } = window.mitm.fn;
  const { routes } = window.mitm
  let urls = []
  let url2 = {}

  function addUrl2(gtag, url) {
    url = url.replace(rmethod, replace)
    let [tag, oth] = gtag.split(':')
    if (url2[url]===undefined) {
      url2[url] = {}
    }
    if (url2[url][tag]===undefined) {
      url2[url][tag] = {}
    }
    url2[url][tag] = true
  }

  for (const ns in __tag2) {
    if (oneSite(ns)) {
      const gtags =  __tag2[ns]
      for (const gtag in gtags) {
        if (gtags[gtag] && !gtag.match(/(flag|args):/)) {
          if (gtag.match('url:')) {
            const key = gtag.split(':').pop()
            for (const url in __tag3[ns]) {
              if (url.match(key)) {
                urls.push(url)
                for (const id in __tag3[ns][url]) {
                  if (id.slice(0, 1)!==':') {
                    addUrl2(id, url)
                  }
                }
              }
            }
          } else if (gtag.match(':')) {
            let arr = routes[ns][gtag]
            if (!Array.isArray(arr)) {
              arr = Object.keys(arr)              
            }
            urls = urls.concat(urls, arr);
            for (const url of arr) {
              addUrl2(gtag, url)
            }
          }
        }
      }
    }
  }
  for (const ns in __tag3) {
    if (oneSite(ns)) {
      const _urls = __tag3[ns]
      for (const url in _urls) {
        if (!isRuleOff(window.mitm, ns, url)) {
          urls.push(url)
          for (const id in _urls[url]) {
            if (id.slice(0, 1)!==':') {
              addUrl2(id, url)
            }
          }
        }
      }
    }
  }
  urls = urls.map(str => (str+'').replace(rmethod, replace)).filter(unique)
  for (const [i, v] of urls.entries()) {
    if (url2[v]) {
      const arr = Object.keys(url2[v])
      urls[i] += ` <${arr.sort().join(' ')}>`
    }
  }
  urls = urls.sort() //(a, b) => b.length - a.length
  return urls
}
</script>

<ul>
  {#each itemlist($rerender) as item}
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
