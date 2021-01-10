<script>
import { rerender } from './rerender.js';
import { tags } from './stores.js';

import TitleUrl from './Title-url.svelte';
const replace = (s,p1,p2,p3) => p3;

let _urls, _cfgs
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
  const { __tag2, __tag3, __urls } = window.mitm;
  const { rmethod, noTagInRule, isRuleOff } = window.mitm.fn;
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
      const _urls = __urls[ns] || []
      for (const url in _urls) {
        const {pure, secs, tags} = _urls[url]
        if (pure) {
          for (const sec in secs) {
            const _rule = addUrls(url)
            addUrl2(sec, _rule, tags)
          }
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
  const urls3 = []
  for (const url of arr) {
    const secs = Object.keys(url2[url])
    const tags = Object.keys(url3[url])
    let ctyp = []
    for (const ns in __urls) {
      if (oneSite(ns)) {
        const _urls = __urls[ns] || []
        for (const _url in _urls) {
          if (url===_url) {
            ctyp = _urls[_url].ctyp
            break
          }
        }
      }
    }
    if (secs.find(x => /^(args|flag)/.test(x))) {
      urls3.push({url, secs, ctyp, tags})
    } else {
      urls2.push({url, secs, ctyp, tags})
    }
  }
  _urls = urls2
  _cfgs = urls3
  return ''
}
function title(item) {
  const {url, secs} = item
  const ctyp = item.ctyp ? `[${item.ctyp.join(',')}]` : '[]'
  return `* ${url}{${secs ? secs.join(' ') : ''}}${ctyp==='[]' ? '' : ctyp}`
}
</script>

{itemlist($rerender)}
<table>
  <tr>
    <th>URLs</th>
    <th>Flag &  Args</th>
  </tr>
  <tr>
    <td>
      <ul>
        {#each _urls as item}
        <li><TitleUrl {item}/></li>
        {/each}
      </ul>      
    </td>
    <td>
      <ul>
        {#each _cfgs as item}
        <li><TitleUrl {item}/></li>
        {/each}
      </ul>      
    </td>
  </tr>
</table>

<style>
table {
  width: calc(100% - 12px);
  margin: 5px;
}
th, td {
  width: 50%;
}
th {
  padding-left: 5px;
}
td {
  padding: 5px 0;
  border: thin solid;
}
</style>
