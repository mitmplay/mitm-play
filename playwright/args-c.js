// https://stackoverflow.com/questions/21177387/caution-provisional-headers-are-shown-in-chrome-debugger/55865689#55865689
// https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
// https://peter.sh/experiments/chromium-command-line-switches/#enable-automation
// https://github.com/seleniumhq/selenium/issues/8739
// https://chromedriver.chromium.org/capabilities
// https://usefyi.com/chrome-flags/
// page.setViewportSize({width:0, height:0});

//chrome-extension://fienfdmpabiljbljecpclbnpgnfmmmjj/html/help.html
module.exports = argv => {
  const args = [
    // '--disable-features=IsolateOrigins,site-per-process,ssl-committed-interstitials,SupervisedUserCommittedInterstitials',
    // '--unsafely-treat-insecure-origin-as-secure=chrome-extension',
    // '--enable-features=NetworkService,NetworkServiceInProcess',
    '--disable-features=site-per-process', // exclude:IsolateOrigins or plugins will failed!
    '--disable-session-crashed-bubble',
    '--disable-site-isolation-trials',
    '--ignore-certificate-errors',
    '--disable-site-isolation',
    '--disable-notifications',
    // '--enable-web-security', // some plugins still failed!
    '--disable-hang-monitor',
    '--disable-infobars',
    '--force-dark-mode',
    '--no-sandbox',
    '--test-type',
  ]

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
