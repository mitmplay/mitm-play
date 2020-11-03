/* global location, history, chrome, Event, CssSelectorGenerator */
/* eslint-disable camelcase */
const _ws_namespace = require('./_ws_namespace')
const _ws_vendor = require('./_ws_vendor')

module.exports = () => {
  const containerStyle = 'position: fixed;z-index: 9999;top: 8px;right: 5px;'
  const buttonStyle = 'border: none;border-radius: 15px;font-size: 10px;'
  const event = new Event('urlchanged')
  let container = {}
  let ctrl = false
  let button = {}
  let buttons
  let intervId

  function toRegex (pathMsg) {
    let [path, msg] = pathMsg.split('=>').map(item => item.trim())
    path = path.replace(/\./g, '\\.').replace(/\?/g, '\\?')
    return { path, msg }
  }

  function setButtons () {
    if (window.mitm.autobuttons) {
      const { autobuttons } = window.mitm
      setTimeout(() => {
        for (const key in autobuttons) {
          const btn = document.createElement('button')
          const br = document.createElement('span')
          const [caption, color] = key.split('|')
          btn.onclick = autobuttons[key]
          btn.innerText = caption
          buttons.appendChild(btn)
          buttons.appendChild(br)
          br.innerHTML = '&nbsp;'
          btn.style = buttonStyle + (color ? `background: ${color};` : '')
        }
      }, 0)
    }
  }

  function urlChange (event) {
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
      buttons.innerHTML = ''
    }
    if (window.mitm.macrokeys) {
      delete window.mitm.macrokeys
    }
    if (namespace) {
      const { pathname } = location
      const { _macros_, macros } = window.mitm
      // console.log(namespace, location);
      for (const key in macros) {
        const { path, msg } = toRegex(key)
        if (pathname.match(path)) {
          button.innerHTML = msg || 'Autofill'
          _macros_ && _macros_()
          macros[key]()
          setButtons()
        }
      }
    }
    container.style = containerStyle
    const visible = (window.mitm.autofill)
    button.style = buttonStyle + (visible ? 'background-color: azure;' : 'display: none;')
    if (typeof (window.mitm.autointerval) === 'function') {
      intervId = setInterval(window.mitm.autointerval, 500)
    }
    ctrl = false
  }

  function play (autofill) {
    if (autofill) {
      if (typeof (autofill) === 'function') {
        autofill = autofill()
      }
      const browser = _ws_vendor()
      const lenth = autofill.length
      const _guid = window.page_guid
      console.log(lenth === 1 ? `  ${autofill}` : JSON.stringify(autofill, null, 2))
      window.ws__send('autofill', { autofill, browser, _guid })
    }
  }

  function btnclick (e) {
    const { autofill } = window.mitm
    play(autofill)
  }

  function keybCtrl (e) {
    const { macrokeys } = window.mitm
    if (e.ctrlKey && e.key === 'Shift') {
      ctrl = !ctrl
      container.style = containerStyle + (!ctrl ? '' : 'display: none;')
    } else if (e.ctrlKey && e.altKey) {
      console.log({ macro: `ctrl + alt + ${e.code}` })
      if (macrokeys) {
        let macro = macrokeys[e.code]
        if (macro) {
          macro = macro()
          if (Array.isArray(macro)) {
            let macroIndex = 0
            const interval = setInterval(() => {
              let selector = macro[macroIndex]
              if (selector.match(/^ *[=-]>/)) {
                selector = `${CssSelectorGenerator.getCssSelector(document.activeElement)} ${selector}`
              }
              play([selector])

              macroIndex += 1
              if (macroIndex >= macro.length) {
                clearInterval(interval)
              }
            }, 100)
          }
        }
      }
    }
  }
  if (!window.chrome) {
    return
  }
  if (!chrome.tabs) {
    document.querySelector('html').addEventListener('keydown', keybCtrl)
    window.addEventListener('urlchanged', urlChange)
    const fn = history.pushState
    history.pushState = function () {
      fn.apply(history, arguments)
      window.dispatchEvent(event)
    }

    window.addEventListener('DOMContentLoaded', () => {
      const node = document.querySelector('html')
      const noderef = node.firstElementChild
      const newNode = document.createElement('div')
      const html = '<button class="btn-autofill">Autofill</button>'

      newNode.innerHTML = `<span class="autofill-buttons"></span>${html}`
      newNode.className = 'mitm autofill-container'
      newNode.style = containerStyle

      node.insertBefore(newNode, noderef)
      setTimeout(() => {
        container = newNode
        buttons = newNode.children[0]
        button = newNode.children[1]
        button.onclick = btnclick
        button.style = `${buttonStyle}background-color: azure;`
        urlChange(event)
      }, 1)
    })
  }
}
