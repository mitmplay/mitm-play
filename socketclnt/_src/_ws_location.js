const _ws_namespace = require('./_ws_namespace');

module.exports = () => {
  const event = new Event('urlchanged');

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\//g, '\\/');
  }

  function funcRef(event) {
    const namespace = _ws_namespace();
    if (namespace) {
      const {pathname} = location;
      const {macros} = window.mitm;
      // console.log(namespace, location);
      for (let key in macros) {
        if (pathname.match(toRegex(key))) {
          macros[key]();
        } 
      }
    }
  }

  window.addEventListener('urlchanged', funcRef);
  const fn = history.pushState;
  history.pushState = function () {
    fn.apply(history, arguments);
    window.dispatchEvent(event);
  };
  funcRef();
}
