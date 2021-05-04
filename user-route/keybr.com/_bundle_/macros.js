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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vX21hY3Jvc18vbWFjcm9zLmpzIiwgIi4uLy4uL19nbG9iYWxfL19tYWNyb3NfL21hY3Jvcy5qcyIsICIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgcmJ1dHRvbnMgPSB7XHJcbiAgJ3JpZ2h0MXx5ZWxsb3cnKCkge1xyXG4gICAgY29uc29sZS5sb2coJ3JpZ2h0JylcclxuICB9LFxyXG4gICdkb3dubG9hZC1yaWdodHx5ZWxsb3cnKCkge1xyXG4gICAgY29uc29sZS5sb2coJ3JpZ2h0JylcclxuICB9LFxyXG59XHJcbmNvbnN0IGxidXR0b25zID0ge1xyXG4gICdsZWZ0MXx5ZWxsb3cnKCkge1xyXG4gICAgY29uc29sZS5sb2coJ2xlZnQnKVxyXG4gIH0sXHJcbiAgJ2xlZnQyfHllbGxvdycoKSB7XHJcbiAgICBjb25zb2xlLmxvZygnbGVmdCcpXHJcbiAgfSxcclxuICAnbGVmdDN8eWVsbG93JygpIHtcclxuICAgIGNvbnNvbGUubG9nKCdsZWZ0JylcclxuICB9LFxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGhlbGxvID0gJ3dvcmxkJ1xyXG4gIHJldHVybiB7XHJcbiAgICAnLycoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdvbGFoJylcclxuICAgICAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgICAgICdLZXlBJygpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKCdLZXlBJylcclxuICAgICAgICAgIGFsZXJ0KCdBbGVydCBLZXlBJylcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgd2luZG93Lm1pdG0uYXV0b2ZpbGwgPSBbJ2lucHV0W3R5cGU9XCJwYXNzd29yZFwiXSA9PiBwYXNzd29yZCddXHJcbiAgICAgIHdpbmRvdy5taXRtLnJpZ2h0YnV0dG9ucyA9IHJidXR0b25zXHJcbiAgICAgIHdpbmRvdy5taXRtLmF1dG9idXR0b25zICA9IHJidXR0b25zXHJcbiAgICAgIHdpbmRvdy5taXRtLmxlZnRidXR0b25zICA9IGxidXR0b25zXHJcbiAgICB9LFxyXG4gICAgemVybzogJzAnXHJcbiAgfVxyXG59IiwgIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGhlbGxvID0gJ2dsb2JhbCdcclxuXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge2dsb2JhbDogaGVsbG99XHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLm1hY3Jvc1xyXG59XHJcbiIsICIvLyBbQ3RybF0gKyBbQWx0XSArIFtBXSA9PiBydW4gaG90a2V5IEtleUFcbi8vIFtDdHJsXSArIFtTaGlmdF0gPT4gSGlkZSAvIFNob3cgQnV0dG9uc1xuaWYgKHdpbmRvdy5fd3NfY29ubmVjdD09PXVuZGVmaW5lZCkge1xuICB3aW5kb3cuX3dzX2Nvbm5lY3QgPSB7fVxufVxud2luZG93Lm1pdG0uZm4uZ2V0Q29va2llID0gZnVuY3Rpb24gZ2V0Q29va2llKG5hbWUpIHtcclxuICBjb25zdCB2YWx1ZSA9IGA7ICR7ZG9jdW1lbnQuY29va2llfWA7XHJcbiAgY29uc3QgcGFydHMgPSB2YWx1ZS5zcGxpdChgOyAke25hbWV9PWApO1xyXG4gIGlmIChwYXJ0cy5sZW5ndGggPT09IDIpIHJldHVybiBwYXJ0cy5wb3AoKS5zcGxpdCgnOycpLnNoaWZ0KCk7XHJcbn1cbndpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgfSwgMTAwMClcclxufVxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59XG53aW5kb3cubWl0bS5fbWFjcm9zXyA9ICgpID0+IHtcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge31cbn1cbndpbmRvdy5fd3NfY29ubmVjdC5tYWNyb3NPbk1vdW50ID0gZGF0YSA9PiB7XG4gIGNvbnNvbGUubG9nKCdtYWNyb3MgY29kZSBleGVjdXRlZCBhZnRlciB3cyBvcGVuJywgZGF0YSlcbn1cbmNvbnN0IHttYWNyb3N9ID0gd2luZG93Lm1pdG1cbmxldCBfYm9keTEgPSByZXF1aXJlKCcuL21hY3JvcycpXG5pZiAodHlwZW9mIF9ib2R5MT09PSdmdW5jdGlvbicpIHtcbiAgX2JvZHkxID0gX2JvZHkxKClcbn1cbmxldCBnbG9iYWwgPSByZXF1aXJlKCcuLi8uLi9fZ2xvYmFsXy9fbWFjcm9zXy9tYWNyb3MnKVxuaWYgKHR5cGVvZiBnbG9iYWw9PT0nZnVuY3Rpb24nKSB7IFxuICBnbG9iYWwgPSBnbG9iYWwoKVxufVxud2luZG93Lm1pdG0ubWFjcm9zID0ge1xuICAuLi5nbG9iYWwsXG4gIC4uLm1hY3JvcyxcbiAgLi4uX2JvZHkxLFxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBLFFBQU0sV0FBVztBQUFBLE1BQ2Ysa0JBQWtCO0FBQ2hCLGdCQUFRLElBQUk7QUFBQTtBQUFBLE1BRWQsMEJBQTBCO0FBQ3hCLGdCQUFRLElBQUk7QUFBQTtBQUFBO0FBR2hCLFFBQU0sV0FBVztBQUFBLE1BQ2YsaUJBQWlCO0FBQ2YsZ0JBQVEsSUFBSTtBQUFBO0FBQUEsTUFFZCxpQkFBaUI7QUFDZixnQkFBUSxJQUFJO0FBQUE7QUFBQSxNQUVkLGlCQUFpQjtBQUNmLGdCQUFRLElBQUk7QUFBQTtBQUFBO0FBR2hCLFdBQU8sVUFBVSxNQUFNO0FBQ3JCLFlBQU0sUUFBUTtBQUNkLGFBQU87QUFBQSxRQUNMLE1BQU07QUFDSixrQkFBUSxJQUFJO0FBQ1osaUJBQU8sS0FBSyxZQUFZO0FBQUEsWUFDdEIsT0FBUztBQUNQLHNCQUFRLElBQUk7QUFDWixvQkFBTTtBQUFBO0FBQUE7QUFHVixpQkFBTyxLQUFLLFdBQVcsQ0FBQztBQUN4QixpQkFBTyxLQUFLLGVBQWU7QUFDM0IsaUJBQU8sS0FBSyxjQUFlO0FBQzNCLGlCQUFPLEtBQUssY0FBZTtBQUFBO0FBQUEsUUFFN0IsTUFBTTtBQUFBO0FBQUE7QUFBQTs7O0FDbkNWO0FBQUEsV0FBTyxVQUFVLE1BQU07QUFDckIsWUFBTSxRQUFRO0FBRWQsYUFBTyxLQUFLLFNBQVMsQ0FBQyxRQUFRO0FBQzlCLGFBQU8sT0FBTyxLQUFLO0FBQUE7QUFBQTs7O0FDRnJCLE1BQUksT0FBTyxnQkFBYyxRQUFXO0FBQ2xDLFdBQU8sY0FBYztBQUFBO0FBRXZCLFNBQU8sS0FBSyxHQUFHLFlBQVksbUJBQW1CLE1BQU07QUFDbEQsVUFBTSxRQUFRLEtBQUssU0FBUztBQUM1QixVQUFNLFFBQVEsTUFBTSxNQUFNLEtBQUs7QUFDL0IsUUFBSSxNQUFNLFdBQVc7QUFBRyxhQUFPLE1BQU0sTUFBTSxNQUFNLEtBQUs7QUFBQTtBQUV4RCxTQUFPLEtBQUssR0FBRyxZQUFZLE1BQU07QUFDL0IsZUFBVyxNQUFNO0FBQ2YsZUFBUyxjQUFjLGlCQUFpQjtBQUFBLE9BQ3ZDO0FBQUE7QUFFTCxTQUFPLEtBQUssR0FBRyxVQUFVLFNBQU87QUFDOUIsV0FBTyxLQUFLLFlBQVksNEJBQ25CLE9BQU8sS0FBSyxZQUNaO0FBQUE7QUFHUCxTQUFPLEtBQUssV0FBVyxNQUFNO0FBQzNCLFdBQU8sS0FBSyxZQUFZO0FBQUE7QUFFMUIsU0FBTyxZQUFZLGdCQUFnQixVQUFRO0FBQ3pDLFlBQVEsSUFBSSxzQ0FBc0M7QUFBQTtBQUVwRCxNQUFNLENBQUMsVUFBVSxPQUFPO0FBQ3hCLE1BQUksU0FBUztBQUNiLE1BQUksT0FBTyxXQUFTLFlBQVk7QUFDOUIsYUFBUztBQUFBO0FBRVgsTUFBSSxTQUFTO0FBQ2IsTUFBSSxPQUFPLFdBQVMsWUFBWTtBQUM5QixhQUFTO0FBQUE7QUFFWCxTQUFPLEtBQUssU0FBUyx3Q0FDaEIsU0FDQSxTQUNBOyIsCiAgIm5hbWVzIjogW10KfQo=
