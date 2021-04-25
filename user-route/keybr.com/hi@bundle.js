(function () {
    'use strict';

    const dodol = 'lipret';
    console.log(dodol);
    var test = dodol;

    window.mitm.macros = {
        one: '1',
        two: '2'
    };
    console.log(test);

    var hi_macros = {

    };

    var macros$1 = () => {
      const hello = 'global';

      window.mitm.macros = {global: hello};
      return window.mitm.macros
    };

    window.mitm.macros = {
      '/'() {
        console.log('olah');
        window.mitm.macrokeys = {
          'KeyA'() {
            console.log('KeyA');
            alert('Alert KeyA');
          }
        };
        window.mitm.autobuttons = {
          'one|yellow'() {
            console.log('one');
            return [
              'input[type="password"] => password'
            ]
          },
        };
      },
      zero: '0'
    };

    var macros = /*#__PURE__*/Object.freeze({
        __proto__: null
    });

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    var require$$2 = /*@__PURE__*/getAugmentedNamespace(macros);

    // [Ctrl] + [Alt] + [A] => run hotkey KeyA
    // [Ctrl] + [Shift] => Hide / Show Buttons
    if (window._ws_connect===undefined) {
      window._ws_connect = {};
    }
    window.mitm.fn.autoclick = () => {
      setTimeout(() => {
        document.querySelector('.btn-autofill').click();
      }, 1000);
    };

    window.mitm.fn.hotKeys = obj => {
      window.mitm.macrokeys = {
        ...window.mitm.macrokeys,
        ...obj
      };
    };

    window.mitm._macros_ = () => {
      window.mitm.macrokeys = {};
    };

    window._ws_connect.macrosOnMount = data => {
      console.log('macros code executed after ws open', data);
    };

    (function(global, macro1) {
      // file: hi@macros.js
      let _body2 = hi_macros;
      if (typeof _body2==='function') {
        _body1 = _body2();
      }
      // macros.js + hi@macros.js
      const {macros: macro2} = window.mitm;
      window.mitm.macros = {
        ...global,
        ...macro1,
        ...macro2,
      };
    })((function() {
      // file: _global_/macros.js
      let _global = macros$1;
      if (typeof _global==='function') { return _global()
      } else if (_global!==undefined ) { return _global }
    })(), (function() {
      // file: macros.js
      let _body1 = require$$2;
      if (typeof _body1==='function') { return _body1()
      } else if (_body1!==undefined ) { return _body1 }
    })());

    var hi_build = {

    };

    return hi_build;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlAYnVuZGxlLmpzIiwic291cmNlcyI6WyJfbWFjcm9zXy90ZXN0LmpzIiwiaGlAbWFjcm9zLmpzIiwiLi4vX2dsb2JhbF8vbWFjcm9zLmpzIiwibWFjcm9zLmpzIiwiaGlAYnVpbGQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZG9kb2wgPSAnbGlwcmV0J1xyXG5jb25zb2xlLmxvZyhkb2RvbClcclxubW9kdWxlLmV4cG9ydHMgPSBkb2RvbFxyXG4iLCJjb25zdCBsb2wgPSByZXF1aXJlKCcuL19tYWNyb3NfL3Rlc3QnKVxyXG5jb25zdCBoZWxsbyA9ICdoaSBtYWNyb3MnXHJcblxyXG53aW5kb3cubWl0bS5tYWNyb3MgPSB7XHJcbiAgICBvbmU6ICcxJyxcclxuICAgIHR3bzogJzInXHJcbn1cclxuY29uc29sZS5sb2cobG9sKSIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGhlbGxvID0gJ2dsb2JhbCdcclxuXHJcbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge2dsb2JhbDogaGVsbG99XHJcbiAgcmV0dXJuIHdpbmRvdy5taXRtLm1hY3Jvc1xyXG59XHJcbiIsImNvbnN0IGhlbGxvID0gJ3dvcmxkJ1xyXG5cclxud2luZG93Lm1pdG0ubWFjcm9zID0ge1xyXG4gICcvJygpIHtcclxuICAgIGNvbnNvbGUubG9nKCdvbGFoJylcclxuICAgIHdpbmRvdy5taXRtLm1hY3Jva2V5cyA9IHtcclxuICAgICAgJ0tleUEnKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLZXlBJylcclxuICAgICAgICBhbGVydCgnQWxlcnQgS2V5QScpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHdpbmRvdy5taXRtLmF1dG9idXR0b25zID0ge1xyXG4gICAgICAnb25lfHllbGxvdycoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ29uZScpXHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICdpbnB1dFt0eXBlPVwicGFzc3dvcmRcIl0gPT4gcGFzc3dvcmQnXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgfVxyXG4gIH0sXHJcbiAgemVybzogJzAnXHJcbn1cclxuIiwiLy8gW0N0cmxdICsgW0FsdF0gKyBbQV0gPT4gcnVuIGhvdGtleSBLZXlBXG4vLyBbQ3RybF0gKyBbU2hpZnRdID0+IEhpZGUgLyBTaG93IEJ1dHRvbnNcbmlmICh3aW5kb3cuX3dzX2Nvbm5lY3Q9PT11bmRlZmluZWQpIHtcbiAgd2luZG93Ll93c19jb25uZWN0ID0ge31cbn07XG5cbndpbmRvdy5taXRtLmZuLmF1dG9jbGljayA9ICgpID0+IHtcclxuICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG4tYXV0b2ZpbGwnKS5jbGljaygpXHJcbiAgfSwgMTAwMClcclxufTtcblxud2luZG93Lm1pdG0uZm4uaG90S2V5cyA9IG9iaiA9PiB7XHJcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge1xyXG4gICAgLi4ud2luZG93Lm1pdG0ubWFjcm9rZXlzLFxyXG4gICAgLi4ub2JqXHJcbiAgfVxyXG59O1xuXG53aW5kb3cubWl0bS5fbWFjcm9zXyA9ICgpID0+IHtcbiAgd2luZG93Lm1pdG0ubWFjcm9rZXlzID0ge307XG59O1xuXG53aW5kb3cuX3dzX2Nvbm5lY3QubWFjcm9zT25Nb3VudCA9IGRhdGEgPT4ge1xuICBjb25zb2xlLmxvZygnbWFjcm9zIGNvZGUgZXhlY3V0ZWQgYWZ0ZXIgd3Mgb3BlbicsIGRhdGEpXG59O1xuXG4oZnVuY3Rpb24oZ2xvYmFsLCBtYWNybzEpIHtcbiAgLy8gZmlsZTogaGlAbWFjcm9zLmpzXG4gIGxldCBfYm9keTIgPSByZXF1aXJlKCcuL2hpQG1hY3Jvcy5qcycpXG4gIGlmICh0eXBlb2YgX2JvZHkyPT09J2Z1bmN0aW9uJykge1xuICAgIF9ib2R5MSA9IF9ib2R5MigpXG4gIH1cbiAgLy8gbWFjcm9zLmpzICsgaGlAbWFjcm9zLmpzXG4gIGNvbnN0IHttYWNyb3M6IG1hY3JvMn0gPSB3aW5kb3cubWl0bVxuICB3aW5kb3cubWl0bS5tYWNyb3MgPSB7XG4gICAgLi4uZ2xvYmFsLFxuICAgIC4uLm1hY3JvMSxcbiAgICAuLi5tYWNybzIsXG4gIH1cbn0pKChmdW5jdGlvbigpIHtcbiAgLy8gZmlsZTogX2dsb2JhbF8vbWFjcm9zLmpzXG4gIGxldCBfZ2xvYmFsID0gcmVxdWlyZSgnLi4vX2dsb2JhbF8vbWFjcm9zJylcbiAgaWYgKHR5cGVvZiBfZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyByZXR1cm4gX2dsb2JhbCgpXG4gIH0gZWxzZSBpZiAoX2dsb2JhbCE9PXVuZGVmaW5lZCApIHsgcmV0dXJuIF9nbG9iYWwgfVxufSkoKSwgKGZ1bmN0aW9uKCkge1xuICAvLyBmaWxlOiBtYWNyb3MuanNcbiAgbGV0IF9ib2R5MSA9IHJlcXVpcmUoJy4vbWFjcm9zJylcbiAgaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7IHJldHVybiBfYm9keTEoKVxuICB9IGVsc2UgaWYgKF9ib2R5MSE9PXVuZGVmaW5lZCApIHsgcmV0dXJuIF9ib2R5MSB9XG59KSgpKTtcbiJdLCJuYW1lcyI6WyJsb2wiLCJyZXF1aXJlJCQwIiwicmVxdWlyZSQkMSJdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsTUFBTSxLQUFLLEdBQUcsU0FBUTtJQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQztJQUNsQixRQUFjLEdBQUc7O0lDQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ3JCLElBQUksR0FBRyxFQUFFLEdBQUc7SUFDWixJQUFJLEdBQUcsRUFBRSxHQUFHO0lBQ1osRUFBQztJQUNELE9BQU8sQ0FBQyxHQUFHLENBQUNBLElBQUc7Ozs7OztJQ1BmLFlBQWMsR0FBRyxNQUFNO0lBQ3ZCLEVBQUUsTUFBTSxLQUFLLEdBQUcsU0FBUTtBQUN4QjtJQUNBLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFDO0lBQ3RDLEVB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
