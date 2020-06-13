const c = require('ansi-colors');
const exitHook = require('exit-hook');
const playwright = require('playwright');
const {extract} = require('../routes/fetch');
const routes = require('../routes');

//https://stackoverflow.com/questions/21177387/caution-provisional-headers-are-shown-in-chrome-debugger/55865689#55865689
//https://peter.sh/experiments/chromium-command-line-switches/#enable-automation
//https://chromedriver.chromium.org/capabilities
const options = {
  excludeSwitches: [
    'enable-automation'
  ],
  headless: false,
};
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

module.exports = () => {
  (async () => {
    const {
      argv,
      fn: {home}
    } = global.mitm;
    let page, browser, bcontext;
    const br = global.mitm.argv.browser;
    if (argv.browser==='chromium') {
      if (argv.plugins) {
        let path = `${process.cwd()}/`;
        path += argv.plugins.replace(/\,/g, path);
        console.log('PATH EXT', path);
        args.push(`--disable-extensions-except=${path}`);
        args.push( `--load-extension=${path}`);
      }
      if (argv.proxypac) {
        args.push(`--proxy-pac-url=${argv.proxypac}`);
      }
      options.args = args;
    }
    if (argv.executablePath) {
      options.executablePath = home(argv.executablePath);
      console.log('>> executablePath', argv.executablePath);
      if (argv.browser!=='chromium') {
        console.log(c.redBright('executablePath is unsupported for non Chrome!'))
      }
    } else {
      const _browser = require('playwright')[argv.browser];
      console.log('>> executablePath', _browser.executablePath());
    }
    if (argv.pristine) {
      // buggy route will not work :(
      browser = await playwright[br].launchPersistentContext(`${mitm.home}/.${br}`, options);
      page = await browser.pages()[0];
      bcontext = browser;
    } else {
      browser = await playwright[br].launch(options);
      const context = await browser.newContext({viewport: { height: 734, width: 800 }});
      page = await context.newPage();  
      bcontext = context;
    }
    if (argv.logurl) {
      bcontext.route('**/*', (route, request) => {
        const {url, method, headers} = extract(route, request);
        if (url.match('admin-ajax.php')) {
          console.log('>>>> Headers1', {method});
          const arr = route.request().url().split(/([&?;,]|:\w|url)/);
          console.log(`${arr[0]}${arr.length>1 ? '?' : ''}`, JSON.stringify(headers, null, 2));
        }
        route.continue({});
      });
    } else {
      bcontext.route(/.*/, routes);
    }
    
    await page.goto(argv.url);

    exitHook(async function() {
      await browser.close();
    })
    
    global.mitm.browser = browser;
    global.mitm.page = page;
    page.on('close', () => {
      process.exit();
    })
  })();  
}
//  mitm-play --logurl --url='twitter.com/search?q=covid&src=typed_query' --save=twl
