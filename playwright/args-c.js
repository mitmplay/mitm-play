// https://stackoverflow.com/questions/21177387/caution-provisional-headers-are-shown-in-chrome-debugger/55865689#55865689
// https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
// https://peter.sh/experiments/chromium-command-line-switches/#enable-automation
// https://github.com/seleniumhq/selenium/issues/8739
// https://chromedriver.chromium.org/capabilities
// https://usefyi.com/chrome-flags/
// chrome://chrome-urls/
// chrome://version

module.exports = argv => {
  const args = [
    '--disable-features=site-per-process,isolate-origins',
    '--disable-session-crashed-bubble',
    '--disable-site-isolation-trials',
    '--ignore-certificate-errors',
    '--disable-site-isolation',
    '--disable-notifications',
    '--disable-dev-shm-usage', //https://github.com/puppeteer/puppeteer/issues/1834
    '--disable-infobars',
    '--force-dark-mode',
    '--no-experiments',
    '--test-type',
  ]

  // https://groups.google.com/a/chromium.org/g/headless-dev/c/eNTnQ8GKOBA
  // https://github.com/chrisvfritz/prerender-spa-plugin/issues/343
  if (argv.cdp) {
    args.push('--disable-web-security')
  }

  if (argv.nogpu) {
    if (argv.nogpu==='all') {
      args.push('--disable-gpu')
    } else {
      args.push(
        '--disable-accelerated-2d-canvas',
        '--disable-gpu-rasterization',
        '--disable-oop-rasterization',
        '--disable-gpu-compositing'
      )  
    }
  }
  if (argv.verbose) {
    console.log('Chromium flags', args)
  }
  return args
}

/** 
default:
--disable-background-networking 
--enable-features=NetworkService,NetworkServiceInProcess 
--disable-background-timer-throttling 
--disable-backgrounding-occluded-windows 
--disable-breakpad 
--disable-client-side-phishing-detection 
--disable-component-extensions-with-background-pages 
--disable-default-apps 
--disable-dev-shm-usage 
--disable-features=TranslateUI,BlinkGenPropertyTrees,ImprovedCookieControls,SameSiteByDefaultCookies,LazyFrameLoading 
--disable-hang-monitor 
--disable-ipc-flooding-protection 
--disable-popup-blocking 
--disable-prompt-on-repost 
--disable-renderer-backgrounding 
--disable-sync 
--force-color-profile=srgb 
--metrics-recording-only 
--no-first-run 
--password-store=basic 
--use-mock-keychain 
--user-data-dir=D:/Projects/chrome 
--remote-debugging-pipe 
--no-sandbox 
--load-extension=... 
--flag-switches-begin 
--flag-switches-end 
--file-url-path-alias="..."
about:blank
*/