const c = require('ansi-colors');

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

function browserPath(browserName, options) {
  const {
    argv,
    fn: {home}
  } = global.mitm;
  argv.browser[browserName];

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
}

const newPage = async (browser, page, url, count) => {
  if (count>0) {
    const page = await browser.newPage();
    await page.goto(url);
  } else {
    await page.goto(url);
  }
}

module.exports = {
  sleep,
  newPage,
  currentTab,
  browserPath,
}
