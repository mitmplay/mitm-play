/* global location, history, chrome, Event, CssSelectorGenerator */
/* eslint-disable camelcase */
const {codeToChar:_key} = require('../_keyboard')
const _ws_namespace = require('../_ws_namespace')
const _ws_vendor = require('../_ws_vendor')
const play = require('../_ws_play')
const style = require('./css')

const bgroup = {
  right: {},
  topr: {},
  left: {},
}

const setButtons = require('./buttons')(bgroup)
const defaultHotKeys = require('./hotkeys')

let container = {
  topr: {},
  left: {},
  right: {},
  target: {},
}
let button = {}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function toRegex (pathMsg) {
  let [path, msg] = pathMsg.split('=>').map(item => item.trim())
  path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?')
  return { path, msg }
}

let debunk
let intervId
let onces = {} // feat: onetime fn call

async function urlChange (event) {
  const namespace = _ws_namespace()
  const {mitm} = window
  const {fn}   = mitm
  
  if (mitm.argv.a11y && fn.axerun) {
    fn.axerun()
  }

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
    let none = true
    for (const key in mitm.macros) {
      const { path, msg } = toRegex(key)
      if (_href.match(path)) {
        none = false
        button.innerHTML = msg || 'Entry'
        let fns = mitm.macros[key]()
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
          const {
            autobuttons,
            rightbuttons,
            leftbuttons,
            left2buttons
          } = window.mitm
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
            autobuttons && setButtons(autobuttons, 'topr' )
          }
          rightbuttons && setButtons(rightbuttons, 'right')
          left2buttons && setButtons(left2buttons, 'left2')
          leftbuttons  && setButtons(leftbuttons , 'left' )
        }, 0)
      }
    }
    if (none) {
      setButtons({}, 'right')
      setButtons({}, 'left')
      setButtons({}, 'topr')
      const {left2buttons} = window.mitm
      left2buttons && setButtons(left2buttons, 'left2')
    }
  } else {
    setButtons({}, 'right')
    setButtons({}, 'left')
    setButtons({}, 'topr')
    const {left2buttons} = window.mitm
    left2buttons && setButtons(left2buttons, 'left2')
  }
  container.right.style = ''
  container.topr.style  = ''
  container.left.style  = ''
  const visible = (window.mitm.autofill)
  button.style =  visible ? 'background-color: azure;' : 'display: none;'
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
  const body     = document.body
  const divx     = document.createElement('div'  )
  const divRight = document.createElement('div'  )
  const divTopR  = document.createElement('div'  )
  const divLeft  = document.createElement('div'  )
  const divPopup = document.createElement('div'  )
  const divCenter= document.createElement('div'  )
  const html     = document.querySelector('html' )
  const styleBtn = document.createElement('style')
  const htmlref  = html.firstElementChild
  const divxref  = divx.firstElementChild
  const bodyref  = body.firstElementChild
  divRight.style = ''
  divTopR .style = ''
  divLeft .style = ''

  styleBtn .innerHTML = style
  styleBtn .className = 'mitm-class'
  divRight .innerHTML = `<span class="bgroup-right"></span>`
  divTopR  .innerHTML = `<span class="bgroup-topr"></span>`
  divLeft  .innerHTML = `<span class="bgroup-left"></span><span class="bgroup-left2"></span>`
  divx     .className = 'mitm-app'
  divLeft  .className = 'mitm-container left'
  divTopR  .className = 'mitm-container topr'
  divRight .className = 'mitm-container right'
  divPopup .className = 'mitm-container popup'
  divCenter.className = 'mitm-container center'
  html.insertBefore(divx     , htmlref)
  html.insertBefore(styleBtn , htmlref)
  divx.insertBefore(divRight , divxref)
  divx.insertBefore(divTopR  , divxref)
  divx.insertBefore(divLeft  , divxref)
  divx.insertBefore(divCenter, divxref)
  body.insertBefore(divPopup , bodyref)
  // body.appendChild (divPopup)
  const hotkey = new mitm.svelte.Hotkeys({target:divCenter})
  setTimeout(() => {
    container.topr = divTopR
    container.left = divLeft
    container.right= divRight
    container.hotkey = hotkey
    container.popup  = divPopup
    container.target = divCenter
    container.nodekey= divCenter.children[0]
    button.style = `background-color: azure;`
    bgroup.right = divRight.children[0]
    bgroup.topr  = divTopR .children[0]
    bgroup.left  = divLeft .children[0]
    bgroup.left2 = divLeft .children[1]
    urlChange(_urlChanged)
    observed()
    document.addEventListener('click', function(event) {
      const el = event.target
      if (center && !divCenter.contains(el)) {
        divCenter.attributes.removeNamedItem('style')
        center = false
      } else{
        const a11yPopup = document.querySelector('.a11y-popup')
        if (a11yPopup && !el.closest('.a11y-popup')) {
          const {elNode={}} = mitm.axerun
          elNode.node = undefined
          a11yPopup.remove()
        }
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
  console.log(`%cMacros: ctrl + alt  +  ${key1}  |  ${key2}`, 'color: #bada55')
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
          right.style = !ctrl ? '' : 'display: none;'
          topr.style  = !ctrl ? '' : 'display: none;'
          left.style  = !ctrl ? '' : 'display: none;'
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
  // console.log(`%cMacros: DOM mutated!`, 'color: #bada55')
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
  PostIt:          '#fcffdcd6',
  PastelGreen:     '#77dd77d6',
  PastelBrown:     '#836953d6',
  BabyBlue:        '#89cff0d6',
  PastelTurquoise: '#99c5c4d6',
  BlueGreenPastel: '#9adedbd6',
  PersianPastel:   '#aa9499d6',
  MagicMint:       '#aaf0d1d6',
  LightPastelGreen:'#b2fba5d6',
  PastelPurple:    '#b39eb5d6',
  PastelLilac:     '#bdb0d0d6',
  PastelPea:       '#bee7a5d6',
  LightLime:       '#befd73d6',
  LightPeriwinkle: '#c1c6fcd6',
  PaleMauve:       '#c6a4a4d6',
  LightLightGreen: '#c8ffb0d6',
  PastelViolet:    '#cb99c9d6',
  PastelMint:      '#cef0ccd6',
  PastelGrey:      '#cfcfc4d6',
  PaleBlue:        '#d6fffed6',
  PastelLavender:  '#d8a1c4d6',
  PastelPink:      '#dea5a4d6',
  PastelSmirk:     '#deece1d6',
  PastelDay:       '#dfd8e1d6',
  PastelParchment: '#e5d9d3d6',
  PastelRoseTan:   '#e9d1bfd6',
  PastelMagenta:   '#f49ac2d6',
  ElectricLavender:'#f4bfffd6',
  PastelYellow:    '#fdfd96d6',
  PastelRed:       '#ff6961d6',
  PastelOrange:    '#ff964fd6',
  AmericanPink:    '#ff9899d6',
  BabyPink:        '#ffb7ced6',
  BabyPurple:      '#ca9bf7d6',
}

function svelte(Svelt, bg='PostIt') { // feat: svelte related
  const {target, popup} = container
  target.replaceChildren('')
  // popup .replaceChildren('')
  if (typeof(bg)!=='string' && bg.popup) {
    const props = {node: bg.node}
    window.mitm.sapp = new Svelt({target: popup, props})
  } else {
    window.mitm.sapp = new Svelt({target})
    setTimeout(() => {
      const bcolor = pastel[bg]
      target.style = `display: block${bcolor ? ';background:'+bcolor : ''};`
      center = true
    }, 0)  
  }
}

function hotKeys(obj) {
  window.mitm.macrokeys = {
    ...window.mitm.macrokeys,
    ...obj
  }
}

window.mitm.fn.macroAutomation = macroAutomation
window.mitm.fn.hotKeys = hotKeys
window.mitm.fn.svelte = svelte
window.mitm.fn.play = play
window.mitm.fn.wait = wait

module.exports = wsLocation
