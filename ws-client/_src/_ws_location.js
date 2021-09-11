/* global location, history, chrome, Event, CssSelectorGenerator */
/* eslint-disable camelcase */
const _ws_namespace = require('./_ws_namespace')
const _ws_vendor = require('./_ws_vendor')
const _key = require('./_keyboard')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const _c = 'color: #bada55'

module.exports = () => {
  const styleLeft  = 'top:  1px; left:  3px;'
  const styleTopR  = 'top: -4px; right: 3px;'
  const styleRight = 'top: 16px; right: 3px; text-align: end;'
  const buttonStyle= ''
  const style = `
  .mitm-container {
    position: fixed;
    z-index: 99999;
  }
  .mitm-container.center {
    background: #dceaffb0;
    position: fixed;
    /* center the element */
    right: 0;
    left: 0;
    top: 20px;
    margin-right: auto;
    margin-left: auto;
    /* give it dimensions */
    min-height: 10em;
    width: 90%;
    display: none;
  }
  .mitm-btn {
    color: black;
    border: none;
    font-size: 8px;
    cursor: pointer;
    padding: 1px 6px;
    border-radius: 3px;
    font-family: monaco, Consolas, "Lucida Console", monospace;
  }
  .mitm-btn:hover{
    text-decoration:underline;
  }
  .bgroup-left button,
  .bgroup-right button {
    display:table;
    margin-top: 4px;
  }`
  const event = new Event('urlchanged')
  let container = {
    right: {},
    topr: {},
    left: {},
    svlt: {},
  }
  let button = {}
  let bgroup = {
    right: {},
    topr: {},
    left: {},
  }
  let intervId
  let observerfn = []

  function toRegex (pathMsg) {
    let [path, msg] = pathMsg.split('=>').map(item => item.trim())
    path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?')
    return { path, msg }
  }

  function createButton(buttons, pos) {
    let br
    for (const id in buttons) {
      const [caption, color, klas] = id.split('|')
      const btn = document.createElement('button')
      const fn  = buttons[id]
      btn.onclick = async e => {
        let arr = fn(e)
        if (arr instanceof Promise) {
          arr = await arr
        }
        if (Array.isArray(arr)) {
          await play(arr)
        }
      }
      btn.innerText = caption
      btn.classList.add('mitm-btn')
      btn.classList.add(`${pos}`)
      btn.classList.add(klas || caption)
      btn.style = buttonStyle + (color ? `background: ${color};` : '')
      if (pos==='topr') {
        br = document.createElement('span')
        br.innerHTML = '&nbsp;'
        bgroup[pos].appendChild(br)
      }
      bgroup[pos].appendChild(btn)
    }
  }

  function setButtons (buttons, position) {
    if (bgroup[position]) {
      bgroup[position].innerHTML = ''
      createButton(buttons, position)
    }
  }

  let debunk
  let onces = {} // feat: onetime fn call
  async function urlChange (event) {
    const namespace = _ws_namespace()
    if (window.mitm.autofill) {
      delete window.mitm.autofill
    }
    if (window.mitm.autointerval) {
      clearInterval(intervId)
      delete window.mitm.autointerval
    }
    if (window.mitm.autobuttons) {
      delete window.mitm.autobuttons
    }
    if (window.mitm.rightbuttons) {
      delete window.mitm.rightbuttons
    }
    if (window.mitm.leftbuttons) {
      delete window.mitm.leftbuttons
    }
    if (window.mitm.macrokeys) {
      delete window.mitm.macrokeys
    }
    if (namespace) {
      const {href, origin} = location
      const _href = href.replace(origin, '')
      const {_macros_, macros} = window.mitm
      observerfn = []
      _macros_ && _macros_()
      for (const key in macros) {
        const { path, msg } = toRegex(key)
        if (_href.match(path)) {
          button.innerHTML = msg || 'Entry'
          let fns = macros[key]()
          if (fns instanceof Promise) {
            fns = await fns
          }
          if (typeof fns === 'function') {
            observerfn.push(fns)
          } else if (Array.isArray(fns)) {
            for (const fn2 of fns) {
              if (typeof fn2 === 'function') {
                observerfn.push(fn2)
              }
            }
          }
          debunk && clearTimeout(debunk)
          debunk = setTimeout(() => {
            onces = {} // feat: onetime fn call
            debunk = undefined
            const {autobuttons, rightbuttons, leftbuttons} = window.mitm
            rightbuttons && setButtons(rightbuttons, 'right')
            leftbuttons && setButtons(leftbuttons, 'left')
            if (window.mitm.autofill) {
              autobuttons && setButtons({
                ...autobuttons,
                'Entry'() {
                  let {autofill} = window.mitm
                  if (typeof autofill === 'function') {
                    autofill = autofill()
                  }
                  play(autofill)
                }
              }, 'topr')
            } else {
              autobuttons && setButtons(autobuttons, 'topr')
            }
          }, 0)
        }
      }
    }
    container.right.style = styleRight
    container.topr.style  = styleTopR
    container.left.style  = styleLeft
    const visible = (window.mitm.autofill)
    button.style = buttonStyle + (visible ? 'background-color: azure;' : 'display: none;')
    if (typeof (window.mitm.autointerval) === 'function') {
      intervId = setInterval(window.mitm.autointerval, 500)
    }
    ctrl = false
  }

  const vendor = _ws_vendor()
  if (['firefox', 'webkit'].includes(vendor) || (chrome && !chrome.tabs)) {
    document.querySelector('html').addEventListener('keydown', keybCtrl)
    document.querySelector('html').addEventListener('keyup', keybUp)
    window.addEventListener('urlchanged', urlChange)
    if(document.readyState !== 'loading') {
      init();
    } else {
      window.addEventListener('DOMContentLoaded', init)
    }    
  } else {
    return
  }

  const fn = history.pushState
  history.pushState = function () {
    fn.apply(history, arguments)
    compareHref()
  }

  const _play = json => {
    return new Promise(function(resolve, reject) {
      try {
        window.ws__send('autofill', json, resolve)
      } catch (error) {
        reject(error)
      }
    })
  }

  const _post = json => {
    return new Promise(function(resolve, reject) {
      try {
        const config = {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(json)
        }
        fetch('/mitm-play/play.json', config)
        .then(function(response) { resolve(response.json())})
        .then(function(data    ) { resolve(data)           })
      } catch (error) {
        reject(error)
      }
    })
  }

  async function play (autofill) {
    const {__args} = window.mitm
    if (autofill) {
      if (typeof (autofill) === 'function') {
        autofill = autofill()
      }
      const browser = _ws_vendor()
      const lenth = autofill.length
      const _page = window['xplay-page']
      const _frame = window['xplay-frame']
      const _json = {autofill, browser, _page, _frame}
      const msg = lenth === 1 ? `  ${autofill}` : JSON.stringify(autofill, null, 2)
      console.log(`%cMacros: ${msg}`, _c)
      let result
      if ([true, 'off'].includes(__args.nosocket)) {
        result = await _post(_json)
      } else {
        result = await _play(_json)
      }
      return result
    }
  }
  window.mitm.fn.play = play
  window.mitm.fn.wait = wait

  function macroAutomation(macro) {
    if (Array.isArray(macro)) {
      let macroIndex = 0
      const interval = setInterval(() => {
        let selector = macro[macroIndex]
        if (selector.match(/^ *[=-]>/)) {
          const activeElement = CssSelectorGenerator.getCssSelector(document.activeElement)
          selector = `${activeElement} ${selector}`
        }
        play([selector])

        macroIndex += 1
        if (macroIndex >= macro.length) {
          clearInterval(interval)
        }
      }, 100)
    }
  }

  let stdDbl = []
  let hghDbl = []
  let stdCtl = []
  let hghCtl = []
  let stdAlt = []
  let hghAlt = []
  let saveKey = ''
  const kdelay = 1000

  let debounceDbl = undefined
  function macroDbl() {
    const key1 = `key:${stdDbl.join('')}`
    const key2 = `code:${hghDbl.join(':')}`
    const { macrokeys, lastKey: e } = window.mitm

    stdDbl = []
    hghDbl = []
    saveKey = ''
    debounceDbl = undefined
    let macro = macrokeys[key1] || macrokeys[key2]
    console.log(`%cMacros: ctrl + alt  +  ${key1}  |  ${key2}`, _c)
    if (macro) {
      macro = macro(e)
      macroAutomation(macro)
      return true
    }
  }

  let debounceCtl = undefined
  function macroCtl() {
    const key1 = `key:<${stdCtl.join('')}>`
    const key2 = `code:<${hghCtl.join(':')}>`
    const { macrokeys, lastKey: e } = window.mitm

    stdCtl = []
    hghCtl = []
    saveKey = ''
    debounceCtl = undefined
    let macro = macrokeys[key1] || macrokeys[key2]
    console.log(`%cMacros: .... + ctrl + ${key1} | ${key2}`, 'color: #baeaf1')
    if (macro) {
      macro = macro(e)
      macroAutomation(macro)
      return true
    }
  }

  let debounceAlt = undefined
  function macroAlt() {
    const key1 = `key:{${stdAlt.join('')}}`
    const key2 = `code:{${hghAlt.join(':')}}`
    const { macrokeys, lastKey: e } = window.mitm

    stdAlt = []
    hghAlt = []
    saveKey = ''
    debounceAlt = undefined
    let macro = macrokeys[key1] || macrokeys[key2]
    console.log(`%cMacros: .... + alt  + ${key1} | ${key2}`, 'color: #badaf1')
    if (macro) {
      macro = macro(e)
      macroAutomation(macro)
      return true
    }
  }

  function keybUp (e) {
    if (!e.altKey) {
      if (debounceDbl || (debounceCtl && !e.ctrlKey) || debounceAlt) {
        clearTimeout(debounceDbl)
        clearTimeout(debounceCtl)
        clearTimeout(debounceAlt)
        if (debounceDbl) {
          macroDbl()
        } else 
        if (debounceCtl) {
          macroCtl()
        } else {
          macroAlt()
        }
        debounceDbl = undefined
        debounceCtl = undefined
        debounceAlt = undefined
      }
    }
  }
  var ctrl = false
  var svlt = false
  function keybCtrl (e) {
    if (!e.code || ['Alt', 'Control', 'Meta'].includes(e.key)) {
      return
    } else {
      const { macrokeys } = window.mitm
      if (e.key === 'Shift') {
        if (e.ctrlKey) {
          if (e.code==='ShiftRight') {
            ctrl = !ctrl
            container.right.style = styleRight + (!ctrl ? '' : 'display: none;')
            container.topr.style  = styleTopR + (!ctrl ? '' : 'display: none;')
            container.left.style  = styleLeft + (!ctrl ? '' : 'display: none;')  
          } else {
            svlt = !svlt
            container.svlt.style  = (!svlt ? '' : 'display: block;')  
          }
        }
      } else {
        let char = _key(e)
        if (e.ctrlKey && e.altKey) {
          if (e.shiftKey) {
            char = _key(e, {codeOnly: true})
            clearTimeout(debounceDbl)
            clearTimeout(debounceCtl)
            clearTimeout(debounceAlt)
            saveKey += char
            return
          } 
          stdDbl.push(char)
          hghDbl.push(e.code)
          clearTimeout(debounceDbl)
          debounceDbl = setTimeout(macroDbl, kdelay)
        } else if (e.ctrlKey) {
          stdCtl.push(char)
          hghCtl.push(e.code)
          clearTimeout(debounceCtl)
          debounceCtl = setTimeout(macroCtl, kdelay)
        } else if (e.altKey) {
          stdAlt.push(char)
          hghAlt.push(e.code)
          clearTimeout(debounceAlt)
          debounceAlt = setTimeout(macroAlt, kdelay)
        }
        e._keys = saveKey
        mitm.lastKey = e        
      } 
    }
  }

  const {location} = document
  let oldHref = location.href
  let oDebunk = undefined
  function compareHref(nodes) {
    // console.log('$cMacros: DOM mutated!', _c)
    if (oldHref != location.href) {
      window.dispatchEvent(event)
      oldHref = location.href
    } else {
      if (observerfn.length) {
        oDebunk && clearTimeout(oDebunk)
        oDebunk = setTimeout(()=> {
          oDebunk = undefined
          for (const fn of observerfn) {
            const name = fn.name
            if (name && name.match(/Once$/)) {
              if (onces[name]) { // feat: onetime fn call
                continue
              } else {
                onces[name] = true
              }
            }
            fn(nodes)
          }
          const {autobuttons, rightbuttons, leftbuttons} = window.mitm
          rightbuttons && setButtons(rightbuttons, 'right')
          leftbuttons && setButtons(leftbuttons, 'left')
          const { autofill } = window.mitm
          if (autofill) {
            autobuttons && setButtons({
              ...autobuttons,
              'Entry'() {play(autofill)}
            }, 'topr')
          } else {
            autobuttons && setButtons(autobuttons, 'topr')
          }

        }, 100)
      }
    }
  }

  function init() {
    const html = document.querySelector('html')
    const htmlref = html.firstElementChild
    const styleBtn = document.createElement('style')
    const divRight = document.createElement('div')
    const divTopR  = document.createElement('div')
    const divLeft  = document.createElement('div')
    const divCenter= document.createElement('div')

    styleBtn.innerHTML = style
    divRight.innerHTML = `<span class="bgroup-right"></span>`
    divTopR.innerHTML  = `<span class="bgroup-topr"></span>`
    divLeft.innerHTML  = `<span class="bgroup-left"></span>`
    divLeft.className  = 'mitm-container left'
    divTopR.className  = 'mitm-container topr'
    divRight.className = 'mitm-container right'
    divCenter.className= 'mitm-container center'
    divRight.style = styleRight
    divTopR.style  = styleTopR
    divLeft.style   = styleLeft

    html.insertBefore(styleBtn, htmlref)
    html.insertBefore(divRight, htmlref)
    html.insertBefore(divTopR, htmlref)
    html.insertBefore(divLeft, htmlref)
    html.insertBefore(divCenter, htmlref)
    setTimeout(() => {
      container.right= divRight
      container.topr = divTopR
      container.left = divLeft
      container.svlt = divCenter
      button.style = `${buttonStyle}background-color: azure;`
      bgroup.right = divRight.children[0]
      bgroup.topr  = divTopR.children[0]
      bgroup.left  = divLeft.children[0]
      urlChange(event)
      observed()
    }, 0)
  }

  const observer = new MutationObserver(compareHref);
  window.observer = observer
  function observed() {
    observer.disconnect()
    observer.observe(document.body, {subtree: true, childList: true})
  }

}
