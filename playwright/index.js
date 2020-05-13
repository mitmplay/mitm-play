const playwright = require('playwright');
const exitHook = require('exit-hook');
const routes = require('../routes');

module.exports = () => {
  (async () => {
    let page, browser, brcontex;
    const { argv } = global.mitm;
    const br = mitm.argv.browser;
    if (argv.pristine) {
      // buggy route will not work :(
      browser = await playwright[br].launchPersistentContext(`${mitm.home}/.${br}`,{
        headless: false
      });
      page = await browser.pages()[0];
      brcontex = browser;
    } else {
      browser = await playwright[br].launch({
        headless: false
      });
      const context = await browser.newContext();
      page = await context.newPage();  
      brcontex = context;
    }
    if (argv.logurl) {
      brcontex.route('**/*', (route, request) => {
        const arr = route.request().url().split(/([&?;,]|:\w|url)/);
        console.log(`${arr[0]}${arr.length>1 ? '?' : ''}`);
        route.continue({});
      });
    } else {
      brcontex.route(/.*/, routes);
    }
    page.on('worker', worker => {
      console.log('Worker created: ' + worker.url());
      worker.on('close', worker => console.log('Worker destroyed: ' + worker.url()));
    });
    
    await page.goto(argv.go);

    exitHook(async function() {
      await browser.close();
    })
    
    global.mitm.browser = browser;
    global.mitm.page = page;
  })();  
}
//  mitm-play --logurl --go='twitter.com/search?q=covid&src=typed_query' --save=twl
