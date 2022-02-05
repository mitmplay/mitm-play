const { promisify } = require('util')
const cdpSession = require('./cdp-session')
const sleep = promisify(setTimeout)

const {
  lib:{c},
  fn:{logmsg},
} = global.mitm

async function log(msg) {
  const bypass = !msg.match(' frame')
  const { argv, __flag } = global.mitm
  if (bypass || (argv.debug || __flag['page-load'])) {
    if (msg.match('undefined')) {
      const undef = c.red('undefined')
      msg = msg.replace('undefined', undef)
    }
    logmsg(c.gray(`(*${msg}*)`))
  }
}

function pagename(page) {
  let name = ''
  if (typeof page.name==='function') {
    name = page.name()
  }
  if (name && name.length>30) {
    name = name.substr(0,27) + '...'
  }
  return name ? ` name:${name}` : ''
}

function grey(page, msg) {
  let url = ''
  if (typeof page.url==='function') {
    url = page.url()
  }
  if (url) { //&& url!=='about:blank'
    let msg2 = ''
    url = url.length > 97 ? `${url.slice(0, 97)}...` : url
    let { origin, pathname } = new URL(url)
    msg2 = origin!=='null' ? `${origin}${pathname}` : `${url}`
    msg2 = `${msg} url: ${msg2}`.trim()
    logmsg(c.gray(`(*${msg2}${pagename(page)}*)`))
  } else {
    logmsg(c.gray(`(*${msg}${pagename(page)}*)`))
  }
}

async function evalPage(page, _page, msg, _frame='') {
  const { argv, __flag } = global.mitm
  const url = page.url()

  if (url==='about:blank') {
    grey(page, '')
    return
  }

  if (_frame) {
    await page.waitForTimeout(2000)
  }

  let msg1 = ''
  const _pg = global.mitm.__page[_page]
  if (_pg && _pg.session) {
    msg1 = Object.keys(_pg.session).pop()+' '
  }

  let msg2 = ''
  if (url) {
    const { origin, pathname } = new URL(url)
    msg2 = origin!=='null' ? `url: ${origin}${pathname}` : `url: ${url}`
  }
  msg2 += pagename(page)  

  if (_frame && page.isDetached()) {
    if (argv.debug || __flag['page-load']) {
      grey(page, c.strikethrough('frame detached-1'))
    }
  } else if (page) {
    let isclosed;
    try {
      if (typeof page.page==='function') {
        isclosed = page.page().isClosed()
      } else {
        isclosed = page.isClosed()
      }
      if (isclosed) {
        return
      }
      const state = {state: 'attached'}
      await page.waitForSelector('html', state)
      await log(`${msg} ${_page} ${c.blue(msg1)}${_frame ? _frame : ''}${msg2}`)
      if (_frame) {
        await page.evaluate(({_page, _frame}) => {
          window['xplay-page']  = _page
          window['xplay-frame'] = _frame
        }, {_page, _frame})
      } else {
        await page.evaluate(_page => {
          window['xplay-page'] = _page
        }, _page)
      }
    } catch (error) {
      const { message } = error
      if (argv.debug || __flag['page-load']) {
        if (message.match('detached!')) {
          grey(page, c.strikethrough('frame detached-2'))
        } else if (message.match('closed!')) {
          grey(page, c.strikethrough('page: closed.'))
        } else if (message.match('crashed!')) {
          grey(page, c.strikethrough('page: crashed'))
        } else if (message.match('destroyed')) {
          // ignore...
        } else {
          logmsg('PAGE/IFRAME ERROR')
        }
      }
    }
  }
}

const regx = /[.T:-]/g
function ids(prefix, ln=17) {
  return prefix + (new Date()).toISOString().replace(regx, '').slice(0, ln)
}

async function attachCdp(page) {
  if (page._browserContext._initializer.isChromium) {
    if (!page._CDP) {
      cdpSession(page)
      if (global.mitm.argv.cdp) {
        await sleep(300)
      }
    }
  }
}

module.exports = async function(page) {
  const _page = ids('page~')
  const _session = ids('session~', 13)
  const { __flag } = global.mitm

  page._page = _page
  page._session = _session // feat: session stamp
  global.mitm.__page[_page] = {
    session: {},
    iframes: {},
    page
  }

  await attachCdp(page)
  page.on('load', async () => {
    if (page._onload===undefined) {
      page._onload = 0
    } else {
      page._onload += 1
    }
    await attachCdp(page)
    await evalPage(page, _page, 'xplay-page load ')
  })

  page.on('worker', worker => {
    log(`xplay-page worker ${_page}`)
    worker.on('close', worker => log('Worker destroyed: ' + worker.url()))
  })

  page.on('frameattached', async (frame) => {
    try {
      const _frame = ids('frame~')
      global.mitm.__page[_page].iframes[_frame] = frame
      await evalPage(frame, _page, 'xplay-page frame', _frame)
    } catch (error) {
      if (!error.message.match('Execution Context is not available')) {
        logmsg('ERROR', error)
      }
    }
  })

  page.on('framedetached', async (frame) => {
    __flag['frame-load'] && grey(frame, c.strikethrough('frame detached-0'))
  })

  page.on('framenavigated', async (frame) => {
    __flag['frame-load'] && grey(frame, c.strikethrough('frame navigate-0'))
  })

  await page.setExtraHTTPHeaders({ 'xplay-page': _page })
  await evalPage(page, _page, 'xplay-page init ')
}
