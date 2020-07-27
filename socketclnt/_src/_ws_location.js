const _ws_namespace = require('./_ws_namespace');
const _ws_vendor = require('./_ws_vendor');

module.exports = () => {
  const style = 'position: absolute;z-index: 9999;top: 8px;right: 5px;';
  const event = new Event('urlchanged');
  let ctrl = false;
  let container;
  let intervId;
  let button;

  function toRegex(str) {
    return str.replace(/\./g, '\\.').replace(/\?/g, '\\?');
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
    ctrl = false;
  }

  function btnclick(e) {
    const {autofill} = window.mitm;
    const browser = _ws_vendor();
    if (autofill) {
      console.log(JSON.stringify(autofill, null, 2));
      window.ws__send('autofill', {autofill, browser});
    }
  }

  function keybCtrl(e) { 
    if (e.code==='ControlLeft') {
      ctrl = !ctrl;
      container.style = style + (!ctrl ? '' : 'display: none;');      
    }
  }

  if (!chrome.tabs) {
    document.querySelector('html').addEventListener('keydown', keybCtrl);
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

      newNode.innerHTML = '<button class="btn-autofill">Autofill</button>';
      newNode.className = 'mitm autofill-container';
      newNode.style = style;

      node.insertBefore(newNode, noderef);
      setTimeout(()=> {
        container = newNode;
        button = newNode.children[0];
        button.onclick = btnclick;
        button.style = 'border: none;border-radius: 15px;font-size: 10px;background-color: azure;'
        urlChange(event);
      },1)
    });
  }
}
