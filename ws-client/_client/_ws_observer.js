/* global location, MutationObserver */
/* eslint-disable camelcase */
const _screenshot = require('./_screenshot')
const _ws_namespace = require('./_ws_namespace')
const _ws_debounce = require('./_ws_debounce')
const _ws_vendor = require('./_ws_vendor')
const _ws_route = require('./_ws_route')

module.exports = () => {
  if (location.origin.match('chrome-extension')) {
    return
  }
  const host = location.origin.replace('://' ,'~~')
  const sshot = {}
  const nodes = {}

  let route = _ws_route()
  if (route && route.screenshot) {
    const { observer: ob } = route.screenshot
    for (const id in ob) {
      let el = {}
      if (ob[id] === true) {
        el = {
          title: 'notitle',
          insert: true,
          remove: true
        }
      } if (typeof ob[id] !== 'string') {
        el = {
          title: 'nocapture',
          insert: false,
          remove: false
        }
      } else {
        const arr = ob[id].split(':')
        arr[1].split(',').map(e => {
          el[e] = true
        })
        el.title = arr[0]
      }
      sshot[id] = el
      nodes[id] = {
        insert: false,
        remove: true
      }
    }
  }

  let ob
  let fname
  const namespace = _ws_namespace()
  const browser = _ws_vendor()
  const callback = function () {
    if (route && route.screenshot) {
      ob = route.screenshot.observer
    }
    const _page = window['xplay-page']
    for (const id in nodes) {
      const el = document.body.querySelectorAll(id)
      if (el.length) {
        if (!nodes[id].insert) {
          nodes[id].insert = true
          if (nodes[id].remove !== undefined) {
            nodes[id].remove = false
          }
          if (ob && typeof ob[id]==='function') {
            const nod = el[0] || el
            if (nod._ws_count===undefined) {
              nod._ws_count = 0
            }
            nod._ws_count += 1
            if (nod._ws_count<2) {
              ob[id](nod)
            }
          } 
          if (sshot[id].insert) {
            fname = location.pathname.replace(/^\//, '').replace(/\//g, '-')
            fname = `~${fname}-${sshot[id].title}-insert`
            const params = { namespace, _page, host, fname, browser }
            _screenshot(params)
          }
        }
      } else {
        if (!nodes[id].remove) {
          nodes[id].remove = true
          nodes[id].insert = false
          if (sshot[id].remove) {
            fname = location.pathname.replace(/^\//, '').replace(/\//g, '-')
            fname = `~${fname}-${sshot[id].title}-remove`
            const params = { namespace, _page, host, fname, browser }
            _screenshot(params)
          }
        }
      }
    }
  }

  if (route && route.screenshot) {
    const {observer: ob} = route.screenshot
    const options = {
      attributes: ob ? true : false,
      childList: true,
      subtree: true
    }
    document.addEventListener('DOMContentLoaded', () => {
      const observer = new MutationObserver(_ws_debounce(callback, 280))
      observer.observe(document.body, options)
    })
  }
}
