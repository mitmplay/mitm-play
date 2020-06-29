const c = require('ansi-colors');
const playwright = require('playwright');
const {extract} = require('../routes/fetch');
const routes = require('../routes');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
//https://stackoverflow.com/questions/21177387/caution-provisional-headers-are-shown-in-chrome-debugger/55865689#55865689
//https://peter.sh/experiments/chromium-command-line-switches/#enable-automation
//https://chromedriver.chromium.org/capabilities
const args = [
  '--disable-features=IsolateOrigins,site-per-process',
  '--disable-site-isolation-trials=1',
  '--disable-session-crashed-bubble',
  '--ignore-certificate-errors',
  '--disable-site-isolation=1',
  '--disable-web-security=1',
  '--disable-notifications',
  '--disable-infobars',
  '--force-dark-mode',
  '--test-type',
];
const pages = {};
const browsers = {};
const bcontexts = {};
module.exports = () => {
  (async () => {
    const {
      argv,
      fn: {home}
    } = global.mitm;
    for (let browserName in argv.browser) {
      const options = {headless: false};
      let page, browser, bcontext;
      
      if (browserName==='chromium') {
        options.excludeSwitches = ['enable-automation'];
        const p = `${global.__app}/extension`;
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
        const context = await browser.newContext({viewport: { height: 734, width: 800 }});
        page = await context.newPage();  
        bcontext = context;
      }
      bcontext.route(/.*/, (route, request) => {
        routes({route, request, bcontext, browserName});
      });
      if (browserName==='chromium' && argv.pristine===undefined) {
        await page.goto('chrome://extensions/');
        await page.click('#detailsButton');
        await page.click('#crToggle');
        await page.goto(argv.url);
      } else {
        await sleep(400);
        await page.goto(argv.url); 
      }
      page.on('close', () => {
        process.exit();
      });

      bcontexts[browserName] = bcontext;
      browsers[browserName] = browser;
      pages[browserName] = page;
    }    
    global.mitm.browsers = browsers;
    global.mitm.pages = pages;
  })();  
}
