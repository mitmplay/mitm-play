/* global location */
module.exports = () => {
  function receiveMessage (event) {
    if (window.mitm.client.postmessage) {
      console.log(`>>> Postmessage: ${event.origin} => https://${location.host}`, event.data)
    }
  }
  window.addEventListener('message', receiveMessage, false)
}
