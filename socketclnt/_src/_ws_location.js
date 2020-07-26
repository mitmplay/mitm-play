const _ws_namespace = require('./_ws_namespace');

module.exports = () => {
  const style = 'position: absolute;z-index: 9999;top: 8px;left: 5px;';
  const event = new Event('urlchanged');
  let container;
  let intervId;
  let button;

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\//g, '\\/');
  }

  function urlChange(event) {
    const namespace = _ws_namespace();
    if (window.mitm.autofill) {
      delete window.mitm.autofill;
    }
    if (window.mitm.autointerval) {
      clearInterval(intervId);
      delete window.mitm.autointerval;
    }
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
    container.style = style + (window.mitm.autofill ? '' : 'display: none;');
    if (typeof(window.mitm.autointerval)==='function') {
      intervId = setInterval(window.mitm.autointerval, 500);
    }
  }

  function btnclick(e) {
    const {autofill} = window.mitm;
    if (autofill) {
      console.log(JSON.stringify(autofill, null, 2));
    }
  }

  if (!chrome.tabs) {
    window.addEventListener('urlchanged', urlChange);
    const fn = history.pushState;
    history.pushState = function () {
      fn.apply(history, arguments);
      window.dispatchEvent(event);
    };
  
    window.addEventListener('DOMContentLoaded', () => {
      const node = document.querySelector('html');
      const noderef = node.firstElementChild;
      const newNode = document.createElement("div");
      newNode.style = 'position: absolute;z-index: 9999;top: 8px;left: 5px;';
      newNode.innerHTML = '<button>Autofill</button>';
      node.insertBefore(newNode, noderef);
      setTimeout(()=> {
        container = newNode;
        button = newNode.children[0];
        button.onclick = btnclick;
        urlChange(event);
      },1)
    });  
  }
}
