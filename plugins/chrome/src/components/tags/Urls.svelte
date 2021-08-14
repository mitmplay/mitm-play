<script>
import { rerender } from './rerender.js';
import { tags } from './stores.js';

import Title1 from './Title-1.svelte';
import Title2 from './Title-2.svelte';
import TitleBtn from './Title-btn.svelte';
import TitleUrl from './Title-url.svelte';
const _c = 'color: blueviolet'

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
  def: true,
}
let btn2 = {
  flag: true,
  args: true,
  def: true
}
let _urls, _cfgs, title1, title2
function itemlist(tagsStore, rerender) {
  console.log('%cTags: rerender...', _c);
  const { __tag1, __tag2, __tag3, __urls, routes, fn } = window.mitm;
  const { rmethod, noTagInRule, isRuleOff, oneSite } = fn;
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

  for (let ns in __tag2) {
    if (oneSite(tagsStore, ns)) {
      ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
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
                  const tags = paths[path][sec].tags // tags3
                  if (sec.slice(0, 1)!==':') {
                    addUrl2(sec, _path, Object.keys(tags))
                    break
                  }
                }
              }
            }
          } else if (sec.match(':')) {
            let skip = false
            const tags = tag2.tag1 || []
            for (const tag of tags) {
              if (__tag1[ns][tag]===false) {
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
                const _path = addUrls(url)
                addUrl2(sec, _path, [tag])
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
  for (let ns in __tag3) {
    if (oneSite(tagsStore, ns)) {
      ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
      const paths = __tag3[ns]
      for (const path in paths) {
        if (!isRuleOff(window.mitm, ns, path)) {
          const _path = addUrls(path)
          const secs = paths[path]
          for (const sec in secs) {
            const tags = secs[sec].tags // tags3
            if (sec.slice(0, 1)!==':') {
              addUrl2(sec, _path, Object.keys(tags))
            }
          }
        }
      }
    }
  }
  for (let ns in __urls) {
    if (oneSite(tagsStore, ns)) {
      ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
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
    for (let ns in __urls) {
      if (oneSite(tagsStore, ns)) {
        ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
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
    if (item.tags.indexOf('_notag')) {
      title1.def = true
    }
    for (const sec of item.secs) {
      title1[sec] = true
    }
  }
  for (const item of _cfgs) {
    if (item.tags.indexOf('_notag')) {
      title2.def = true
    }
    for (const sec of item.secs) {
      title2[sec] = true
    }
  }
  return ''
}
</script>

{itemlist($tags, $rerender)}
<table id='table-urls'>
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
th {
  padding-left: 5px;
}
td {
  padding: 5px 0;
  border: thin solid;
}
</style>
