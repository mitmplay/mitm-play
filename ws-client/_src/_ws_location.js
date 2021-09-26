/* global location, history, chrome, Event, CssSelectorGenerator */
/* eslint-disable camelcase */
const {codeToChar:_key} = require('./_keyboard')
const _ws_namespace = require('./_ws_namespace')
const _ws_vendor = require('./_ws_vendor')
const play = require('./_ws_play')
const _c = 'color: #bada55'
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
  background: #fcffdcb0;
  position: fixed;
  /* center the element */
  right: 0;
  left: 0;
  top: 20px;
  margin-right: auto;
  margin-left: auto;
  /* give it dimensions */
  height: calc(100vh - 50px);
  padding: 0 10px;
  overflow: auto;
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

let container = {
  topr: {},
  left: {},
  right: {},
  target: {},
}
let button = {}
let bgroup = {
  right: {},
  topr: {},
  left: {},
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
};

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

function defaultHotKeys() {
  const {mitm: {fn}} = window
  const keys = {
    'code:KeyC'(_e) {
      fn.svelte(mitm.svelte.Cspheader, 'ElectricLavender')
    },
  }
  keys['code:KeyC']._title = 'Show CSP Header'
  mitm.macrokeys = keys
}

let debunk
let intervId
let onces = {} // feat: onetime fn call

async function urlChange (event) {
  const namespace = _ws_namespace()
  const {mitm} = window

  clearInterval(intervId)
  if (mitm.autointerval) {delete mitm.autointerval}
  if (mitm.autofill)     {delete mitm.autofill    }
  if (mitm.autobuttons)  {delete mitm.autobuttons }
  if (mitm.leftbuttons)  {delete mitm.leftbuttons }
  if (mitm.rightbuttons) {delete mitm.rightbuttons}
  if (mitm.macrokeys)    {defaultHotKeys()        }
  if (namespace) {
    const {href, origin} = location
    const _href = href.replace(origin, '')
    observerfn = []
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
        debunk = setTimeout(async () => {
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

const observer = new MutationObserver(compareHref);
window.observer = observer
function observed() {
  observer.disconnect()
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

const _urlChanged = new Event('urlchanged')
function init() {
  const html = document.querySelector('html')
  const htmlref = html.firstElementChild
  const styleBtn = document.createElement('style')
  const divRight = document.createElement('div')
  const divTopR  = document.createElement('div')
  const divLeft  = document.createElement('div')
  const divCenter= document.createElement('div')

  styleBtn.innerHTML = style
  styleBtn.className = 'mitm-class'
  divRight.innerHTML = `<span class="bgroup-right"></span>`
  divTopR.innerHTML  = `<span class="bgroup-topr"></span>`
  divLeft.innerHTML  = `<span class="bgroup-left"></span>`
  divLeft.className  = 'mitm-container left'
  divTopR.className  = 'mitm-container topr'
  divRight.className = 'mitm-container right'
  divCenter.className= 'mitm-container center'
  divRight.style = styleRight
  divTopR.style  = styleTopR
  divLeft.style  = styleLeft

  html.insertBefore(styleBtn, htmlref)
  html.insertBefore(divRight, htmlref)
  html.insertBefore(divTopR, htmlref)
  html.insertBefore(divLeft, htmlref)
  html.insertBefore(divCenter, htmlref)
  const hotkey = new mitm.svelte.Hotkeys({target:divCenter})
  setTimeout(() => {
    container.topr = divTopR
    container.left = divLeft
    container.right= divRight
    container.hotkey = hotkey
    container.target = divCenter
    container.nodekey= divCenter.children[0]
    button.style = `${buttonStyle}background-color: azure;`
    bgroup.right = divRight.children[0]
    bgroup.topr  = divTopR.children[0]
    bgroup.left  = divLeft.children[0]
    urlChange(_urlChanged)
    observed()
    document.addEventListener('click', function(event) {
      if (center && !divCenter.contains(event.target)) {
        divCenter.attributes.removeNamedItem('style')
        center = false
      }
    });
  }, 0)
}

function macroAutomation(macro) {
  if (center) {
    container.target.attributes.removeNamedItem('style')
    center = false
  }
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
var center = false
function keybCtrl (e) {
  if (!e.code || ['Alt', 'Control', 'Meta'].includes(e.key)) {
    return
  } else {
    if (e.key==='Shift') {
      if (e.ctrlKey && !e.altKey) {
        const {nodekey, target, right, topr, left} = container
        if (e.code==='ShiftRight') {
          ctrl = !ctrl
          right.style = styleRight+ (!ctrl ? '' : 'display: none;')
          topr.style  = styleTopR + (!ctrl ? '' : 'display: none;')
          left.style  = styleLeft + (!ctrl ? '' : 'display: none;')  
        } else {
          if (target.children[0]!==nodekey) {
            target.replaceChildren(nodekey)
            target.style = 'display: block;'
            center = true
          } else {
            center = !center
            if (center) {
              target.style = 'display: block;'
            } else {
              target.attributes.removeNamedItem('style')
            }  
          }
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
let observerfn = []

function compareHref(nodes) {
  // console.log(`%cMacros: DOM mutated!`, _c)
  if (oldHref != location.href) {
    window.dispatchEvent(_urlChanged)
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

function wsLocation() {
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
}

const pastel = {
  PostIt:          '#fcffdcb0',
  PastelGreen:     '#77dd77b0',
  PastelBrown:     '#836953b0',
  BabyBlue:        '#89cff0b0',
  PastelTurquoise: '#99c5c4b0',
  BlueGreenPastel: '#9adedbb0',
  PersianPastel:   '#aa9499b0',
  MagicMint:       '#aaf0d1b0',
  LightPastelGreen:'#b2fba5b0',
  PastelPurple:    '#b39eb5b0',
  PastelLilac:     '#bdb0d0b0',
  PastelPea:       '#bee7a5b0',
  LightLime:       '#befd73b0',
  LightPeriwinkle: '#c1c6fcb0',
  PaleMauve:       '#c6a4a4b0',
  LightLightGreen: '#c8ffb0b0',
  PastelViolet:    '#cb99c9b0',
  PastelMint:      '#cef0ccb0',
  PastelGrey:      '#cfcfc4b0',
  PaleBlue:        '#d6fffeb0',
  PastelLavender:  '#d8a1c4b0',
  PastelPink:      '#dea5a4b0',
  PastelSmirk:     '#deece1b0',
  PastelDay:       '#dfd8e1b0',
  PastelParchment: '#e5d9d3b0',
  PastelRoseTan:   '#e9d1bfb0',
  PastelMagenta:   '#f49ac2b0',
  ElectricLavender:'#f4bfffb0',
  PastelYellow:    '#fdfd96b0',
  PastelRed:       '#ff6961b0',
  PastelOrange:    '#ff964fb0',
  AmericanPink:    '#ff9899b0',
  BabyPink:        '#ffb7ceb0',
  BabyPurple:      '#ca9bf7b0',
}

function svelte(Svelt, bg='PostIt') { // feat: svelte related
  const {target} = container
  target.replaceChildren('')
  window.mitm.sapp = new Svelt({target})
  setTimeout(() => {
    const bcolor = pastel[bg]
    target.style = `display: block${bcolor ? ';background:'+bcolor : ''};`
    center = true
  }, 0)
}

window.mitm.fn.macroAutomation = macroAutomation
window.mitm.fn.svelte = svelte
window.mitm.fn.play = play
window.mitm.fn.wait = wait

module.exports = wsLocation
