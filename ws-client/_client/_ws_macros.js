module.exports = function () {
  if (window._ws_connect===undefined) {
    window._ws_connect = {}
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

  const onMount = e => console.log('%cMacros: executed after ws open', 'color: #5ada55', e)
  window._ws_connect.macrosOnMount = onMount
}
