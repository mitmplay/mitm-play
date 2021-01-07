<script>
import { rerender } from './rerender.js';
import { debug } from 'svelte/internal';
import { tags } from './stores.js';  
const rmethod = /^(GET|PUT|POST|DELETE):([\w.#~-]+:|)(.+)/ // feat: tags in url
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
  let urls = {}
  let url2 = {}
  let url3 = {}

  function addUrl2(gtag, url, tags) {
    url = url.replace(rmethod, replace)
    let [rule, oth] = gtag.split(':')
    if (url2[url]===undefined) {
      url2[url] = {}
    }
    if (url2[url][rule]===undefined) {
      url2[url][rule] = {}
    }
    url2[url][rule] = true
    if (tags && Array.isArray(tags)) {
      for (let tag of tags) {
        tag = '_'+tag.split(':').pop().replace(/[.#~]/g, '-') // feat: tags in url
        if (url3[url]===undefined) {
          url3[url] = {}
        }
        if (url3[url][tag]===undefined) {
          url3[url][tag] = {}
        }
        url3[url][tag] = true
      }
    }
  }
  function addUrls(url) {
    url = url.replace(rmethod, replace)
    urls[url] = true
    return url
  }

  for (const ns in __tag2) {
    if (oneSite(ns)) {
      const gtags =  __tag2[ns]
      for (const gtag in gtags) {
        if (gtags[gtag] && !gtag.match(/(flag|args):/)) {
          if (gtag.match('url:')) {
            const key = gtag.split(':').pop()
            for (const url in __tag3[ns]) {
              if (!isRuleOff(window.mitm, ns, url)) {
                if (url.match(key)) {
                  const _url = addUrls(url)
                  for (const id in __tag3[ns][url]) {
                    const tags = __tag3[ns][url][id]
                    if (id.slice(0, 1)!==':') {
                      addUrl2(id, _url, Object.keys(tags))
                    }
                  }
                }
              }
            }
          } else if (gtag.match(':')) {
            const tag = gtag.split(':')[1];
            let arr = routes[ns][gtag]
            if (!Array.isArray(arr)) {
              for (const url in arr) {
                const _url = addUrls(url)
                addUrl2(gtag, _url, [tag])
              }
            } else {
              for (const url of arr) {
                const _url = addUrls(url)
                addUrl2(gtag, _url, [tag])
              }
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
          const _url = addUrls(url)
          for (const id in _urls[url]) {
            const tags = _urls[url][id]
            if (id.slice(0, 1)!==':') {
              addUrl2(id, _url, Object.keys(tags))
            }
          }
        }
      }
    }
  }
  let arr = Object.keys(urls).sort()
  const urls2 = []
  for (const url of arr) {
    const rules = Object.keys(url2[url])
    const tags = Object.keys(url3[url])
    urls2.push({url, rules, tags})
  }
  return urls2
}
function title(item) {
  return `* ${item.url} <${item.rules.join(' ')}>`
}
</script>

<ul>
  {#each itemlist($rerender) as item}
    <li><div class="url {item.tags && item.tags.join(' ')}">* {item.url} {item.rules && `<${item.rules.join(' ')}>`}</div></li>
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
