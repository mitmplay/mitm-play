const _ws_namespace = require('./_ws_namespace');

module.exports = () => {
  const event = new Event('urlchanged');

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\//g, '\\/');
  }

  function urlChange(event) {
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

  window.addEventListener('urlchanged', urlChange);
  const fn = history.pushState;
  history.pushState = function () {
    fn.apply(history, arguments);
    window.dispatchEvent(event);
  };

  window.addEventListener('DOMContentLoaded', () => {
    const noderef = document.body.firstElementChild;
    const newNode = document.createElement("div");
    newNode.style = 'background: red;position: absolute;z-index: 9999;top: 8px;left: 5px;';
    newNode.innerHTML = '<button>Autofil</button>';
    document.body.insertBefore(newNode, noderef);
    urlChange(event);
  });  
}
