/* global chrome */
import App from './App.svelte'
const rmethod = /^(GET|PUT|POST|DELETE|)#?\d*!?:([ \!\(\)\w.#~-]+:|)(.+)/ //# __tag2_TO_tag1_RULES // feat: tags in url
const tmethod = /^(GET|PUT|POST|DELETE):/
const rclass = /[\(\).#~/]+/g
const _c = 'color: lightskyblue'

console.log('%cMitm: Load MITM plugin', _c)

function machMethod(path) {
  return path.match(tmethod);
}

function removeMethod(path) {
  return path.replace(tmethod, '');
}

function toRegex (str, flags = '') {
  return new RegExp(str
    .replace(/\//g, '\\/')
    .replace(/\?/g, '\\?')
    .replace(/\.([^*+]|$)/g, (m,p1) => `\\.${p1}`)
    .replace(/(\[.*)(\\\/)(.*\])/g, (m,p1,p2,p3) => `${p1}/${p3}`)
    .replace(/(\[.*)(\\\?)(.*\])/g, (m,p1,p2,p3) => `${p1}?${p3}`)
    .replace(/(\[.*)(\\\.)(.*\])/g, (m,p1,p2,p3) => `${p1}.${p3}`), flags)
}

const sortTag = (a,b) => {
  const [k1,v1] = a.split(':');
  const [k2,v2] = b.split(':');
  a = v1 || k1;
  b = v2 || k2;
  if (a<b) return -1;
  if (a>b) return 1;
  return 0;
}

function noTagInRule(path, method=true) {
  const arr = path.match(rmethod) // feat: tags in url
  if (!arr) {
    return path
  } else if (method && arr[1]) {
    return `${arr[1]}:${arr[3]}`
  }
  return arr[3]
}

function isRuleOff(tags, ns, path) {
  const secs = tags.__tag3[ns][path]
  const tag1 = tags.__tag1[ns]
  if (secs) {
    let id1 = []
    let id2 = false
    for (const sec in secs) {
      const node = secs[sec]
      if (node.tag1.length) {
        let skip = true //# __tag2_TO_tag1_RULES
        for (const tag of node.tag1) { //feat: tag3 depend to tag1
          const tg = tag.replace(/^!/,'')
          if (tag[0]==='!' && tag1[tg]!==undefined) {
            if (!tag1[tg]) {
              skip = false
              break
            }
          } else if (tag1[tg]) {
            skip = false
            break
          }
        }
        if (skip) {
          continue //feat: tag3 depend to tag1
        }  
      }
      const tags = node.tags // feat: update __tag3
      for (const tag in tags) {
        if (tags[tag]) {
          id1.push(sec)
          break
        }
      }
    }
    if (id1.length===0) {
      return true
    }
  }
  return false
}

function tagsIn__tag3(tags, ns, path, sec) {
  const secs = tags.__tag3[ns][path]
  let arr = []
  if (secs) {
    const _sec = sec.split(':')[0]
    const tags = secs[_sec]
    if (tags) {
      arr = Object.keys(tags).map(x=>x.split(':').pop())
    }
  }
  return arr
}

function resetRule2(tags, item, ns, tagx) {
  const typ1 = item.split(':')[1] || item;
  const [ group1, id1 ] = typ1.split('~');
  const namespace2 = tags.__tag2[ns];
  const { state } = namespace2[item]; // feat: update __tag2
  if (id1) {
    for (let itm in namespace2) {
      const typ2 = itm.split(':')[1] || itm;
      const [group2, id2] = typ2.split('~');
      if (group1===group2) {
        if (id2===undefined) {
          namespace2[itm].state = state; // feat: update __tag2
        } else if (id1!==id2) {
          namespace2[itm].state = false; // feat: update __tag2
        }
      }
    }
  }
}

function resetRule3(tags, item, _ns) {
  const { routes } = window.mitm;
  const {__tag1,__tag2,__tag3} = tags;
  const t1 = item.split('url:').pop();
  const typ1 = item.split(':')[1] || item;
  const [group1, id1] = typ1.split('~');

  let tag1 = !_ns

  function update(ns) {
    const namespace2 = __tag2[ns];
    const urls = __tag3[ns];

    let flag
    if (tag1) {
      flag = __tag1[ns]
      if (flag===undefined) {
        flag = false
      } else {
        flag = flag[t1]
      }
    } else {
      flag = namespace2[item].state
    }

    for (let url in urls) {
      const typs = urls[url];
      for (let typ in typs) {
        const tags = typs[typ].tags; // feat: update __tag3
        for (let tag in tags) {
          if (item===tag) {
            tags[tag] = flag;
          }
          const id = tag.split('url:').pop()
          const [group2, id2] = id.split('~')

          if (group1===group2) {
            if (tag1) {
              tags[tag] =  __tag1[ns][id] || false;
            } else {
              if (id2===undefined) {
                tags[tag] = namespace2[item].state
              } else if (id1!==id2) {
                tags[tag] = false;
              }
            }
          }
        }
      }
    }  
  }
  if (_ns) {
    update(_ns)
  } else {
    const nss =  tags.__tag2
    for (let ns in nss) {
      if (oneSite(tags, ns)) {
        ns = routes[ns]._childns._subns || ns // feat: chg to child namespace
        update(ns)
      }
    }
  }
}

function uniq(value, index, self) {
  return self.indexOf(value) === index;
}

function oneSite(tags, ns) {
  const {toRegex} = window.mitm.fn;
  const {list, route, filterUrl} = tags
  if (ns.match('@')) {
    return false
  } else if (list && route) {
    return route===ns
  } else if (filterUrl) {
    const {activeUrl} = mitm.browser
    const rgx = toRegex(ns.replace(/~/g,'[^.]*'))
    const {origin} = activeUrl ? new URL(activeUrl) : {origin: ''}
    return origin.match(rgx) || ns==='_global_'
  } else {
    return true
  }
}

const {fn} = window.mitm
fn.tmethod      = tmethod;
fn.rmethod      = rmethod;
fn.rclass       = rclass;
fn.machMethod   = machMethod
fn.removeMethod = removeMethod
fn.tagsIn__tag3 = tagsIn__tag3
fn.noTagInRule  = noTagInRule
fn.resetRule2   = resetRule2
fn.resetRule3   = resetRule3
fn.isRuleOff    = isRuleOff
fn.sortTag      = sortTag
fn.oneSite      = oneSite
fn.toRegex      = toRegex
fn.uniq         = uniq
window.mitm.monaco  = {};
window.mitm.editor  = {};
window.mitm.browser = {
  broadcast_events: {},
  chgUrl_events: {},
  activeUrl: '',
  page: {}
}

fn.broadcastEvent = function broadcastEvent () {
  console.log(`%cMitm: Broadcast Event: `, _c)
  const { browser } = window.mitm
  for (const e in browser.broadcast_events) {
    browser.broadcast_events[e]()
  }
}

function chgUrl (url) {
  if (!url) {
    return
  }
  console.log(`%cMitm: Chg url: ${url}`, _c)
  const { browser } = window.mitm
  browser.activeUrl = url
  for (const e in browser.chgUrl_events) {
    browser.chgUrl_events[e]()
  }
}

function getUrl () {
  chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT },
    function (tabs) {
      const url = tabs[0].url
      chgUrl(url)
    }
  )
};

let debounce
let firstRunTabsOnUpdated = 1
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (firstRunTabsOnUpdated) {
    console.log('%cMitm: first run chrome.tabs.onUpdated', _c)
    firstRunTabsOnUpdated = 0
  }
  if (!tab.active) {
    return
  }

  const { browser } = window.mitm
  browser.page = {
    ...browser.page,
    ...changeInfo,
    ...tab
  }

  if (changeInfo.status === 'loading') {
    browser.page.title = ''
  } else if (browser.page.status === 'complete' && browser.page.title) {
    if (debounce) {
      clearTimeout(debounce)
      debounce = undefined
    }
    debounce = setTimeout(() => {
      debounce = undefined
      chgUrl(tab.url)
    }, 1000)
  }
})

let firstRunTabsOnActivated = 1
chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (firstRunTabsOnActivated) {
    console.log('first run chrome.tabs.onActivated')
    firstRunTabsOnActivated = 0
  }
  getUrl()
})

const app = new App({ target: document.body })
console.log('%cMitm: Start plugin', _c)
getUrl()

export default app
