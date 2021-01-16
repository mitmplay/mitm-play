<script>
import { rerender } from './rerender.js';
import { tags } from './stores.js';

import Title1 from './Title-1.svelte';
import Title2 from './Title-2.svelte';
import TitleBtn from './Title-btn.svelte';
import TitleUrl from './Title-url.svelte';


const replace = (s,p1,p2,p3) => p3;
let btn1 = {
  response: true,
  request: true,
  cache: true,
  mock: true,
  html: true,
  json: true,
  css: true,
  js: true,
  log: true,
}
let btn2 = {
  flag: true,
  args: true,
}
let _urls, _cfgs, title1, title2
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
  const { __tag1, __tag2, __tag3, __urls } = window.mitm;
  const { rmethod, noTagInRule, isRuleOff } = window.mitm.fn;
  const { routes } = window.mitm
  let urls = {}
  let url2 = {}
  let url3 = {}

  function addUrl2(sec, path, tags) {
    const { rclass } = window.mitm.fn;
    path = path.replace(rmethod, replace)
    sec = sec.split(':')[0]
    if (url2[path]===undefined) {
      url2[path] = {}
    }
    if (url2[path][sec]===undefined) {
      url2[path][sec] = {}
    }
    url2[path][sec] = true
    if (tags && Array.isArray(tags)) {
      for (let tag of tags) {
        tag = '_'+tag.split(':').pop().replace(rclass, '-') // feat: tags in url
        if (url3[path]===undefined) {
          url3[path] = {}
        }
        if (url3[path][tag]===undefined) {
          url3[path][tag] = {}
        }
        url3[path][tag] = true
      }
    }
  }
  function addUrls(path) {
    path = path.replace(rmethod, replace)
    urls[path] = true
    return path
  }

  for (const ns in __tag2) {
    if (oneSite(ns)) {
      const secs =  __tag2[ns]
      for (let sec in secs) {
        const tag2 = secs[sec]
        if (tag2.state && !sec.match(/(flag|args):/)) {
          if (sec.match('url:')) {
            const paths =  __tag3[ns]
            for (const path in paths) {
              if (!isRuleOff(window.mitm, ns, path)) {
                const _path = addUrls(path)
                for (const sec in paths[path]) {
                  const tags = paths[path][sec]
                  if (sec.slice(0, 1)!==':') {
                    addUrl2(sec, _path, Object.keys(tags))
                    break
                  }
                }
              }
            }
          } else if (sec.match(':')) {
            let skip = false
            const tags = tag2.tags || []
            for (const tag of tags) {
              if (__tag1[tag]===false) {
                skip = true
                break
              }
            }
            if (skip) {
              continue;
            }
            if (tags.length) {
              sec = `${sec} ${tags.join(' ')}`
            }
            const tag = sec.split(':')[1];
            let arr = routes[ns][sec]
            if (!Array.isArray(arr)) {
              for (const url in arr) {
                const path = noTagInRule(url)
                if (!isRuleOff(window.mitm, ns, path)) {
                  const _path = addUrls(url)
                  addUrl2(sec, _path, [tag])
                }
              }
            } else {
              for (const url of arr) {
                const path = noTagInRule(url)
                if (!isRuleOff(window.mitm, ns, path)) {
                  const _path = addUrls(url)
                  addUrl2(sec, _path, [tag])
                }
              }
            }
          }
        }
      }
    }
  }
  for (const ns in __tag3) {
    if (oneSite(ns)) {
      const paths = __tag3[ns]
      for (const path in paths) {
        if (!isRuleOff(window.mitm, ns, path)) {
          const _path = addUrls(path)
          const secs = paths[path]
          for (const sec in secs) {
            const tags = secs[sec]
            if (sec.slice(0, 1)!==':') {
              addUrl2(sec, _path, Object.keys(tags))
            }
          }
        }
      }
    }
  }
  for (const ns in __urls) {
    if (oneSite(ns)) {
      const _urls = __urls[ns] || []
      for (const url in _urls) {
        const {pure, secs, tags} = _urls[url]
        if (pure) {
          for (const sec in secs) {
            const _path = addUrls(url)
            addUrl2(sec, _path, tags)
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
    !ctyp.length && (ctyp = false)
    if (secs.find(x => /^(args|flag)/.test(x))) {
      urls3.push({url, secs, ctyp, tags})
    } else {
      urls2.push({url, secs, ctyp, tags})
    }
  }
  title1 = {}
  title2 = {}
  _urls = urls2
  _cfgs = urls3
  for (const item of _urls) {
    for (const sec of item.secs) {
      title1[sec] = true
    }
  }
  for (const item of _cfgs) {
    for (const sec of item.secs) {
      title2[sec] = true
    }
  }
  return ''
}
</script>

{itemlist($rerender)}
<table>
  <tr>
    <th><Title1><TitleBtn _id="urls" items={title1} btn={btn1}/></Title1></th>
    <th><Title2><TitleBtn _id="farg" items={title2} btn={btn2}/></Title2></th>
  </tr>
  <tr>
    <td>
      <style id="urls"></style>
      <ul class="urls">
        {#each _urls as item}
        <li class="{item.secs.join(' ')}"><TitleUrl {item}/></li>
        {/each}
      </ul>      
    </td>
    <td>
      <style id="farg"></style>
      <ul class="farg">
        {#each _cfgs as item}
        <li class="{item.secs.join(' ')}"><TitleUrl {item}/></li>
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
