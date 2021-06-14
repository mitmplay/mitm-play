async function screnshot(json) {
  const {__args} = window.mitm
  if ([true, 'off'].includes(__args.nosocket)) {
    return new Promise(function(resolve, reject) {
      try {
        const config = {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(json)
        }
        fetch('/mitm-play/screnshot.json', config)
        .then(function(response) { resolve(response.json())})
        .then(function(data    ) { resolve(data)           })
      } catch (error) {
        reject(error)
      }
    })
  } else {
    return new Promise(function(resolve, reject) {  
      try {
        window.ws__send('screenshot', json, resolve)
      } catch (error) {
        reject(error)
      }
    })  
  }
}
module.exports = screnshot