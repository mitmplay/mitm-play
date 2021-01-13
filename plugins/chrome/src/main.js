/* global chrome */
import App from './App.svelte'
const rmethod = /^(GET|PUT|POST|DELETE|)#?\d*!?:([\w.#~-]+:|)(.+)/ // feat: tags in url
const rclass = /[.#~/]/g

console.log('Load MITM plugin')

function toRegex (str, flags = '') {
  return new RegExp(str
    .replace(/\//g, '\\/')
    .replace(/\./g, '\\.')
    .replace(/\?/g, '\\?'), flags)
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
function noTagInRule(path) {
  const arr = path.match(rmethod) // feat: tags in url
  return arr ? (arr[1] ? `${arr[1]}:${arr[3]}` : arr[3]) : path
}
function isRuleOff(tags, ns, path) {
  const node = tags.__tag3[ns][path]
  if (node) {
    let id1 = []
    let id2 = false
    for (const id in node) {
      if (typeof node[id]!=='string') {
        for (const tag in node[id]) {
          if (node[id][tag]) {
            id1.push(id)
          } else if (node[id][tag]===false) {
            id2 = id
            break
          }
        }
      }
    }
    // feat: rule off if URL in the same section
    if ((id1.length===0 && id2) || id1.indexOf(id2)>-1) {
      return true
    }
  }
  return false
}
function tagsIn__tag3(tags, ns, path, sec) {
  const secs = tags.__tag3[ns][path]
  let arr = []
  if (secs) {
    arr = Object.keys(secs[sec.split(':')[0]])
    arr = arr.map(x=>x.split(':').pop())
  }
  return arr
}
function resetRule2(tags, item, ns, tagx) {
  const typ1 = item.split(':')[1] || item;
  const [ group1, id1 ] = typ1.split('~');
  const namespace = tags.__tag2[ns];
  const flag = namespace[item];
  if (id1) {
    for (let itm in namespace) {
      const typ2 = itm.split(':')[1] || itm;
      const [group2, id2] = typ2.split('~');
      if (group1===group2) {
        if (id2===undefined) {
          namespace[itm] = namespace[item]
        } else if (id1!==id2) {
          namespace[itm] = false;
        }
      }
    }
  }
}

function resetRule3(tags, item, _ns) {
  const {__tag1,__tag2,__tag3} = tags;
  const t1 = item.split('url:').pop();
  const typ1 = item.split(':')[1] || item;
  const [group1, id1] = typ1.split('~');

  let tag1 = !_ns

  function update(ns) {
    const namespace = __tag2[ns];
    const urls = __tag3[ns];

    let flag
    if (tag1) {
      flag = __tag1[t1]
    } else {
      flag = namespace[item]
    }

    for (let url in urls) {
      const typs = urls[url];
      for (let typ in typs) {
        const namespace3 = typs[typ];
        for (let itm in namespace3) {
          if (item===itm) {
            namespace3[itm] = flag;
          }
          const id = itm.split('url:').pop()
          const [group2, id2] = id.split('~')

          if (group1===group2) {
            if (tag1) {
              namespace3[itm] =  __tag1[id] || false;
            } else {
              if (id2===undefined) {
                namespace3[itm] = namespace[item]
              } else if (id1!==id2) {
                namespace3[itm] = false;
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
      update(ns)
    }
  }
}
function uniq(value, index, self) {
  return self.indexOf(value) === index;
}
window.mitm.fn.rclass = rclass;
window.mitm.fn.rmethod = rmethod;
window.mitm.fn.tagsIn__tag3 = tagsIn__tag3
window.mitm.fn.noTagInRule = noTagInRule
window.mitm.fn.resetRule2 = resetRule2
window.mitm.fn.resetRule3 = resetRule3
window.mitm.fn.isRuleOff = isRuleOff
window.mitm.fn.toRegex = toRegex
window.mitm.fn.sortTag = sortTag
window.mitm.fn.uniq = uniq
window.mitm.editor = {};
window.mitm.browser = {
  chgUrl_events: {},
  activeUrl: '',
  page: {}
}

function chgUrl (url) {
  if (!url) {
    return
  }
  console.log('Chg url:', url)
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
    console.log('first run chrome.tabs.onUpdated')
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
      // console.log('Tab Update!!!', tab.url);
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
  // console.log('Tab Change!!!', activeInfo);
  getUrl()
})

const app = new App({ target: document.body })
console.log('Start plugin')
getUrl()

export default app

// let inprocess = false;
// const replay = ()=>{
//   setTimeout(() => {
//     inprocess = false;
//   },500);
// }
// function reportWindowSize() {
//   if (!inprocess) {
//     inprocess = true;
//     const {innerWidth, innerHeight: height, ws__send} = window;
//     chrome.windows.get(-2, {}, data => {
//       const {width:_w} = data;
//       const width = _w - innerWidth;
//       console.log({width, height, _w});
//       ws__send('setViewport', {width, height, _w}, replay);
//     })
//   }
// }
// window.addEventListener("resize", reportWindowSize);
// window.addEventListener('message', event => {
//   console.log({event});
// });
