const c = require('ansi-colors')

async function log(msg) {
  const { argv, __flag } = global.mitm
  if (argv.debug || __flag['page-load']) {
    console.log(c.red(`(*${msg}*)`))
  }
}

async function evalPage(page, _page, msg, ifrm=false) {
  let url = page.url()
  await page.waitForTimeout(2000)
  await log(`${msg} ${_page} ${url || page.name()}`)
  if (ifrm && page.isDetached()) {
    if (url && url!=='about:blank') {
      const { origin, pathname } = new URL(url)
      console.log(c.gray(`(*detached iframe ${origin}${pathname}*)`))
    }
  } else if (page) {
    try {
      await page.waitForNavigation()
      await page.evaluate(pg => window['xplay-page'] = pg, _page)
    } catch (error) {
      if (error.message.match('detached!')) {
        if (url) {
          const { origin, pathname } = new URL(url)
          console.log(c.gray(`(*detached iframe url ${origin}${pathname}*)`))
        } else {
          const name = page.name()
          if (name && name.length<30) {
            console.log(c.gray(`(*detached iframe name ${name}*)`))
          }
        }
      } else {
        console.log('IFRAME ERROR', error)
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
