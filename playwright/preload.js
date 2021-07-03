document.addEventListener('DOMContentLoaded', e => {
  function unregisterServiceWorker(registrations) {
    for(let registration of registrations) {
      const {active} = registration
      if (active) {
        console.log('UNREGISTER:',active.scriptURL)
        registration.unregister()  
      } else {
        console.log('CANNOT UNREGISTER Service Worker!',active , registration)
      }
    }
  }

  // console.log('UNREGISTER Service Worker')
  setTimeout(async () => {
    const {serviceWorker: w} = navigator
    const registrations = await w.getRegistrations()
    unregisterServiceWorker(registrations);
  }, 800)
})