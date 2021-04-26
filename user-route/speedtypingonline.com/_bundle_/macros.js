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

  // user-route/speedtypingonline.com/_macros_/macros.js
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

  // user-route/_global_/_macros_/macros.js
  var require_macros2 = __commonJS((exports, module) => {
    module.exports = () => {
      const hello = "global";
      window.mitm.macros = {global: hello};
      return window.mitm.macros;
    };
  });

  // user-route/speedtypingonline.com/_macros_/build.js
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
  var {macros} = window.mitm;
  var _body1 = require_macros();
  if (typeof _body1 === "function") {
    _body1 = _body1();
  }
  var global = require_macros2();
  if (typeof global === "function") {
    global = global();
  }
  window.mitm.macros = __objSpread(__objSpread(__objSpread({}, global), macros), _body1);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsid2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICcvdHlwaW5nLXRlc3QnKCkge1xyXG4gICAgY29uc3Qge29ic2VydmVyfSA9IF93c19yb3V0ZSgpLnNjcmVlbnNob3RcclxuICAgIGlmICghb2JzZXJ2ZXIpIHtcclxuICAgICAgY29uc29sZS5sb2coJ3BsZWFzZSBzZXQgc2NyZWVuc2hvdC5vYnNlcnZlci5pZnJhbWUgPSBmYWxzZSBpbiByb3V0ZSEnKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb2JzZXJ2ZXIuaWZyYW1lID0gZWwgPT4ge1xyXG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnc3JjJywgJ2h0dHBzOi8vZXhhbXBsZS5jb20vJylcclxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3NhbmRib3gnLCAnJylcclxuICAgICAgICBjb25zb2xlLmxvZygnT0JTRVJWRUQnLCBlbClcclxuICAgICAgfSAgXHJcbiAgICB9XHJcbiAgfSxcclxufVxyXG4iLCAibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xyXG5cclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7Z2xvYmFsOiBoZWxsb31cclxuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXHJcbn1cclxuIiwgIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59XG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn1cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufVxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9XG59XG53aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IGRhdGEgPT4ge1xuICBjb25zb2xlLmxvZygnbWFjcm9zIGNvZGUgZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsIGRhdGEpXG59XG5jb25zdCB7bWFjcm9zfSA9IHdpbmRvdy5taXRtXG5sZXQgX2JvZHkxID0gcmVxdWlyZSgnLi9tYWNyb3MnKVxuaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7XG4gIF9ib2R5MSA9IF9ib2R5MSgpXG59XG5sZXQgZ2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vX2dsb2JhbF8vX21hY3Jvc18vbWFjcm9zJylcbmlmICh0eXBlb2YgZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyBcbiAgZ2xvYmFsID0gZ2xvYmFsKClcbn1cbndpbmRvdy5taXRtLm1hY3JvcyA9IHtcbiAgLi4uZ2xvYmFsLFxuICAuLi5tYWNyb3MsXG4gIC4uLl9ib2R5MSxcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQSxXQUFPLEtBQUssU0FBUztBQUFBLE1BQ25CLGlCQUFpQjtBQUNmLGNBQU0sQ0FBQyxZQUFZLFlBQVk7QUFDL0IsWUFBSSxDQUFDLFVBQVU7QUFDYixrQkFBUSxJQUFJO0FBQUEsZUFDUDtBQUNMLG1CQUFTLFNBQVMsUUFBTTtBQUN0QixlQUFHLGFBQWEsT0FBTztBQUN2QixlQUFHLGFBQWEsV0FBVztBQUMzQixvQkFBUSxJQUFJLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNUaEM7QUFBQSxXQUFPLFVBQVUsTUFBTTtBQUNyQixZQUFNLFFBQVE7QUFFZCxhQUFPLEtBQUssU0FBUyxDQUFDLFFBQVE7QUFDOUIsYUFBTyxPQUFPLEtBQUs7QUFBQTtBQUFBOzs7QUNGckIsTUFBSSxPQUFPLGdCQUFjLFFBQVc7QUFDbEMsV0FBTyxjQUFjO0FBQUE7QUFFdkIsU0FBTyxLQUFLLEdBQUcsWUFBWSxNQUFNO0FBQy9CLGVBQVcsTUFBTTtBQUNmLGVBQVMsY0FBYyxpQkFBaUI7QUFBQSxPQUN2QztBQUFBO0FBRUwsU0FBTyxLQUFLLEdBQUcsVUFBVSxTQUFPO0FBQzlCLFdBQU8sS0FBSyxZQUFZLDRCQUNuQixPQUFPLEtBQUssWUFDWjtBQUFBO0FBR1AsU0FBTyxLQUFLLFdBQVcsTUFBTTtBQUMzQixXQUFPLEtBQUssWUFBWTtBQUFBO0FBRTFCLFNBQU8sWUFBWSxnQkFBZ0IsVUFBUTtBQUN6QyxZQUFRLElBQUksc0NBQXNDO0FBQUE7QUFFcEQsTUFBTSxDQUFDLFVBQVUsT0FBTztBQUN4QixNQUFJLFNBQVM7QUFDYixNQUFJLE9BQU8sV0FBUyxZQUFZO0FBQzlCLGFBQVM7QUFBQTtBQUVYLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsU0FBTyxLQUFLLFNBQVMsd0NBQ2hCLFNBQ0EsU0FDQTsiLAogICJuYW1lcyI6IFtdCn0K
