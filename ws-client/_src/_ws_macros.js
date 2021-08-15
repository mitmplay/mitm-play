const _c = 'color: #bada55'

module.exports = function () {
  if (window._ws_connect===undefined) {
    window._ws_connect = {}
  }

  window.mitm.fn.hotKeys = obj => {
    window.mitm.macrokeys = {
      ...window.mitm.macrokeys,
      ...obj
    }
  }
  
  window.mitm.fn.autoclick = () => {
    setTimeout(() => {
      document.querySelector('.btn-autofill').click()
    }, 1000)
  }
  
  window.mitm.fn.getCookie = name => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  window.mitm._macros_ = () => {
    window.mitm.macrokeys = {}
  }

  function init(_d) {
    let msg = 'Macros: executed after ws open'
    console.log(`%c${msg}`, _c, _d)
  }
  window._ws_connect.macrosOnMount = init
}
