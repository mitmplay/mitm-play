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
  var __commonJS = (cb, mod) => () => (mod || cb((mod = {exports: {}}).exports, mod), mod.exports);

  // user-route/speedtypingonline.com/macros.js
  var require_macros = __commonJS(() => {
    window.mitm.macros = {
      "/typing-test"() {
        const {observer} = _ws_route().screenshot;
        if (!observer) {
          console.log("please set screenshot.observer.iframe = false in route!");
        } else {
          observer.iframe = (el) => {
            el.setAttribute("src", "https://example.com/");
            el.setAttribute("sandbox", "");
            console.log("OBSERVED", el);
          };
        }
      }
    };
  });

  // user-route/_global_/macros.js
  var require_macros2 = __commonJS((exports, module) => {
    module.exports = () => {
      const hello = "global";
      window.mitm.macros = {global: hello};
      return window.mitm.macros;
    };
  });

  // user-route/speedtypingonline.com/build.js
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
    let _body1 = require_macros();
    if (typeof _body1 === "function") {
      _body1 = _body1();
    }
    const {macros: macro1} = window.mitm;
    window.mitm.macros = __objSpread(__objSpread(__objSpread({}, global), macro1), _body1);
  })(function() {
    let _global = require_macros2();
    if (typeof _global === "function") {
      return _global();
    } else if (_global !== void 0) {
      return _global;
    }
  }());
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFjcm9zLmpzIiwgIi4uL19nbG9iYWxfL21hY3Jvcy5qcyIsICJidWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsid2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICcvdHlwaW5nLXRlc3QnKCkge1xyXG4gICAgY29uc3Qge29ic2VydmVyfSA9IF93c19yb3V0ZSgpLnNjcmVlbnNob3RcclxuICAgIGlmICghb2JzZXJ2ZXIpIHtcclxuICAgICAgY29uc29sZS5sb2coJ3BsZWFzZSBzZXQgc2NyZWVuc2hvdC5vYnNlcnZlci5pZnJhbWUgPSBmYWxzZSBpbiByb3V0ZSEnKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb2JzZXJ2ZXIuaWZyYW1lID0gZWwgPT4ge1xyXG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnc3JjJywgJ2h0dHBzOi8vZXhhbXBsZS5jb20vJylcclxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3NhbmRib3gnLCAnJylcclxuICAgICAgICBjb25zb2xlLmxvZygnT0JTRVJWRUQnLCBlbClcclxuICAgICAgfSAgXHJcbiAgICB9XHJcbiAgfSxcclxufVxyXG4iLCAibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xyXG5cclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7Z2xvYmFsOiBoZWxsb31cclxuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXHJcbn1cclxuIiwgIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59O1xuXG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn07XG5cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufTtcblxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9O1xufTtcblxud2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBkYXRhID0+IHtcbiAgY29uc29sZS5sb2coJ21hY3JvcyBjb2RlIGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCBkYXRhKVxufTtcblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAvLyBmaWxlOiBtYWNyb3MuanNcbiAgbGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbiAgaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7XG4gICAgX2JvZHkxID0gX2JvZHkxKClcbiAgfVxuICBjb25zdCB7bWFjcm9zOiBtYWNybzF9ID0gd2luZG93Lm1pdG1cbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xuICAgIC4uLmdsb2JhbCxcbiAgICAuLi5tYWNybzEsXG4gICAgLi4uX2JvZHkxLFxuICB9XG59KSgoZnVuY3Rpb24oKSB7XG4gIC8vIGZpbGU6IF9nbG9iYWxfL21hY3Jvcy5qc1xuICBsZXQgX2dsb2JhbCA9IHJlcXVpcmUoJy4uL19nbG9iYWxfL21hY3JvcycpXG4gIGlmICh0eXBlb2YgX2dsb2JhbD09PSdmdW5jdGlvbicpIHsgcmV0dXJuIF9nbG9iYWwoKVxuICB9IGVsc2UgaWYgKF9nbG9iYWwhPT11bmRlZmluZWQgKSB7IHJldHVybiBfZ2xvYmFsIH1cbn0pKCkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBLFdBQU8sS0FBSyxTQUFTO0FBQUEsTUFDbkIsaUJBQWlCO0FBQ2YsY0FBTSxDQUFDLFlBQVksWUFBWTtBQUMvQixZQUFJLENBQUMsVUFBVTtBQUNiLGtCQUFRLElBQUk7QUFBQSxlQUNQO0FBQ0wsbUJBQVMsU0FBUyxRQUFNO0FBQ3RCLGVBQUcsYUFBYSxPQUFPO0FBQ3ZCLGVBQUcsYUFBYSxXQUFXO0FBQzNCLG9CQUFRLElBQUksWUFBWTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ1RoQztBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUVkLGFBQU8sS0FBSyxTQUFTLENBQUMsUUFBUTtBQUM5QixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ0ZyQixNQUFJLE9BQU8sZ0JBQWMsUUFBVztBQUNsQyxXQUFPLGNBQWM7QUFBQTtBQUd2QixTQUFPLEtBQUssR0FBRyxZQUFZLE1BQU07QUFDL0IsZUFBVyxNQUFNO0FBQ2YsZUFBUyxjQUFjLGlCQUFpQjtBQUFBLE9BQ3ZDO0FBQUE7QUFHTCxTQUFPLEtBQUssR0FBRyxVQUFVLFNBQU87QUFDOUIsV0FBTyxLQUFLLFlBQVksNEJBQ25CLE9BQU8sS0FBSyxZQUNaO0FBQUE7QUFJUCxTQUFPLEtBQUssV0FBVyxNQUFNO0FBQzNCLFdBQU8sS0FBSyxZQUFZO0FBQUE7QUFHMUIsU0FBTyxZQUFZLGdCQUFnQixVQUFRO0FBQ3pDLFlBQVEsSUFBSSxzQ0FBc0M7QUFBQTtBQUdwRCxFQUFDLFVBQVMsUUFBUTtBQUVoQixRQUFJLFNBQVM7QUFDYixRQUFJLE9BQU8sV0FBUyxZQUFZO0FBQzlCLGVBQVM7QUFBQTtBQUVYLFVBQU0sQ0FBQyxRQUFRLFVBQVUsT0FBTztBQUNoQyxXQUFPLEtBQUssU0FBUyx3Q0FDaEIsU0FDQSxTQUNBO0FBQUEsS0FFSCxXQUFXO0FBRWIsUUFBSSxVQUFVO0FBQ2QsUUFBSSxPQUFPLFlBQVUsWUFBWTtBQUFFLGFBQU87QUFBQSxlQUMvQixZQUFVLFFBQVk7QUFBRSxhQUFPO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
