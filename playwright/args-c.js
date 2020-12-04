// https://stackoverflow.com/questions/21177387/caution-provisional-headers-are-shown-in-chrome-debugger/55865689#55865689
// https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
// https://peter.sh/experiments/chromium-command-line-switches/#enable-automation
// https://chromedriver.chromium.org/capabilities
// https://usefyi.com/chrome-flags/
// page.setViewportSize({width:0, height:0});

module.exports = argv => {
  const args = [
    '--disable-features=site-per-process', // exclude:IsolateOrigins or plugins will failed!
    '--disable-site-isolation-trials=1',
    '--disable-session-crashed-bubble',
    '--ignore-certificate-errors',
    '--disable-site-isolation=1',
    // '--disable-web-security=1', // some plugins still failed!
    '--disable-notifications',
    '--disable-infobars',
    '--force-dark-mode',
    '--test-type'
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
