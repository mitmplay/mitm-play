(() => {
  var __defProp = Object.defineProperty;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value}) : obj[key] = value;
  var __objSpread = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // user-route/keybr.com/build.js
  if (window._ws_connect === void 0) {
    window._ws_connect = {};
  }
  window.mitm.fn.autoclick = () => {
    setTimeout(() => {
      document.querySelector(".btn-autofill").click();
    }, 1e3);
  };
  window.mitm.fn.hotKeys = (obj) => {
    window.mitm.macrokeys = __objSpread(__objSpread({}, window.mitm.macrokeys), obj);
  };
  window.mitm._macros_ = () => {
    window.mitm.macrokeys = {};
  };
  window._ws_connect.macrosOnMount = (data) => {
    console.log("macros code executed after ws open", data);
  };
  (function(global) {
    const hello = "world";
    window.mitm.macros = {
      "/"() {
        console.log("olah");
        window.mitm.macrokeys = {
          KeyA() {
            console.log("KeyA");
            alert("Alert KeyA");
          }
        };
        window.mitm.autobuttons = {
          "one|yellow"() {
            console.log("one");
            return [
              'input[type="password"] => password'
            ];
          }
        };
      },
      zero: "0"
    };
    const {macros: macro1} = window.mitm;
    window.mitm.macros = __objSpread(__objSpread({}, global), macro1);
  })(function() {
    const hello = "global";
    window.mitm.macros = {global: "0"};
    return window.mitm.macros;
  }());
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYnVpbGQuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59O1xuXG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn07XG5cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufTtcblxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9O1xufTtcblxud2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBkYXRhID0+IHtcbiAgY29uc29sZS5sb2coJ21hY3JvcyBjb2RlIGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCBkYXRhKVxufTtcblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAvLyBmaWxlOiBtYWNyb3MuanNcbiAgY29uc3QgaGVsbG8gPSAnd29ybGQnXHJcbiAgXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICAgJy8nKCkge1xyXG4gICAgICBjb25zb2xlLmxvZygnb2xhaCcpXHJcbiAgICAgIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgICAgICAnS2V5QScoKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnS2V5QScpXHJcbiAgICAgICAgICBhbGVydCgnQWxlcnQgS2V5QScpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHdpbmRvdy5taXRtLmF1dG9idXR0b25zID0ge1xyXG4gICAgICAgICdvbmV8eWVsbG93JygpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdvbmUnKVxyXG4gICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgJ2lucHV0W3R5cGU9XCJwYXNzd29yZFwiXSA9PiBwYXNzd29yZCdcclxuICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgemVybzogJzAnXHJcbiAgfVxyXG4gIFxuICBjb25zdCB7bWFjcm9zOiBtYWNybzF9ID0gd2luZG93Lm1pdG1cbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xuICAgIC4uLmdsb2JhbCxcbiAgICAuLi5tYWNybzEsXG4gIH1cbn0pKChmdW5jdGlvbigpIHtcbiAgLy8gZmlsZTogX2dsb2JhbF8vbWFjcm9zLmpzXG4gIGNvbnN0IGhlbGxvID0gJ2dsb2JhbCdcclxuICBcclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7Z2xvYmFsOiAnMCd9XHJcbiAgXG4gIC8vIHBhc3MgdG8gZnVuY3Rpb24gcGFyYW1zXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3Ncbn0pKCkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQUksT0FBTyxnQkFBYyxRQUFXO0FBQ2xDLFdBQU8sY0FBYztBQUFBO0FBR3ZCLFNBQU8sS0FBSyxHQUFHLFlBQVksTUFBTTtBQUMvQixlQUFXLE1BQU07QUFDZixlQUFTLGNBQWMsaUJBQWlCO0FBQUEsT0FDdkM7QUFBQTtBQUdMLFNBQU8sS0FBSyxHQUFHLFVBQVUsU0FBTztBQUM5QixXQUFPLEtBQUssWUFBWSw0QkFDbkIsT0FBTyxLQUFLLFlBQ1o7QUFBQTtBQUlQLFNBQU8sS0FBSyxXQUFXLE1BQU07QUFDM0IsV0FBTyxLQUFLLFlBQVk7QUFBQTtBQUcxQixTQUFPLFlBQVksZ0JBQWdCLFVBQVE7QUFDekMsWUFBUSxJQUFJLHNDQUFzQztBQUFBO0FBR3BELEVBQUMsVUFBUyxRQUFRO0FBRWhCLFVBQU0sUUFBUTtBQUVkLFdBQU8sS0FBSyxTQUFTO0FBQUEsTUFDbkIsTUFBTTtBQUNKLGdCQUFRLElBQUk7QUFDWixlQUFPLEtBQUssWUFBWTtBQUFBLFVBQ3RCLE9BQVM7QUFDUCxvQkFBUSxJQUFJO0FBQ1osa0JBQU07QUFBQTtBQUFBO0FBR1YsZUFBTyxLQUFLLGNBQWM7QUFBQSxVQUN4QixlQUFlO0FBQ2Isb0JBQVEsSUFBSTtBQUNaLG1CQUFPO0FBQUEsY0FDTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLUixNQUFNO0FBQUE7QUFHUixVQUFNLENBQUMsUUFBUSxVQUFVLE9BQU87QUFDaEMsV0FBTyxLQUFLLFNBQVMsNEJBQ2hCLFNBQ0E7QUFBQSxLQUVILFdBQVc7QUFFYixVQUFNLFFBQVE7QUFFZCxXQUFPLEtBQUssU0FBUyxDQUFDLFFBQVE7QUFHOUIsV0FBTyxPQUFPLEtBQUs7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
