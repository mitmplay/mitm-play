const c = require('ansi-colors');
const playwright = require('playwright');
const args = require('./chromium-args');
const _options = require('./options');
const routes = require('../routes');

const pages = {};
const browsers = {};
const bcontexts = {};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function currentTab(browser) {
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
}

module.exports = () => {
  const {
    argv,
    fn: {home}
  } = global.mitm;
  console.log(c.whiteBright('RUN PLAYWRIGHT!'));
  (async () => {
    global.mitm.pages = pages;
    global.mitm.browsers = browsers;  
    for (let browserName in argv.browser) {
      const options = _options();
      let page, browser, bcontext;
      
      if (browserName==='chromium') {
        const {fn: {flist}, path: {userroute}} = global.mitm;
        const ppath = userroute.split('*')[0]+'_plugins_';
        options.excludeSwitches = ['enable-automation'];
        const plugins = flist(ppath);
        const p = `${global.__app}/plugins`;
        let path = `${process.cwd()}/`;
        if (plugins.length) {
          path = `${ppath}/`;
          path += plugins.join(`,${path}`);
          path += `,${p}/chrome`;
        } else {
          path = `${p}/chrome`;
        }
        path = path.replace(/\\/g, '/');
        console.log('>> Plugins:', path.split(','));
        args.push(`--disable-extensions-except=${path}`);
        args.push( `--load-extension=${path}`);
        if (typeof(argv.proxy)==='string') {
          console.log(c.red.bgYellowBright(`>> --proxy ${argv.proxy} will take presedence over --proxypac ${argv.proxypac}`))
        } else if (argv.proxypac) {
          console.log(c.red.bgYellowBright(`>> Chromium browser will use --proxypac ${argv.proxypac}`))
          args.push(`--proxy-pac-url=${argv.proxypac}`);
        }
        options.viewport = null,
        options.args = args;
      }
      if (argv.proxy===true) {
        console.log(c.red.bgYellowBright(`>> mitm-play will use --proxy but browser will not!`))
      }      
      let execPath = argv.browser[browserName];
      if (typeof(execPath)==='string') {
        execPath = execPath.replace(/\\/g, '/');
        if (browserName!=='chromium') {
          console.log(c.redBright('executablePath is unsupported for non Chrome!'))
        } else if (process.platform==='darwin') {
          execPath += '/Contents/MacOS/Google Chrome';
        }
        options.executablePath = home(execPath);
      } else {
        const _browser = require('playwright')[browserName];
        execPath = _browser.executablePath().replace(/\\/g, '/');
      }
      if (browserName!=='chromium') {
        console.log(c.yellow(`>> executablePath: ${execPath}`));
      }
      const playBrowser = playwright[browserName];
      if (argv.pristine) {
        // buggy route will not work :(
        const bprofile = `${global.mitm.path.home}/.${browserName}`;
        console.log('>> Browser profile', bprofile);
        browser = await playBrowser.launchPersistentContext(bprofile, options);
        page = await  browser.pages()[0];
        bcontext = browser;
      } else {
        console.log('>> Browser option', options);
        browser = await playBrowser.launch(options);
        //const context = await browser.newContext({viewport: { height: 734, width: 800 }});
        const context = await browser.newContext({ viewport: null });
        page = await context.newPage();
        bcontext = context;
      }
      currentTab(browser);
      if (browserName==='chromium') {
        const cdp = await page.context().newCDPSession(page);
        global.mitm.cdp = cdp;
      } else {
        await sleep(300);
      }
      bcontexts[browserName] = bcontext;
      browsers[browserName] = browser;
      pages[browserName] = page;
      if (browserName==='chromium' && argv.pristine===undefined) {
        await page.goto('chrome://extensions/');
        await page.click('#detailsButton');
        await page.click('#crToggle');
      }
      console.log(c.whiteBright('RUN MITM!!!'));
      bcontext.route(/.*/, (route, request) => {
        routes({route, request, bcontext, browserName});
      });
      let count = 0;
      for (let url of argv.urls) {
        newPage(browser, page, url, count);
        count += 1;
      }
      page.on('close', () => {
        process.exit();
      });
    }
  })();
}

const newPage = async (browser, page, url, count) => {
  if (count>0) {
    const page = await browser.newPage();
    await page.goto(url);
  } else {
    await page.goto(url);
  }
}
