window.mitm.macros = {
  '/typing-test'() {
    const {observer} = _ws_route().screenshot
    if (!observer) {
      console.log('please set screenshot.observer.iframe = true in route!')
    } else {
      observer.iframe = el => {
        el.setAttribute('src', 'https://example.com/')
        el.setAttribute('sandbox', '')
        console.log('OBSERVED', el)
      }  
    }
  },
}
