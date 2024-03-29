const _ws_vendor = require('../_ws_vendor')
const _c = 'color: #bada55'

function _post(json) {
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

function _play(json) {
  return new Promise(function(resolve, reject) {
    try {
      window.ws__send('autofill', json, resolve)
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

function sqlite() {
  const [cmd, q, tbl] = arguments
  return new Promise(function(resolve, reject) {
    try {
      const data = {q}
      if (tbl) {
        data.tbl = tbl
      }
      window.ws__send(cmd, data, resolve)
    } catch (error) {
      reject(error)
    }
  })
}

window.mitm.fn.sqlList = (q, tbl) => sqlite('sqlList', q, tbl)
window.mitm.fn.sqlDel  = (q, tbl) => sqlite('sqlDel' , q, tbl)
window.mitm.fn.sqlIns  = (q, tbl) => sqlite('sqlIns' , q, tbl)
window.mitm.fn.sqlUpd  = (q, tbl) => sqlite('sqlUpd' , q, tbl)

module.exports = play
