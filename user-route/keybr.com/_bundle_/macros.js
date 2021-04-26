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

  // user-route/keybr.com/_macros_/macros.js
  var require_macros = __commonJS((exports, module) => {
    module.exports = () => {
      const hello = "world";
      return {
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

  // user-route/keybr.com/_macros_/build.js
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnd29ybGQnXHJcbiAgcmV0dXJuIHtcclxuICAgICcvJygpIHtcclxuICAgICAgY29uc29sZS5sb2coJ29sYWgnKVxyXG4gICAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgICAgJ0tleUEnKCkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0tleUEnKVxyXG4gICAgICAgICAgYWxlcnQoJ0FsZXJ0IEtleUEnKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB3aW5kb3cubWl0bS5hdXRvYnV0dG9ucyA9IHtcclxuICAgICAgICAnb25lfHllbGxvdycoKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnb25lJylcclxuICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICdpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0gPT4gcGFzc3dvcmQnXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHplcm86ICcwJ1xyXG4gIH1cclxufSIsICJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBoZWxsbyA9ICdnbG9iYWwnXHJcblxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6IGhlbGxvfVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufVxyXG4iLCAiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbn1cbndpbmRvdy5taXRtLmZuLmdldENvb2tpZSA9IGZ1bmN0aW9uIGdldENvb2tpZShuYW1lKSB7XHJcbiAgY29uc3QgdmFsdWUgPSBgOyAke2RvY3VtZW50LmNvb2tpZX1gO1xyXG4gIGNvbnN0IHBhcnRzID0gdmFsdWUuc3BsaXQoYDsgJHtuYW1lfT1gKTtcclxuICBpZiAocGFydHMubGVuZ3RoID09PSAyKSByZXR1cm4gcGFydHMucG9wKCkuc3BsaXQoJzsnKS5zaGlmdCgpO1xyXG59XG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn1cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufVxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9XG59XG53aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IGRhdGEgPT4ge1xuICBjb25zb2xlLmxvZygnbWFjcm9zIGNvZGUgZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsIGRhdGEpXG59XG5jb25zdCB7bWFjcm9zfSA9IHdpbmRvdy5taXRtXG5sZXQgX2JvZHkxID0gcmVxdWlyZSgnLi9tYWNyb3MnKVxuaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7XG4gIF9ib2R5MSA9IF9ib2R5MSgpXG59XG5sZXQgZ2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vX2dsb2JhbF8vX21hY3Jvc18vbWFjcm9zJylcbmlmICh0eXBlb2YgZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyBcbiAgZ2xvYmFsID0gZ2xvYmFsKClcbn1cbndpbmRvdy5taXRtLm1hY3JvcyA9IHtcbiAgLi4uZ2xvYmFsLFxuICAuLi5tYWNyb3MsXG4gIC4uLl9ib2R5MSxcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQSxXQUFPLFVBQVUsTUFBTTtBQUNyQixZQUFNLFFBQVE7QUFDZCxhQUFPO0FBQUEsUUFDTCxNQUFNO0FBQ0osa0JBQVEsSUFBSTtBQUNaLGlCQUFPLEtBQUssWUFBWTtBQUFBLFlBQ3RCLE9BQVM7QUFDUCxzQkFBUSxJQUFJO0FBQ1osb0JBQU07QUFBQTtBQUFBO0FBR1YsaUJBQU8sS0FBSyxjQUFjO0FBQUEsWUFDeEIsZUFBZTtBQUNiLHNCQUFRLElBQUk7QUFDWixxQkFBTztBQUFBLGdCQUNMO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUtSLE1BQU07QUFBQTtBQUFBO0FBQUE7OztBQ3BCVjtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUVkLGFBQU8sS0FBSyxTQUFTLENBQUMsUUFBUTtBQUM5QixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ0ZyQixNQUFJLE9BQU8sZ0JBQWMsUUFBVztBQUNsQyxXQUFPLGNBQWM7QUFBQTtBQUV2QixTQUFPLEtBQUssR0FBRyxZQUFZLG1CQUFtQixNQUFNO0FBQ2xELFVBQU0sUUFBUSxLQUFLLFNBQVM7QUFDNUIsVUFBTSxRQUFRLE1BQU0sTUFBTSxLQUFLO0FBQy9CLFFBQUksTUFBTSxXQUFXO0FBQUcsYUFBTyxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQUE7QUFFeEQsU0FBTyxLQUFLLEdBQUcsWUFBWSxNQUFNO0FBQy9CLGVBQVcsTUFBTTtBQUNmLGVBQVMsY0FBYyxpQkFBaUI7QUFBQSxPQUN2QztBQUFBO0FBRUwsU0FBTyxLQUFLLEdBQUcsVUFBVSxTQUFPO0FBQzlCLFdBQU8sS0FBSyxZQUFZLDRCQUNuQixPQUFPLEtBQUssWUFDWjtBQUFBO0FBR1AsU0FBTyxLQUFLLFdBQVcsTUFBTTtBQUMzQixXQUFPLEtBQUssWUFBWTtBQUFBO0FBRTFCLFNBQU8sWUFBWSxnQkFBZ0IsVUFBUTtBQUN6QyxZQUFRLElBQUksc0NBQXNDO0FBQUE7QUFFcEQsTUFBTSxDQUFDLFVBQVUsT0FBTztBQUN4QixNQUFJLFNBQVM7QUFDYixNQUFJLE9BQU8sV0FBUyxZQUFZO0FBQzlCLGFBQVM7QUFBQTtBQUVYLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsU0FBTyxLQUFLLFNBQVMsd0NBQ2hCLFNBQ0EsU0FDQTsiLAogICJuYW1lcyI6IFtdCn0K
