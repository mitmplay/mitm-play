module.exports = function(argv) {
  let retry = 1
  let gretry = 1
  let timeout = 500

  function unregisterServiceWorker(registrations) {
    for(let registration of registrations) {
      const {active} = registration
      if (active) {
        console.log('UNREGISTER:',active.scriptURL)
        registration.unregister()  
      } else if (retry>7) {
        console.log('CANNOT UNREGISTER Service Worker!',active , registration)
      } else {
        console.log('Retry: Unregister', retry)
        setTimeout(fnTimeout, timeout)
        retry += 1
        break
      }
    }
    if (registrations.length) {
      location = location
    }
  }

  async function fnTimeout() {
    const {serviceWorker: w} = navigator
    try {
      if (w && w.getRegistrations) {
        const registrations = await w.getRegistrations()
        unregisterServiceWorker(registrations);  
      }
    } catch (error) {
      const {message} = error
      if (message.match('The document is in an invalid state')) {
        // known bug - https://bugs.chromium.org/p/chromium/issues/detail?id=1102209
      } else if (gretry>3) {
        console.log(error)
      } else {
        console.log('Retry: get registration service worker', gretry)
        setTimeout(fnTimeout, timeout + 1000)
        gretry += 1
      }    
    }
  }

  if (!argv.worker) {    
    const fn = e => {}
    setTimeout(fnTimeout, timeout)
    navigator.serviceWorker.register = function(url) {
      console.log('Service Worker is disabled!', url)
      return new Promise(fn, fn)
    }  
  }  
}