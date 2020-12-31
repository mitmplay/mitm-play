const c = require('ansi-colors')

async function log(msg) {
  const bypass = !msg.match(' frame')
  const { argv, __flag } = global.mitm
  if (bypass || (argv.debug || __flag['page-load'])) {
    console.log(c.red(`(*${msg}*)`))
  }
}

function grey(page, msg) {
  let url = ''
  if (typeof page.url==='function') {
    url = page.url()
  }
  if (url) { //&& url!=='about:blank'
    let msg2 = ''
    const { origin, pathname } = new URL(url)
    msg2 = origin!=='null' ? `${origin}${pathname}` : `${url}`
    console.log(c.gray(`(*${msg} url: ${msg2}*)`))
  } else {
    let name = '.'
    if (typeof page.name==='function') {
      name = page.name()
    }
    if (name && name.length>30) {
      name = name.substr(0,27) + '...'
    }
    console.log(c.gray(`(*${msg} name ${name}*)`))
  }
}

async function evalPage(page, _page, msg, ifrm=false) {
  const { argv, __flag } = global.mitm
  let name = '.'
  let url = page.url()

  if (ifrm) {
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
  } else {
    if (typeof page.name==='function') {
      name = page.name()
      if (name && name.length>30) {
        name = name.substr(0,27) + '...'
      }  
    }
    msg2 = `name ${name}`  
  }

  if (ifrm && page.isDetached()) {
    if (argv.debug || __flag['page-load']) {
      grey(page, 'detached-1! frame')
    }
  } else if (page) {
    await log(`${msg} ${_page} ${msg1}${msg2}`)
    try {
      await page.waitForNavigation()
      await page.evaluate(pg => window['xplay-page'] = pg, _page)
    } catch (error) {
      const { message } = error
      if (argv.debug || __flag['page-load']) {
        if (message.match('detached!')) {
          grey(page, 'detached-2! frame')
        } else if (message.match('closed!')) {
          grey(page, 'closed! page')
        } else if (message.match('crashed!')) {
          grey(page, 'crashed page')
        } else {
          console.log('IFRAME ERROR', error)
        }
      }
    }
  }
}

module.exports = async function(page) {
  const _page = 'page~' + (new Date()).toISOString().slice(0, 18).replace(/[T:-]/g, '')

  page._page = _page
  global.mitm.__page[_page] = { session: {} }

  await page.setExtraHTTPHeaders({ 'xplay-page': _page })

  page.on('worker', worker => {
    log(`xplay-page worker ${_page}`)
    worker.on('close', worker => log('Worker destroyed: ' + worker.url()))
  })

  page.on('load', async () => {
    await evalPage(page, _page, 'xplay-page load ')
  })

  page.on('frameattached', async (frame) => {
    try {
      await evalPage(frame, _page, 'xplay-page frame', true)
    } catch (error) {
      if (!error.message.match('Execution Context is not available')) {
        console.log('ERROR', error)
      }
    }
  })

  await evalPage(page, _page, 'xplay-page init ')
}
