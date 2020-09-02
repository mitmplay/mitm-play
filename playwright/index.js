const c = require('ansi-colors');
const playwright = require('playwright');
const args = require('./chromium-args');
const _options = require('./options');
const routes = require('../routes');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const pages = {};
const browsers = {};
const bcontexts = {};
module.exports = () => {
  (async () => {
    const {
      argv,
      fn: {home}
    } = global.mitm;
    global.mitm.pages = pages;
    global.mitm.browsers = browsers;
    for (let browserName in argv.browser) {
      const options = _options();
      let page, browser, bcontext;
      
      if (browserName==='chromium') {
        options.excludeSwitches = ['enable-automation'];
        const p = `${global.__app}/plugins`;
        let path = `${process.cwd()}/`;
        if (argv.plugins) {
          path += argv.plugins.replace(/,/g, path);
          path += `${p}/chrome`;
        } else {
          path = `${p}/chrome`;
        }
        if (argv.verbose) {
          console.log('>> Plugins path', path.split(','));
        }
        if (argv.dummy) {
          path += `,${p}/dummy`;
        }
        args.push(`--disable-extensions-except=${path}`);
        args.push( `--load-extension=${path}`);
        if (argv.proxypac) {
          args.push(`--proxy-pac-url=${argv.proxypac}`);
        }
        options.viewport = null,
        options.args = args;
      }
      let execPath = argv.browser[browserName];
      if (typeof(execPath)==='string') {
        options.executablePath = home(execPath);
        if (browserName!=='chromium') {
          console.log(c.redBright('executablePath is unsupported for non Chrome!'))
        }
      } else {
        const _browser = require('playwright')[browserName];
        execPath = _browser.executablePath();
      }
      console.log(c.yellow(`>> executablePath ${execPath}\n`));
      const playBrowser = playwright[browserName];
      if (argv.pristine) {
        // buggy route will not work :(
        const bprofile = `${global.mitm.home}/.${browserName}`;
        console.log('>> Browser profile', bprofile);
        browser = await playBrowser.launchPersistentContext(bprofile, options);
        page = await  browser.pages()[0];
        bcontext = browser;
      } else {
        browser = await playBrowser.launch(options);
        //const context = await browser.newContext({viewport: { height: 734, width: 800 }});
        const context = await browser.newContext({ viewport: null });
        page = await context.newPage();
        bcontext = context;
      }
      if (browserName==='chromium') {
        const cdp = await page.context().newCDPSession(page);
        global.mitm.cdp = cdp;
      }
      bcontexts[browserName] = bcontext;
      browsers[browserName] = browser;
      pages[browserName] = page;
      bcontext.route(/.*/, (route, request) => {
        routes({route, request, bcontext, browserName});
      });
      browser.currentTab = async function() {
        const pages = await browser.pages();
        let active;
        for (let page of pages) {
          const hidden = await page.evaluate('document.hidden');
          if (!hidden) {
            active = page;
          }
        }
        return active;
      }
      if (browserName==='chromium' && argv.pristine===undefined) {
        await page.goto('chrome://extensions/');
        await page.click('#detailsButton');
        await page.click('#crToggle');
      } else {
        await sleep(400);
      }
      let count = 0;
      for (let url of argv.urls) {
        if (count>0) {
          page = await browser.newPage();
        }
        await page.goto(url);
        count += 1;
      }
      page.on('close', () => {
        process.exit();
      });
    }
  })();
}
