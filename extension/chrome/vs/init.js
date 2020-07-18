require(['vs/editor/editor.main'], function () {
  // const el = document.getElementById('container');
  window.monaco = monaco;
  // window.monacoEl = el;
  // window.monacoEditor = monaco.editor.create(el, {
  //   language: 'javascript',
  //   // theme: "vs-dark",
  //   minimap: {
  //     enabled: false,
  //   },
  //   value: '',
  // });
  // const monacoEl = window.document.getElementById('monaco');
  // monacoEl.appendChild(window.monacoEl);
  // el.removeAttribute('style');
  // setTimeout(()=>{
  //   document.querySelector('.monaco-editor').setAttribute('height: calc(100vh - 81px);')
  //   document.querySelector('.overflow-guard').setAttribute('height: calc(100vh - 81px);')  
  // }, 500)
}.bind(this));
