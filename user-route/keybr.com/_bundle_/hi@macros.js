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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uL19tYWNyb3NfL3Rlc3QuanMiLCAiLi4vX21hY3Jvc18vaGlAbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9oaUBidWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsibW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgaGVsbG8gPSAnd29ybGQnXHJcbiAgcmV0dXJuIHtcclxuICAgICcvJygpIHtcclxuICAgICAgY29uc29sZS5sb2coJ29sYWgnKVxyXG4gICAgICB3aW5kb3cubWl0bS5tYWNyb2tleXMgPSB7XHJcbiAgICAgICAgJ0tleUEnKCkge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ0tleUEnKVxyXG4gICAgICAgICAgYWxlcnQoJ0FsZXJ0IEtleUEnKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB3aW5kb3cubWl0bS5hdXRvYnV0dG9ucyA9IHtcclxuICAgICAgICAnb25lfHllbGxvdycoKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnb25lJylcclxuICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICdpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0gPT4gcGFzc3dvcmQnXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHplcm86ICcwJ1xyXG4gIH1cclxufSIsICJjb25zdCBkb2RvbCA9ICdsaXByZXQnXHJcbmNvbnNvbGUubG9nKGRvZG9sKVxyXG5tb2R1bGUuZXhwb3J0cyA9IGRvZG9sXHJcbiIsICJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBsb2wgPSByZXF1aXJlKCcuL3Rlc3QnKVxyXG4gIGNvbnN0IGhlbGxvID0gJ2hpIG1hY3JvcydcclxuXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICAgICBvbmU6ICcxJyxcclxuICAgICAgdHdvOiAnMicsXHJcbiAgICAgIHRocjogJzMnLFxyXG4gICAgICBmb3U6ICc0JyxcclxuICB9XHJcbiAgY29uc29sZS5sb2cobG9sKVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufSIsICJtb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcclxuICBjb25zdCBoZWxsbyA9ICdnbG9iYWwnXHJcblxyXG4gIHdpbmRvdy5taXRtLm1hY3JvcyA9IHtnbG9iYWw6IGhlbGxvfVxyXG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3NcclxufVxyXG4iLCAiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbn1cbndpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgfSwgMTAwMClcclxufVxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59XG53aW5kb3cubWl0bS5fbWFjcm9zXyA9ICgpID0+IHtcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge31cbn1cbndpbmRvdy5fd3NfY29ubmVjdC5tYWNyb3NPbk1vdW50ID0gZGF0YSA9PiB7XG4gIGNvbnNvbGUubG9nKCdtYWNyb3MgY29kZSBleGVjdXRlZCBhZnRlciB3cyBvcGVuJywgZGF0YSlcbn1cbmNvbnN0IHttYWNyb3N9ID0gd2luZG93Lm1pdG1cbmxldCBfYm9keTEgPSByZXF1aXJlKCcuL21hY3JvcycpXG5pZiAodHlwZW9mIF9ib2R5MT09PSdmdW5jdGlvbicpIHsgXG4gIF9ib2R5MSA9IF9ib2R5MSgpXG59XG5sZXQgX2JvZHkyID0gcmVxdWlyZSgnLi9oaUBtYWNyb3MuanMnKVxuaWYgKHR5cGVvZiBfYm9keTI9PT0nZnVuY3Rpb24nKSB7XG4gIF9ib2R5MiA9IF9ib2R5MigpXG59XG5sZXQgZ2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vX2dsb2JhbF8vX21hY3Jvc18vbWFjcm9zJylcbmlmICh0eXBlb2YgZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyBcbiAgZ2xvYmFsID0gZ2xvYmFsKClcbn1cbndpbmRvdy5taXRtLm1hY3JvcyA9IHtcbiAgLi4uZ2xvYmFsLFxuICAuLi5tYWNyb3MsXG4gIC4uLl9ib2R5MSxcbiAgLi4uX2JvZHkyXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxRQUFRO0FBQ2QsYUFBTztBQUFBLFFBQ0wsTUFBTTtBQUNKLGtCQUFRLElBQUk7QUFDWixpQkFBTyxLQUFLLFlBQVk7QUFBQSxZQUN0QixPQUFTO0FBQ1Asc0JBQVEsSUFBSTtBQUNaLG9CQUFNO0FBQUE7QUFBQTtBQUdWLGlCQUFPLEtBQUssY0FBYztBQUFBLFlBQ3hCLGVBQWU7QUFDYixzQkFBUSxJQUFJO0FBQ1oscUJBQU87QUFBQSxnQkFDTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFLUixNQUFNO0FBQUE7QUFBQTtBQUFBOzs7QUNwQlY7QUFBQSxRQUFNLFFBQVE7QUFDZCxZQUFRLElBQUk7QUFDWixXQUFPLFVBQVU7QUFBQTs7O0FDRmpCO0FBQUEsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxNQUFNO0FBQ1osWUFBTSxRQUFRO0FBRWQsYUFBTyxLQUFLLFNBQVM7QUFBQSxRQUNqQixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUE7QUFFVCxjQUFRLElBQUk7QUFDWixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ1hyQjtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUVkLGFBQU8sS0FBSyxTQUFTLENBQUMsUUFBUTtBQUM5QixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ0ZyQixNQUFJLE9BQU8sZ0JBQWMsUUFBVztBQUNsQyxXQUFPLGNBQWM7QUFBQTtBQUV2QixTQUFPLEtBQUssR0FBRyxZQUFZLE1BQU07QUFDL0IsZUFBVyxNQUFNO0FBQ2YsZUFBUyxjQUFjLGlCQUFpQjtBQUFBLE9BQ3ZDO0FBQUE7QUFFTCxTQUFPLEtBQUssR0FBRyxVQUFVLFNBQU87QUFDOUIsV0FBTyxLQUFLLFlBQVksNEJBQ25CLE9BQU8sS0FBSyxZQUNaO0FBQUE7QUFHUCxTQUFPLEtBQUssV0FBVyxNQUFNO0FBQzNCLFdBQU8sS0FBSyxZQUFZO0FBQUE7QUFFMUIsU0FBTyxZQUFZLGdCQUFnQixVQUFRO0FBQ3pDLFlBQVEsSUFBSSxzQ0FBc0M7QUFBQTtBQUVwRCxNQUFNLENBQUMsVUFBVSxPQUFPO0FBQ3hCLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsTUFBSSxTQUFTO0FBQ2IsTUFBSSxPQUFPLFdBQVMsWUFBWTtBQUM5QixhQUFTO0FBQUE7QUFFWCxNQUFJLFNBQVM7QUFDYixNQUFJLE9BQU8sV0FBUyxZQUFZO0FBQzlCLGFBQVM7QUFBQTtBQUVYLFNBQU8sS0FBSyxTQUFTLG9EQUNoQixTQUNBLFNBQ0EsU0FDQTsiLAogICJuYW1lcyI6IFtdCn0K
