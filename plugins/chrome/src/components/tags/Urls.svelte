<script>
import { rerender } from './rerender.js';
import { debug } from 'svelte/internal';
import { tags } from './stores.js';  
const rmethod = /^(GET|PUT|POST|DELETE|):([\w.#~-]+:|)(.+)/ // feat: tags in url
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
  const { noTagInRule, isRuleOff } = window.mitm.fn;
  const { routes } = window.mitm
  let urls = {}
  let url2 = {}
  let url3 = {}

  function addUrl2(sec, rule, tags) {
    rule = rule.replace(rmethod, replace)
    sec = sec.split(':')[0]
    if (url2[rule]===undefined) {
      url2[rule] = {}
    }
    if (url2[rule][sec]===undefined) {
      url2[rule][sec] = {}
    }
    url2[rule][sec] = true
    if (tags && Array.isArray(tags)) {
      for (let tag of tags) {
        tag = '_'+tag.split(':').pop().replace(/[.#~]/g, '-') // feat: tags in url
        if (url3[rule]===undefined) {
          url3[rule] = {}
        }
        if (url3[rule][tag]===undefined) {
          url3[rule][tag] = {}
        }
        url3[rule][tag] = true
      }
    }
  }
  function addUrls(rule) {
    rule = rule.replace(rmethod, replace)
    urls[rule] = true
    return rule
  }

  for (const ns in __tag2) {
    if (oneSite(ns)) {
      const secs =  __tag2[ns]
      for (const sec in secs) {
        if (secs[sec] && !sec.match(/(flag|args):/)) {
          if (sec.match('url:')) {
            const rules =  __tag3[ns]
            for (const rule in rules) {
              if (!isRuleOff(window.mitm, ns, rule)) {
                const _rule = addUrls(rule)
                for (const sec in rules[rule]) {
                  const tags = rules[rule][sec]
                  if (sec.slice(0, 1)!==':') {
                    addUrl2(sec, _rule, Object.keys(tags))
                    break
                  }
                }
              }
            }
          } else if (sec.match(':')) {
            const tag = sec.split(':')[1];
            let arr = routes[ns][sec]
            if (!Array.isArray(arr)) {
              for (const url in arr) {
                const rule = noTagInRule(url)
                if (!isRuleOff(window.mitm, ns, rule)) {
                  const _rule = addUrls(url)
                  addUrl2(sec, _rule, [tag])
                }
              }
            } else {
              for (const url of arr) {
                const rule = noTagInRule(url)
                if (!isRuleOff(window.mitm, ns, rule)) {
                  const _rule = addUrls(url)
                  addUrl2(sec, _rule, [tag])
                }
              }
            }
          }
        }
      }
      const _urls = mitm.__urls[ns] || []
      for (const url in _urls) {
        const {secs, tags} = _urls[url]
        for (const sec in secs) {
          const _rule = addUrls(url)
          addUrl2(sec, _rule, tags)
        }
      }
    }
  }
  for (const ns in __tag3) {
    if (oneSite(ns)) {
      const rules = __tag3[ns]
      for (const rule in rules) {
        if (!isRuleOff(window.mitm, ns, rule)) {
          const _rule = addUrls(rule)
          const secs = rules[rule]
          for (const sec in secs) {
            const tags = secs[sec]
            if (sec.slice(0, 1)!==':') {
              addUrl2(sec, _rule, Object.keys(tags))
            }
          }
        }
      }
    }
  }
  let arr = Object.keys(urls).sort()
  const urls2 = []
  for (const url of arr) {
    const secs = Object.keys(url2[url])
    const tags = Object.keys(url3[url])
    urls2.push({url, secs, tags})
  }
  return urls2
}
function title(item) {
  const {url, secs} = item
  return `* ${url} <${secs ? secs.join(' ') : ''}>`
}
</script>

<ul>
  {#each itemlist($rerender) as item}
    <li><div class="url {item.tags && item.tags.join(' ')}">{title(item)}</div></li>
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
.url._notag {
  color: cornflowerblue;
}
</style>
