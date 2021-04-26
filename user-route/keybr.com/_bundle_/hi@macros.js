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

  // user-route/keybr.com/_macros_/test.js
  var require_test = __commonJS((exports, module) => {
    var dodol = "lipret";
    console.log(dodol);
    module.exports = dodol;
  });

  // user-route/keybr.com/_macros_/hi@macros.js
  var require_hi_macros = __commonJS((exports, module) => {
    module.exports = () => {
      const lol = require_test();
      const hello = "hi macros";
      window.mitm.macros = {
        one: "1",
        two: "2",
        thr: "3",
        fou: "4"
      };
      console.log(lol);
      return window.mitm.macros;
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

  // user-route/keybr.com/_macros_/hi@build.js
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
  var _body2 = require_hi_macros();
  if (typeof _body2 === "function") {
    _body2 = _body2();
  }
  var global = require_macros2();
  if (typeof global === "function") {
    global = global();
  }
  window.mitm.macros = __objSpread(__objSpread(__objSpread(__objSpread({}, global), macros), _body1), _body2);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uL19tYWNyb3NfL3Rlc3QuanMiLCAiLi4vX21hY3Jvc18vaGlAbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9oaUBidWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnd29ybGQnXHJcbiAgcmV0dXJuIHtcclxuICAgICcvJygpIHtcclxuICAgICAgY29uc29sZS5sb2coJ29sYWgnKVxyXG4gICAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgICAgJ0tleUEnKCkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0tleUEnKVxyXG4gICAgICAgICAgYWxlcnQoJ0FsZXJ0IEtleUEnKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB3aW5kb3cubWl0bS5hdXRvYnV0dG9ucyA9IHtcclxuICAgICAgICAnb25lfHllbGxvdycoKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnb25lJylcclxuICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICdpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0gPT4gcGFzc3dvcmQnXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHplcm86ICcwJ1xyXG4gIH1cclxufSIsICJjb25zdCBkb2RvbCA9ICdsaXByZXQnXHJcbmNvbnNvbGUubG9nKGRvZG9sKVxyXG5tb2R1bGUuZXhwb3J0cyA9IGRvZG9sXHJcbiIsICJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBsb2wgPSByZXF1aXJlKCcuL3Rlc3QnKVxyXG4gIGNvbnN0IGhlbGxvID0gJ2hpIG1hY3JvcydcclxuXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICAgICBvbmU6ICcxJyxcclxuICAgICAgdHdvOiAnMicsXHJcbiAgICAgIHRocjogJzMnLFxyXG4gICAgICBmb3U6ICc0JyxcclxuICB9XHJcbiAgY29uc29sZS5sb2cobG9sKVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufSIsICJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBoZWxsbyA9ICdnbG9iYWwnXHJcblxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6IGhlbGxvfVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufVxyXG4iLCAiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbn1cbndpbmRvdy5taXRtLmZuLmdldENvb2tpZSA9IGZ1bmN0aW9uIGdldENvb2tpZShuYW1lKSB7XHJcbiAgY29uc3QgdmFsdWUgPSBgOyAke2RvY3VtZW50LmNvb2tpZX1gO1xyXG4gIGNvbnN0IHBhcnRzID0gdmFsdWUuc3BsaXQoYDsgJHtuYW1lfT1gKTtcclxuICBpZiAocGFydHMubGVuZ3RoID09PSAyKSByZXR1cm4gcGFydHMucG9wKCkuc3BsaXQoJzsnKS5zaGlmdCgpO1xyXG59XG53aW5kb3cubWl0bS5mbi5hdXRvY2xpY2sgPSAoKSA9PiB7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuLWF1dG9maWxsJykuY2xpY2soKVxyXG4gIH0sIDEwMDApXHJcbn1cbndpbmRvdy5taXRtLmZuLmhvdEtleXMgPSBvYmogPT4ge1xyXG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgIC4uLndpbmRvdy5taXRtLm1hY3Jva2V5cyxcclxuICAgIC4uLm9ialxyXG4gIH1cclxufVxud2luZG93Lm1pdG0uX21hY3Jvc18gPSAoKSA9PiB7XG4gIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHt9XG59XG53aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IGRhdGEgPT4ge1xuICBjb25zb2xlLmxvZygnbWFjcm9zIGNvZGUgZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsIGRhdGEpXG59XG5jb25zdCB7bWFjcm9zfSA9IHdpbmRvdy5taXRtXG5sZXQgX2JvZHkxID0gcmVxdWlyZSgnLi9tYWNyb3MnKVxuaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7IFxuICBfYm9keTEgPSBfYm9keTEoKVxufVxubGV0IF9ib2R5MiA9IHJlcXVpcmUoJy4vaGlAbWFjcm9zLmpzJylcbmlmICh0eXBlb2YgX2JvZHkyPT09J2Z1bmN0aW9uJykge1xuICBfYm9keTIgPSBfYm9keTIoKVxufVxubGV0IGdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3JvcycpXG5pZiAodHlwZW9mIGdsb2JhbD09PSdmdW5jdGlvbicpIHsgXG4gIGdsb2JhbCA9IGdsb2JhbCgpXG59XG53aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gIC4uLmdsb2JhbCxcbiAgLi4ubWFjcm9zLFxuICAuLi5fYm9keTEsXG4gIC4uLl9ib2R5MlxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUNkLGFBQU87QUFBQSxRQUNMLE1BQU07QUFDSixrQkFBUSxJQUFJO0FBQ1osaUJBQU8sS0FBSyxZQUFZO0FBQUEsWUFDdEIsT0FBUztBQUNQLHNCQUFRLElBQUk7QUFDWixvQkFBTTtBQUFBO0FBQUE7QUFHVixpQkFBTyxLQUFLLGNBQWM7QUFBQSxZQUN4QixlQUFlO0FBQ2Isc0JBQVEsSUFBSTtBQUNaLHFCQUFPO0FBQUEsZ0JBQ0w7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBS1IsTUFBTTtBQUFBO0FBQUE7QUFBQTs7O0FDcEJWO0FBQUEsUUFBTSxRQUFRO0FBQ2QsWUFBUSxJQUFJO0FBQ1osV0FBTyxVQUFVO0FBQUE7OztBQ0ZqQjtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sTUFBTTtBQUNaLFlBQU0sUUFBUTtBQUVkLGFBQU8sS0FBSyxTQUFTO0FBQUEsUUFDakIsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBO0FBRVQsY0FBUSxJQUFJO0FBQ1osYUFBTyxPQUFPLEtBQUs7QUFBQTtBQUFBOzs7QUNYckI7QUFBQSxXQUFPLFVBQVUsTUFBTTtBQUNyQixZQUFNLFFBQVE7QUFFZCxhQUFPLEtBQUssU0FBUyxDQUFDLFFBQVE7QUFDOUIsYUFBTyxPQUFPLEtBQUs7QUFBQTtBQUFBOzs7QUNGckIsTUFBSSxPQUFPLGdCQUFjLFFBQVc7QUFDbEMsV0FBTyxjQUFjO0FBQUE7QUFFdkIsU0FBTyxLQUFLLEdBQUcsWUFBWSxtQkFBbUIsTUFBTTtBQUNsRCxVQUFNLFFBQVEsS0FBSyxTQUFTO0FBQzVCLFVBQU0sUUFBUSxNQUFNLE1BQU0sS0FBSztBQUMvQixRQUFJLE1BQU0sV0FBVztBQUFHLGFBQU8sTUFBTSxNQUFNLE1BQU0sS0FBSztBQUFBO0FBRXhELFNBQU8sS0FBSyxHQUFHLFlBQVksTUFBTTtBQUMvQixlQUFXLE1BQU07QUFDZixlQUFTLGNBQWMsaUJBQWlCO0FBQUEsT0FDdkM7QUFBQTtBQUVMLFNBQU8sS0FBSyxHQUFHLFVBQVUsU0FBTztBQUM5QixXQUFPLEtBQUssWUFBWSw0QkFDbkIsT0FBTyxLQUFLLFlBQ1o7QUFBQTtBQUdQLFNBQU8sS0FBSyxXQUFXLE1BQU07QUFDM0IsV0FBTyxLQUFLLFlBQVk7QUFBQTtBQUUxQixTQUFPLFlBQVksZ0JBQWdCLFVBQVE7QUFDekMsWUFBUSxJQUFJLHNDQUFzQztBQUFBO0FBRXBELE1BQU0sQ0FBQyxVQUFVLE9BQU87QUFDeEIsTUFBSSxTQUFTO0FBQ2IsTUFBSSxPQUFPLFdBQVMsWUFBWTtBQUM5QixhQUFTO0FBQUE7QUFFWCxNQUFJLFNBQVM7QUFDYixNQUFJLE9BQU8sV0FBUyxZQUFZO0FBQzlCLGFBQVM7QUFBQTtBQUVYLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsU0FBTyxLQUFLLFNBQVMsb0RBQ2hCLFNBQ0EsU0FDQSxTQUNBOyIsCiAgIm5hbWVzIjogW10KfQo=
