var app = (function () {
  'use strict';

  var macros$1 = () => {

    return {
      '/'() {
        const node = document.querySelector('style.mitm-class');
        node.innerText += `
      [data-testid="placementTracking"] {
        display: none !important;
      }
      `;
      }
    }
  };

  // [Ctrl] + [Alt] + [A] => run hotkey KeyA
  // [Ctrl] + [Shift] => Hide / Show Buttons
  const {macros} = window.mitm;
  let _body1 = macros$1;
  if (typeof _body1==='function') {
    _body1 = _body1();
  }
  let global = {};
  if (typeof global==='function') { 
    global = global();
  }
  window.mitm.macros = {
    ...global,
    ...macros,
    ..._body1,
  };

  var build = {

  };

  return build;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjcm9zLmpzIiwic291cmNlcyI6WyIuLi9fbWFjcm9zXy9tYWNyb3MuanMiLCIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcclxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICAnLycoKSB7XHJcbiAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdzdHlsZS5taXRtLWNsYXNzJylcclxuICAgICAgbm9kZS5pbm5lclRleHQgKz0gYFxyXG4gICAgICBbZGF0YS10ZXN0aWQ9XCJwbGFjZW1lbnRUcmFja2luZ1wiXSB7XHJcbiAgICAgICAgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50O1xyXG4gICAgICB9XHJcbiAgICAgIGBcclxuICAgIH1cclxuICB9XHJcbn0iLCIvLyBbQ3RybF0gKyBbQWx0XSArIFtBXSA9PiBydW4gaG90a2V5IEtleUFcbi8vIFtDdHJsXSArIFtTaGlmdF0gPT4gSGlkZSAvIFNob3cgQnV0dG9uc1xuY29uc3Qge21hY3Jvc30gPSB3aW5kb3cubWl0bVxubGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbmlmICh0eXBlb2YgX2JvZHkxPT09J2Z1bmN0aW9uJykge1xuICBfYm9keTEgPSBfYm9keTEoKVxufVxubGV0IGdsb2JhbCA9IHt9XG5pZiAodHlwZW9mIGdsb2JhbD09PSdmdW5jdGlvbicpIHsgXG4gIGdsb2JhbCA9IGdsb2JhbCgpXG59XG53aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gIC4uLmdsb2JhbCxcbiAgLi4ubWFjcm9zLFxuICAuLi5fYm9keTEsXG59XG4iXSwibmFtZXMiOlsicmVxdWlyZSQkMCJdLCJtYXBwaW5ncyI6Ijs7O0VBQ0EsWUFBYyxHQUFHLE1BQU07QUFDdkI7RUFDQSxFQUFFLE9BQU87RUFDVCxJQUFJLEdBQUcsR0FBRztFQUNWLE1BQU0sTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsRUFBQztFQUM3RCxNQUFNLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQztBQUN6QjtBQUNBO0FBQ0E7QUFDQSxNQUFNLEVBQUM7RUFDUCxLQUFLO0VBQ0wsR0FBRztFQUNIOztFQ2JBO0VBQ0E7RUFDQSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUk7RUFDNUIsSUFBSSxNQUFNLEdBQUdBLFNBQW1CO0VBQ2hDLElBQUksT0FBTyxNQUFNLEdBQUcsVUFBVSxFQUFFO0VBQ2hDLEVBQUUsTUFBTSxHQUFHLE1BQU0sR0FBRTtFQUNuQixDQUFDO0VBQ0QsSUFBSSxNQUFNLEdBQUcsR0FBRTtFQUNmLElBQUksT0FBTyxNQUFNLEdBQUcsVUFBVSxFQUFFO0VBQ2hDLEVBQUUsTUFBTSxHQUFHLE1BQU0sR0FBRTtFQUNuQixDQUFDO0VBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUc7RUFDckIsRUFBRSxHQUFHLE1BQU07RUFDWCxFQUFFLEdBQUcsTUFBTTtFQUNYLEVBQUUsR0FBRyxNQUFNO0VBQ1g7Ozs7Ozs7Ozs7OzsifQ==
