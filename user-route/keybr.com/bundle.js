(function () {
  'use strict';

  window.mitm.macros = {
    '/'() {
      console.log('olah');
      window.mitm.macrokeys = {
        'KeyA'() {
          console.log('KeyA');
          alert('Alert KeyA');
        }
      };
      window.mitm.autobuttons = {
        'one|yellow'() {
          console.log('one');
          return [
            'input[type="password"] => password'
          ]
        },
      };
    },
    zero: '0'
  };

  var macros$1 = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  var macros = () => {
    const hello = 'global';

    window.mitm.macros = {global: hello};
    return window.mitm.macros
  };

  function getAugmentedNamespace(n) {
  	if (n.__esModule) return n;
  	var a = Object.defineProperty({}, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  var require$$0 = /*@__PURE__*/getAugmentedNamespace(macros$1);

  // [Ctrl] + [Alt] + [A] => run hotkey KeyA
  // [Ctrl] + [Shift] => Hide / Show Buttons
  if (window._ws_connect===undefined) {
    window._ws_connect = {};
  }
  window.mitm.fn.autoclick = () => {
    setTimeout(() => {
      document.querySelector('.btn-autofill').click();
    }, 1000);
  };

  window.mitm.fn.hotKeys = obj => {
    window.mitm.macrokeys = {
      ...window.mitm.macrokeys,
      ...obj
    };
  };

  window.mitm._macros_ = () => {
    window.mitm.macrokeys = {};
  };

  window._ws_connect.macrosOnMount = data => {
    console.log('macros code executed after ws open', data);
  };

  (function(global) {
    // file: macros.js
    let _body1 = require$$0;
    if (typeof _body1==='function') {
      _body1 = _body1();
    }
    const {macros: macro1} = window.mitm;
    window.mitm.macros = {
      ...global,
      ..._body1,
      ...macro1,
    };
  })((function() {
    // file: _global_/macros.js
    let _global = macros;
    if (typeof _global==='function') { return _global()
    } else if (_global!==undefined ) { return _global }
  })());

  var build = {

  };

  return build;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyJtYWNyb3MuanMiLCIuLi9fZ2xvYmFsXy9tYWNyb3MuanMiLCJidWlsZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBoZWxsbyA9ICd3b3JsZCdcclxuXHJcbndpbmRvdy5taXRtLm1hY3JvcyA9IHtcclxuICAnLycoKSB7XHJcbiAgICBjb25zb2xlLmxvZygnb2xhaCcpXHJcbiAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgICdLZXlBJygpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnS2V5QScpXHJcbiAgICAgICAgYWxlcnQoJ0FsZXJ0IEtleUEnKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB3aW5kb3cubWl0bS5hdXRvYnV0dG9ucyA9IHtcclxuICAgICAgJ29uZXx5ZWxsb3cnKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdvbmUnKVxyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAnaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdID0+IHBhc3N3b3JkJ1xyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgIH1cclxuICB9LFxyXG4gIHplcm86ICcwJ1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGhlbGxvID0gJ2dsb2JhbCdcclxuXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge2dsb2JhbDogaGVsbG99XHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLm1hY3Jvc1xyXG59XHJcbiIsIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59O1xuXG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn07XG5cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufTtcblxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9O1xufTtcblxud2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBkYXRhID0+IHtcbiAgY29uc29sZS5sb2coJ21hY3JvcyBjb2RlIGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCBkYXRhKVxufTtcblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAvLyBmaWxlOiBtYWNyb3MuanNcbiAgbGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbiAgaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7XG4gICAgX2JvZHkxID0gX2JvZHkxKClcbiAgfVxuICBjb25zdCB7bWFjcm9zOiBtYWNybzF9ID0gd2luZG93Lm1pdG1cbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xuICAgIC4uLmdsb2JhbCxcbiAgICAuLi5fYm9keTEsXG4gICAgLi4ubWFjcm8xLFxuICB9XG59KSgoZnVuY3Rpb24oKSB7XG4gIC8vIGZpbGU6IF9nbG9iYWxfL21hY3Jvcy5qc1xuICBsZXQgX2dsb2JhbCA9IHJlcXVpcmUoJy4uL19nbG9iYWxfL21hY3JvcycpXG4gIGlmICh0eXBlb2YgX2dsb2JhbD09PSdmdW5jdGlvbicpIHsgcmV0dXJuIF9nbG9iYWwoKVxuICB9IGVsc2UgaWYgKF9nbG9iYWwhPT11bmRlZmluZWQgKSB7IHJldHVybiBfZ2xvYmFsIH1cbn0pKCkpO1xuIl0sIm5hbWVz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
