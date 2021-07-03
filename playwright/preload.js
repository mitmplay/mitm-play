document.addEventListener('DOMContentLoaded', e => {
  let retry = 1
  let timeout = 400

  function unregisterServiceWorker(registrations) {
    for(let registration of registrations) {
      const {active} = registration
      if (active) {
        console.log('UNREGISTER:',active.scriptURL)
        registration.unregister()  
      } else if (retry>7) {
        console.log('CANNOT UNREGISTER Service Worker!',active , registration)
      } else {
        console.log('UNREGISTER Retry:', retry)
        setTimeout(fnTimeout, timeout)
        retry += 1
        break
      }
    }
  }

  async function fnTimeout() {
    const {serviceWorker: w} = navigator
    const registrations = await w.getRegistrations()
    unregisterServiceWorker(registrations);
  }

  // console.log('UNREGISTER Service Worker')
  setTimeout(fnTimeout, timeout)
})
