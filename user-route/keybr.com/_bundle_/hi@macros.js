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
    var rbuttons = {
      "right1|yellow"() {
        console.log("right");
      },
      "download-right|yellow"() {
        console.log("right");
      }
    };
    var lbuttons = {
      "left1|yellow"() {
        console.log("left");
      },
      "left2|yellow"() {
        console.log("left");
      },
      "left3|yellow"() {
        console.log("left");
      }
    };
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
          window.mitm.autofill = ['input[type="password"] => password'];
          window.mitm.rightbuttons = rbuttons;
          window.mitm.autobuttons = rbuttons;
          window.mitm.leftbuttons = lbuttons;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uL19tYWNyb3NfL3Rlc3QuanMiLCAiLi4vX21hY3Jvc18vaGlAbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9oaUBidWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgcmJ1dHRvbnMgPSB7XHJcbiAgJ3JpZ2h0MXx5ZWxsb3cnKCkge1xyXG4gICAgY29uc29sZS5sb2coJ3JpZ2h0JylcclxuICB9LFxyXG4gICdkb3dubG9hZC1yaWdodHx5ZWxsb3cnKCkge1xyXG4gICAgY29uc29sZS5sb2coJ3JpZ2h0JylcclxuICB9LFxyXG59XHJcbmNvbnN0IGxidXR0b25zID0ge1xyXG4gICdsZWZ0MXx5ZWxsb3cnKCkge1xyXG4gICAgY29uc29sZS5sb2coJ2xlZnQnKVxyXG4gIH0sXHJcbiAgJ2xlZnQyfHllbGxvdycoKSB7XHJcbiAgICBjb25zb2xlLmxvZygnbGVmdCcpXHJcbiAgfSxcclxuICAnbGVmdDN8eWVsbG93JygpIHtcclxuICAgIGNvbnNvbGUubG9nKCdsZWZ0JylcclxuICB9LFxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGhlbGxvID0gJ3dvcmxkJ1xyXG4gIHJldHVybiB7XHJcbiAgICAnLycoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdvbGFoJylcclxuICAgICAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgICAgICdLZXlBJygpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdLZXlBJylcclxuICAgICAgICAgIGFsZXJ0KCdBbGVydCBLZXlBJylcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgd2luZG93Lm1pdG0uYXV0b2ZpbGwgPSBbJ2lucHV0W3R5cGU9XCJwYXNzd29yZFwiXSA9PiBwYXNzd29yZCddXHJcbiAgICAgIHdpbmRvdy5taXRtLnJpZ2h0YnV0dG9ucyA9IHJidXR0b25zXHJcbiAgICAgIHdpbmRvdy5taXRtLmF1dG9idXR0b25zICA9IHJidXR0b25zXHJcbiAgICAgIHdpbmRvdy5taXRtLmxlZnRidXR0b25zICA9IGxidXR0b25zXHJcbiAgICB9LFxyXG4gICAgemVybzogJzAnXHJcbiAgfVxyXG59IiwgImNvbnN0IGRvZG9sID0gJ2xpcHJldCdcclxuY29uc29sZS5sb2coZG9kb2wpXHJcbm1vZHVsZS5leHBvcnRzID0gZG9kb2xcclxuIiwgIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGxvbCA9IHJlcXVpcmUoJy4vdGVzdCcpXHJcbiAgY29uc3QgaGVsbG8gPSAnaGkgbWFjcm9zJ1xyXG5cclxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7XHJcbiAgICAgIG9uZTogJzEnLFxyXG4gICAgICB0d286ICcyJyxcclxuICAgICAgdGhyOiAnMycsXHJcbiAgICAgIGZvdTogJzQnLFxyXG4gIH1cclxuICBjb25zb2xlLmxvZyhsb2wpXHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLm1hY3Jvc1xyXG59IiwgIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGhlbGxvID0gJ2dsb2JhbCdcclxuXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge2dsb2JhbDogaGVsbG99XHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLm1hY3Jvc1xyXG59XHJcbiIsICIvLyBbQ3RybF0gKyBbQWx0XSArIFtBXSA9PiBydW4gaG90a2V5IEtleUFcbi8vIFtDdHJsXSArIFtTaGlmdF0gPT4gSGlkZSAvIFNob3cgQnV0dG9uc1xuaWYgKHdpbmRvdy5fd3NfY29ubmVjdD09PXVuZGVmaW5lZCkge1xuICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxufVxud2luZG93Lm1pdG0uZm4uZ2V0Q29va2llID0gZnVuY3Rpb24gZ2V0Q29va2llKG5hbWUpIHtcclxuICBjb25zdCB2YWx1ZSA9IGA7ICR7ZG9jdW1lbnQuY29va2llfWA7XHJcbiAgY29uc3QgcGFydHMgPSB2YWx1ZS5zcGxpdChgOyAke25hbWV9PWApO1xyXG4gIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIHJldHVybiBwYXJ0cy5wb3AoKS5zcGxpdCgnOycpLnNoaWZ0KCk7XHJcbn1cbndpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgfSwgMTAwMClcclxufVxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59XG53aW5kb3cubWl0bS5fbWFjcm9zXyA9ICgpID0+IHtcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge31cbn1cbndpbmRvdy5fd3NfY29ubmVjdC5tYWNyb3NPbk1vdW50ID0gZGF0YSA9PiB7XG4gIGNvbnNvbGUubG9nKCdtYWNyb3MgY29kZSBleGVjdXRlZCBhZnRlciB3cyBvcGVuJywgZGF0YSlcbn1cbmNvbnN0IHttYWNyb3N9ID0gd2luZG93Lm1pdG1cbmxldCBfYm9keTEgPSByZXF1aXJlKCcuL21hY3JvcycpXG5pZiAodHlwZW9mIF9ib2R5MT09PSdmdW5jdGlvbicpIHsgXG4gIF9ib2R5MSA9IF9ib2R5MSgpXG59XG5sZXQgX2JvZHkyID0gcmVxdWlyZSgnLi9oaUBtYWNyb3MuanMnKVxuaWYgKHR5cGVvZiBfYm9keTI9PT0nZnVuY3Rpb24nKSB7XG4gIF9ib2R5MiA9IF9ib2R5MigpXG59XG5sZXQgZ2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vX2dsb2JhbF8vX21hY3Jvc18vbWFjcm9zJylcbmlmICh0eXBlb2YgZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyBcbiAgZ2xvYmFsID0gZ2xvYmFsKClcbn1cbndpbmRvdy5taXRtLm1hY3JvcyA9IHtcbiAgLi4uZ2xvYmFsLFxuICAuLi5tYWNyb3MsXG4gIC4uLl9ib2R5MSxcbiAgLi4uX2JvZHkyXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsUUFBTSxXQUFXO0FBQUEsTUFDZixrQkFBa0I7QUFDaEIsZ0JBQVEsSUFBSTtBQUFBO0FBQUEsTUFFZCwwQkFBMEI7QUFDeEIsZ0JBQVEsSUFBSTtBQUFBO0FBQUE7QUFHaEIsUUFBTSxXQUFXO0FBQUEsTUFDZixpQkFBaUI7QUFDZixnQkFBUSxJQUFJO0FBQUE7QUFBQSxNQUVkLGlCQUFpQjtBQUNmLGdCQUFRLElBQUk7QUFBQTtBQUFBLE1BRWQsaUJBQWlCO0FBQ2YsZ0JBQVEsSUFBSTtBQUFBO0FBQUE7QUFHaEIsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxRQUFRO0FBQ2QsYUFBTztBQUFBLFFBQ0wsTUFBTTtBQUNKLGtCQUFRLElBQUk7QUFDWixpQkFBTyxLQUFLLFlBQVk7QUFBQSxZQUN0QixPQUFTO0FBQ1Asc0JBQVEsSUFBSTtBQUNaLG9CQUFNO0FBQUE7QUFBQTtBQUdWLGlCQUFPLEtBQUssV0FBVyxDQUFDO0FBQ3hCLGlCQUFPLEtBQUssZUFBZTtBQUMzQixpQkFBTyxLQUFLLGNBQWU7QUFDM0IsaUJBQU8sS0FBSyxjQUFlO0FBQUE7QUFBQSxRQUU3QixNQUFNO0FBQUE7QUFBQTtBQUFBOzs7QUNuQ1Y7QUFBQSxRQUFNLFFBQVE7QUFDZCxZQUFRLElBQUk7QUFDWixXQUFPLFVBQVU7QUFBQTs7O0FDRmpCO0FBQUEsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxNQUFNO0FBQ1osWUFBTSxRQUFRO0FBRWQsYUFBTyxLQUFLLFNBQVM7QUFBQSxRQUNqQixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUE7QUFFVCxjQUFRLElBQUk7QUFDWixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ1hyQjtBQUFBLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUVkLGFBQU8sS0FBSyxTQUFTLENBQUMsUUFBUTtBQUM5QixhQUFPLE9BQU8sS0FBSztBQUFBO0FBQUE7OztBQ0ZyQixNQUFJLE9BQU8sZ0JBQWMsUUFBVztBQUNsQyxXQUFPLGNBQWM7QUFBQTtBQUV2QixTQUFPLEtBQUssR0FBRyxZQUFZLG1CQUFtQixNQUFNO0FBQ2xELFVBQU0sUUFBUSxLQUFLLFNBQVM7QUFDNUIsVUFBTSxRQUFRLE1BQU0sTUFBTSxLQUFLO0FBQy9CLFFBQUksTUFBTSxXQUFXO0FBQUcsYUFBTyxNQUFNLE1BQU0sTUFBTSxLQUFLO0FBQUE7QUFFeEQsU0FBTyxLQUFLLEdBQUcsWUFBWSxNQUFNO0FBQy9CLGVBQVcsTUFBTTtBQUNmLGVBQVMsY0FBYyxpQkFBaUI7QUFBQSxPQUN2QztBQUFBO0FBRUwsU0FBTyxLQUFLLEdBQUcsVUFBVSxTQUFPO0FBQzlCLFdBQU8sS0FBSyxZQUFZLDRCQUNuQixPQUFPLEtBQUssWUFDWjtBQUFBO0FBR1AsU0FBTyxLQUFLLFdBQVcsTUFBTTtBQUMzQixXQUFPLEtBQUssWUFBWTtBQUFBO0FBRTFCLFNBQU8sWUFBWSxnQkFBZ0IsVUFBUTtBQUN6QyxZQUFRLElBQUksc0NBQXNDO0FBQUE7QUFFcEQsTUFBTSxDQUFDLFVBQVUsT0FBTztBQUN4QixNQUFJLFNBQVM7QUFDYixNQUFJLE9BQU8sV0FBUyxZQUFZO0FBQzlCLGFBQVM7QUFBQTtBQUVYLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsTUFBSSxTQUFTO0FBQ2IsTUFBSSxPQUFPLFdBQVMsWUFBWTtBQUM5QixhQUFTO0FBQUE7QUFFWCxTQUFPLEtBQUssU0FBUyxvREFDaEIsU0FDQSxTQUNBLFNBQ0E7IiwKICAibmFtZXMiOiBbXQp9Cg==
