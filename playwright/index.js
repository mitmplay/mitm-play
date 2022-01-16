const playwright = require('playwright')
const _options = require('./options')
const plugins = require('./plugins')
const proxies = require('./proxies')
const cleanX = require('./clean-x')
const attach = require('./attach')
const routes = require('../routes-play')
const browserPath = require('./browser-path')
const currentTab = require('./current-tab')
const preload = require('./preload.js')

const {
  lib:{c},
  fn:{sleep,logmsg},
} = global.mitm

const pages = {}
const browsers = {}
const bcontexts = {}
const browserServer = {}
global.browserServer = browserServer

function initBrowserMsg(browserName, opt) {
  const msg = `Init Browser: [${browserName}]`
  logmsg(c.redBright('='.repeat(msg.length + 2)))
  logmsg(c.yellow(`${msg} ${JSON.stringify(opt, null, 2)}`))
}

function browserProxy() {
  if (global.mitm.argv.proxy === true) {
    logmsg(c.red.bgYellowBright('>>> mitm-play will use --proxy but browser will not!'))
  }
}

module.exports = () => {
  logmsg(c.red('\n[playwright/index.js]'))
  cleanX()

  global.mitm.pages = pages
  global.mitm.browsers = browsers
  global.mitm.bcontexts = bcontexts

  const { argv } = global.mitm
  const args = require('./args-c')(argv);

  async function setup(browserName, options) {
    const device = playwright.devices[argv.device] || {}
    const playBrowser = playwright[browserName]
    let bcontext = bcontexts[browserName]
    let browser = browsers[browserName]
    bcontexts[browserName] = undefined
    browsers[browserName] = undefined
    bcontext && await bcontext.close()
    browser && await browser.close()

    let video = {}
    if (argv.video) {
      video = {
        recordVideo:{
          dir: typeof argv.video==='string' ? argv.video : './video',
          size: {width: argv.devtools ? 1600 : 800, height: 600}
        }
      }  
    }

    let ctxoption = {}
    if (argv.device) {
      if (device) {
        delete options.viewport
        options.deviceScaleFactor = 1
        ctxoption = {
          ...ctxoption,
          ...device,
          ...video,
        }
      }
    }
    if (argv.basic) {
      const [username, password] = argv.basic.split(':')
      ctxoption.httpCredentials = {
        username, password
      }
    }

    let page
    if (argv.incognito===undefined) {
      const { fn: { tilde } } = global.mitm
      const bprofile = `${global.mitm.path.home}/_profiles_/${browserName}`  // browwser profile
      logmsg(c.yellow(`Browser profile ${tilde(bprofile)}`))
      browser = await playBrowser.launchPersistentContext(bprofile, {
        ...video,
        ...device,
        ...options,
        ...ctxoption
      })
      page = await browser.pages()[0]
      bcontext = page.context()
    } else {
      if (argv.device===undefined) {
        ctxoption.viewport = null
      }
      logmsg('>>> Browser option', options)
      if (argv.incognito==='server') {
        const server = await playBrowser.launchServer(options)
        const wsEndpoint = server.wsEndpoint()
        browserServer[browserName] = server
        server.wsEndpoint = wsEndpoint

        logmsg(c.yellow(`Browser wsEndpoint ${wsEndpoint}`))

        browser = await playBrowser.connect({wsEndpoint})
      } else {
        browser = await playBrowser.launch(options)
      }
      // bcontext = await browser.newContext({viewport: { height: 734, width: 800 }});
      bcontext = await browser.newContext(ctxoption)
      page = await bcontext.newPage()
    }
    await bcontext.addInitScript(preload, global.mitm.argv);
    currentTab(browser)
    if (browserName === 'chromium') {
      if (argv.incognito) {
        await page.goto('chrome://extensions/')
        const nodes = await page.$$('#detailsButton')
        for (const node of nodes) {
          await node.click()
          await page.click('#crToggle')
          await page.click('#closeButton')
        }
      }
    } else {
      await sleep(300)
    }
    pages[browserName] = page
    browsers[browserName] = browser
    bcontexts[browserName] = bcontext
    return {page, browser, bcontext}
  }

  async function play(browserName) {
    const {options, logs} = _options()
    initBrowserMsg(browserName, logs)
    if (browserName === 'chromium') {
      plugins(args)
      proxies(args)
      options.ignoreDefaultArgs = [
        // '--origin-trial-disabled-features=SecurePaymentConfirmation',
        '--disable-extensions',
        '--enable-automation'
      ],
      options.viewport = null
      options.args = args
    }
    browserProxy()
    browserPath(browserName, options)
    const {page, browser, bcontext} = await setup(browserName, options)
    logmsg(c.redBright(`MITM Hooked [${browserName}]`))
    bcontext.on('page', attach)
    if (argv.cdp===undefined) {
      await bcontext.route(/.*/, (route, request) => {
        if (!global.mitm.restart) {
          routes({ route, request, browserName, bcontext })
        }
      })  
    }
    let count = 0
    await sleep(300) // feat: if request faster then __args={}
    for (const url of argv.urls) {
      newPage(browser, page, url, count)
      count += 1
    }
    page.on('close', async () => {
      for (const browserName in argv.browser) {
        if (browsers[browserName]) {
          await browsers[browserName].close()
        }
      }
      if (!global.mitm.restart) {
        process.exit()
      }
    })
  }

  (async () => {
    logmsg(c.redBright('START: INIT *PLAYWRIGHT*'))
    for (const browserName in argv.browser) {
      await play(browserName)
    }
    logmsg(c.redBright('END: INIT *PLAYWRIGHT*'))
  })()
  global.mitm.play = play
}

async function goto (page, url) {
  attach(page)
  await page.goto(url)
}

const newPage = async (browser, page, url, count) => {
  if (count > 0) {
    const page = await browser.newPage()
    await goto(page, url)
  } else {
    await goto(page, url)
  }
}
