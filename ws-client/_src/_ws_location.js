/* global location, history, chrome, Event, CssSelectorGenerator */
/* eslint-disable camelcase */
const _ws_namespace = require('./_ws_namespace')
const _ws_vendor = require('./_ws_vendor')

module.exports = () => {
  const containerStyle1 = 'position: fixed;z-index: 9999;right: 3px;'
  const containerStyle2 = 'position: fixed;z-index: 9999;left:  3px;'
  const containerStyle3 = 'position: fixed;z-index: 9999;right: 3px; top: 20px; text-align: end;'
  const buttonStyle = 'border: none;border-radius: 15px;font-size: 10px;cursor: pointer;'
  const event = new Event('urlchanged')
  let container = {
    right3: {},
    right: {},
    left: {},
  }
  let ctrl = false
  let button = {}
  let bgroup = {
    right3: {},
    right: {},
    left: {},
  }
  let intervId

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
      const ev  = buttons[id]
      btn.onclick = e => {
        const arr = ev(e)
        Array.isArray(arr) && play(arr)
      }
      btn.innerText = caption
      btn.classList.add('mitm-btn')
      btn.classList.add(`${pos}`)
      btn.classList.add(klas || caption)
      btn.style = buttonStyle + (color ? `background: ${color};` : '')
      bgroup[pos].appendChild(btn)
      if (pos==='right') {
        br = document.createElement('span')
        br.innerHTML = '&nbsp;'
      } else {
        br = document.createElement('pre')
        br.style = 'margin: 0px;'
      }
      bgroup[pos].appendChild(br)
    }
  }

  function setButtons (buttons, position) {
    if (bgroup[position]) {
      bgroup[position].innerHTML = ''
      createButton(buttons, position)
    }
  }

  let debunk
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
      for (const key in macros) {
        const { path, msg } = toRegex(key)
        if (_href.match(path)) {
          button.innerHTML = msg || 'Autofill'
          _macros_ && _macros_()
          macros[key]()
          if (debunk) {
            clearTimeout(debunk)
            debunk = undefined
          }
          debunk = setTimeout(() => {
            const {autobuttons, rightbuttons, leftbuttons} = window.mitm
            rightbuttons && setButtons(rightbuttons, 'right3')
            autobuttons && setButtons(autobuttons, 'right')
            leftbuttons && setButtons(leftbuttons, 'left')  
          }, 0)
        }
      }
    }
    container.right3.style = containerStyle3
    container.right.style = containerStyle1
    container.left.style  = containerStyle2
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
      const _page = window['xplay-page']
      const _frame = window['xplay-frame']
      console.log(lenth === 1 ? `  ${autofill}` : JSON.stringify(autofill, null, 2))
      window.ws__send('autofill', { autofill, browser, _page, _frame })
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
      container.right3.style = containerStyle3 + (!ctrl ? '' : 'display: none;')
      container.right.style  = containerStyle1 + (!ctrl ? '' : 'display: none;')
      container.left.style   = containerStyle2 + (!ctrl ? '' : 'display: none;')
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
      }
    }
  }
  if (!window.chrome) {
    return
  }
  if (!chrome.tabs) {
    document.querySelector('html').addEventListener('keydown', keybCtrl)
    window.addEventListener('urlchanged', urlChange)

    window.addEventListener('DOMContentLoaded', () => {
      const html = document.querySelector('html')
      const htmlref = html.firstElementChild
      const styleBtnLeft = document.createElement('style')
      const divTopRight3 = document.createElement('div')
      const divTopRight = document.createElement('div')
      const divTopLeft = document.createElement('div')
      const auto = '<button class="btn-autofill">Autofill</button>'

      styleBtnLeft.innerHTML = 'button.mitm-btn:hover{text-decoration:underline;}'
      divTopRight3.innerHTML = `<span class="bgroup-right"></span>`
      divTopRight.innerHTML  = `<span class="bgroup-right"></span>${auto}`
      divTopLeft.innerHTML   = `<span class="bgroup-left"></span>`
      divTopRight.className  = 'mitm autofill-container'
      divTopLeft.className   = 'mitm autofill-container'
      divTopRight3.style = containerStyle3
      divTopRight.style  = containerStyle1
      divTopLeft.style   = containerStyle2

      html.insertBefore(styleBtnLeft, htmlref)
      html.insertBefore(divTopRight3, htmlref)
      html.insertBefore(divTopRight, htmlref)
      html.insertBefore(divTopLeft, htmlref)
      setTimeout(() => {
        container.right3 = divTopRight3
        container.right  = divTopRight
        container.left   = divTopLeft
        button.style  = `${buttonStyle}background-color: azure;`
        bgroup.right3 = divTopRight3.children[0]
        bgroup.right = divTopRight.children[0]
        bgroup.left  = divTopLeft.children[0]
        button = divTopRight.children[1]
        button.onclick = btnclick
        urlChange(event)
        observed()
      }, 0)
    })
  }

  const {location} = document
  let oldHref = location.href

  function compareHref() {
    // console.log('DOM mutated!')
    if (oldHref != location.href) {
      window.dispatchEvent(event)
      oldHref = location.href
    }
  }

  const fn = history.pushState
  history.pushState = function () {
    fn.apply(history, arguments)
    compareHref()
  }

  const observer = new MutationObserver(compareHref);
  function observed() {
    observer.disconnect()
    const body = document.querySelector("body")
    observer.observe(body, {childList: true, subtree: true})
  }
}
