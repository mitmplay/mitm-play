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
  window.mitm.fn.getCookie = function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return parts.pop().split(";").shift();
  };
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsid2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICcvdHlwaW5nLXRlc3QnKCkge1xyXG4gICAgY29uc3Qge29ic2VydmVyfSA9IF93c19yb3V0ZSgpLnNjcmVlbnNob3RcclxuICAgIGlmICghb2JzZXJ2ZXIpIHtcclxuICAgICAgY29uc29sZS5sb2coJ3BsZWFzZSBzZXQgc2NyZWVuc2hvdC5vYnNlcnZlci5pZnJhbWUgPSBmYWxzZSBpbiByb3V0ZSEnKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb2JzZXJ2ZXIuaWZyYW1lID0gZWwgPT4ge1xyXG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnc3JjJywgJ2h0dHBzOi8vZXhhbXBsZS5jb20vJylcclxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3NhbmRib3gnLCAnJylcclxuICAgICAgICBjb25zb2xlLmxvZygnT0JTRVJWRUQnLCBlbClcclxuICAgICAgfSAgXHJcbiAgICB9XHJcbiAgfSxcclxufVxyXG4iLCAibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnZ2xvYmFsJ1xyXG5cclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7Z2xvYmFsOiBoZWxsb31cclxuICByZXR1cm4gd2luZG93Lm1pdG0ubWFjcm9zXHJcbn1cclxuIiwgIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5pZiAod2luZG93Ll93c19jb25uZWN0PT09dW5kZWZpbmVkKSB7XG4gIHdpbmRvdy5fd3NfY29ubmVjdCA9IHt9XG59XG53aW5kb3cubWl0bS5mbi5nZXRDb29raWUgPSBmdW5jdGlvbiBnZXRDb29raWUobmFtZSkge1xyXG4gIGNvbnN0IHZhbHVlID0gYDsgJHtkb2N1bWVudC5jb29raWV9YDtcclxuICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KGA7ICR7bmFtZX09YCk7XHJcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikgcmV0dXJuIHBhcnRzLnBvcCgpLnNwbGl0KCc7Jykuc2hpZnQoKTtcclxufVxud2luZG93Lm1pdG0uZm4uYXV0b2NsaWNrID0gKCkgPT4ge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ0bi1hdXRvZmlsbCcpLmNsaWNrKClcclxuICB9LCAxMDAwKVxyXG59XG53aW5kb3cubWl0bS5mbi5ob3RLZXlzID0gb2JqID0+IHtcclxuICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAuLi53aW5kb3cubWl0bS5tYWNyb2tleXMsXHJcbiAgICAuLi5vYmpcclxuICB9XHJcbn1cbndpbmRvdy5taXRtLl9tYWNyb3NfID0gKCkgPT4ge1xuICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7fVxufVxud2luZG93Ll93c19jb25uZWN0Lm1hY3Jvc09uTW91bnQgPSBkYXRhID0+IHtcbiAgY29uc29sZS5sb2coJ21hY3JvcyBjb2RlIGV4ZWN1dGVkIGFmdGVyIHdzIG9wZW4nLCBkYXRhKVxufVxuY29uc3Qge21hY3Jvc30gPSB3aW5kb3cubWl0bVxubGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbmlmICh0eXBlb2YgX2JvZHkxPT09J2Z1bmN0aW9uJykge1xuICBfYm9keTEgPSBfYm9keTEoKVxufVxubGV0IGdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3JvcycpXG5pZiAodHlwZW9mIGdsb2JhbD09PSdmdW5jdGlvbicpIHsgXG4gIGdsb2JhbCA9IGdsb2JhbCgpXG59XG53aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gIC4uLmdsb2JhbCxcbiAgLi4ubWFjcm9zLFxuICAuLi5fYm9keTEsXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsV0FBTyxLQUFLLFNBQVM7QUFBQSxNQUNuQixpQkFBaUI7QUFDZixjQUFNLENBQUMsWUFBWSxZQUFZO0FBQy9CLFlBQUksQ0FBQyxVQUFVO0FBQ2Isa0JBQVEsSUFBSTtBQUFBLGVBQ1A7QUFDTCxtQkFBUyxTQUFTLFFBQU07QUFDdEIsZUFBRyxhQUFhLE9BQU87QUFDdkIsZUFBRyxhQUFhLFdBQVc7QUFDM0Isb0JBQVEsSUFBSSxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDVGhDO0FBQUEsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxRQUFRO0FBRWQsYUFBTyxLQUFLLFNBQVMsQ0FBQyxRQUFRO0FBQzlCLGFBQU8sT0FBTyxLQUFLO0FBQUE7QUFBQTs7O0FDRnJCLE1BQUksT0FBTyxnQkFBYyxRQUFXO0FBQ2xDLFdBQU8sY0FBYztBQUFBO0FBRXZCLFNBQU8sS0FBSyxHQUFHLFlBQVksbUJBQW1CLE1BQU07QUFDbEQsVUFBTSxRQUFRLEtBQUssU0FBUztBQUM1QixVQUFNLFFBQVEsTUFBTSxNQUFNLEtBQUs7QUFDL0IsUUFBSSxNQUFNLFdBQVc7QUFBRyxhQUFPLE1BQU0sTUFBTSxNQUFNLEtBQUs7QUFBQTtBQUV4RCxTQUFPLEtBQUssR0FBRyxZQUFZLE1BQU07QUFDL0IsZUFBVyxNQUFNO0FBQ2YsZUFBUyxjQUFjLGlCQUFpQjtBQUFBLE9BQ3ZDO0FBQUE7QUFFTCxTQUFPLEtBQUssR0FBRyxVQUFVLFNBQU87QUFDOUIsV0FBTyxLQUFLLFlBQVksNEJBQ25CLE9BQU8sS0FBSyxZQUNaO0FBQUE7QUFHUCxTQUFPLEtBQUssV0FBVyxNQUFNO0FBQzNCLFdBQU8sS0FBSyxZQUFZO0FBQUE7QUFFMUIsU0FBTyxZQUFZLGdCQUFnQixVQUFRO0FBQ3pDLFlBQVEsSUFBSSxzQ0FBc0M7QUFBQTtBQUVwRCxNQUFNLENBQUMsVUFBVSxPQUFPO0FBQ3hCLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsTUFBSSxTQUFTO0FBQ2IsTUFBSSxPQUFPLFdBQVMsWUFBWTtBQUM5QixhQUFTO0FBQUE7QUFFWCxTQUFPLEtBQUssU0FBUyx3Q0FDaEIsU0FDQSxTQUNBOyIsCiAgIm5hbWVzIjogW10KfQo=
