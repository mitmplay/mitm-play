/* global chrome */
import App from './App.svelte'

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

function isRuleOff(tags, ns, url) {
  const node = tags.__tag3[ns][url]
  let grey = false
  if (node) {
    for (const id in node) {
      if (typeof node[id]!=='string') {
        for (const tag in node[id]) {
          if (node[id][tag]===false) {
            grey = true
            break
          }
        }
      }
    }
  }
  return grey
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
      if (!(tagx && tagx[item])) {
        if (group1===group2 && id1!==id2) {
          namespace[itm] = !flag;
        }
      }
    }
  }
}

function resetRule3(tags, _item, _ns) {
  const {__tag1,__tag2,__tag3} = tags;
  let tg1 = !_ns

  function update(ns, item) {
    // if (ns==='keybr.com')
    //   debugger

    const typ1 = item.split(':')[1] || item;
    const [ group1 ] = typ1.split('~');
    const namespace = __tag2[ns];
    const urls = __tag3[ns];
    for (let url in urls) {
      const typs = urls[url];
      for (let typ in typs) {
        const namespace3 = typs[typ];
        for (let itm in namespace3) {
          const id = itm.split('url:').pop()
          const t1 = item.split('url:').pop()
          let flag = tg1 ? __tag1[t1] : namespace[item]
          if (item===itm) {
            namespace3[itm] = flag;
          }
          if (group1===id.split('~')[0]) {
            if (tg1) {
              namespace3[itm] =  __tag1[id] || false;
            } else {
              namespace3[itm] = namespace[itm] || false;
            }
          }
        }
      }
    }  
  }

  if (_ns) {
    update(_ns, _item)
  } else {
    const nss =  tags.__tag2
    for (let ns in nss) {
      update(ns, _item)
    }
  }
}

window.mitm.fn.resetRule2 = resetRule2
window.mitm.fn.resetRule3 = resetRule3
window.mitm.fn.isRuleOff = isRuleOff
window.mitm.fn.toRegex = toRegex
window.mitm.fn.sortTag = sortTag
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
