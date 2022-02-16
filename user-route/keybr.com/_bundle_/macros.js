var app = (function () {
  'use strict';

  var build = {};

  const _c = 'color: cornflowerblue';

  const rbuttons = {
    'Right|#1445d733': async function () {
      console.log('%cMacro: Clicked on "Right" button', 'color:#bc0099');
    },
    'Two|#1445d733': async function () {
      console.log('%cMacro: Clicked on "Right" button', 'color:#bc0099');
    },
  };

  var macros$2 = () => {
    const hello = 'world';

    async function observeOnce() {
      console.log('%cMacro: execute after observer once', _c);
    }
    return {
      '/'() {
        console.log('%cMacro: olleh >< hello', _c, hello);
        const keys = {
          'code:KeyA'(_e) {
            console.log(`%cMacro: ${_e.code}`, _c, _e);
          },
          'code:{KeyA:KeyB}'(_e) {
            console.log(`%Alt w/ 2 keys: ${_e.code}`, _c, _e);
          },
          'key:hi'(_e) {
            const {fn,svelte} = window.mitm;
            fn.svelte(svelte.App, 'ElectricLavender');
          },
          'code:Enter'(_e) {
            console.log(`%cPress Enter: ${_e.code}`, _c, _e);
          },
          'key:us'(_e) {
            console.log(`%cUS Country`, _c, _e);
          },
          'key:u'(_e) {
            console.log(`%cU Char`, _c, _e);
          }
        };
        keys['code:KeyA'       ]._title = 'this is KeyA';
        keys['key:hi'          ]._title = 'Show Svelte App';
        keys['code:{KeyA:KeyB}']._title = 'this is {KeyA}';
        keys['code:Enter'      ]._title = 'this is Enter';
        keys['key:us'          ]._title = 'this is us';
        keys['key:u'           ]._title = 'this is u';

        window.mitm.fn.hotKeys (keys);
        window.mitm.autofill = ['input[type="password"] => password'];
        window.mitm.autobuttons  = rbuttons;
        window.mitm.rightbuttons = rbuttons;
        window.mitm.leftbuttons  = rbuttons;
        return observeOnce
      },
      zero: '0'
    }
  };

  var macros$1 = () => {
    const hello = 'global';

    window.mitm.macros = {global: hello};
    return window.mitm.macros
  };

  // [Ctrl] + [Alt] + [A] => run hotkey KeyA
  // [Ctrl] + [Shift] => Hide / Show Buttons
  const {macros} = window.mitm;
  let _body1 = macros$2;
  if (typeof _body1==='function') {
    _body1 = _body1();
  }
  let global = macros$1;
  if (typeof global==='function') { 
    global = global();
  }
  window.mitm.macros = {
    ...global,
    ...macros,
    ..._body1,
  };

  return build;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjcm9zLmpzIiwic291cmNlcyI6WyIuLi9fbWFjcm9zXy9tYWNyb3MuanMiLCIuLi8uLi9fZ2xvYmFsXy9fbWFjcm9zXy9tYWNyb3MuanMiLCIuLi9fbWFjcm9zXy9idWlsZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBfYyA9ICdjb2xvcjogY29ybmZsb3dlcmJsdWUnXG5cbmNvbnN0IHJidXR0b25zID0ge1xuICAnUmlnaHR8IzE0NDVkNzMzJzogYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCclY01hY3JvOiBDbGlja2VkIG9uIFwiUmlnaHRcIiBidXR0b24nLCAnY29sb3I6I2JjMDA5OScpXG4gIH0sXG4gICdUd298IzE0NDVkNzMzJzogYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCclY01hY3JvOiBDbGlja2VkIG9uIFwiUmlnaHRcIiBidXR0b24nLCAnY29sb3I6I2JjMDA5OScpXG4gIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCBoZWxsbyA9ICd3b3JsZCdcblxuICBhc3luYyBmdW5jdGlvbiBvYnNlcnZlT25jZSgpIHtcbiAgICBjb25zb2xlLmxvZygnJWNNYWNybzogZXhlY3V0ZSBhZnRlciBvYnNlcnZlciBvbmNlJywgX2MpXG4gIH1cbiAgcmV0dXJuIHtcbiAgICAnLycoKSB7XG4gICAgICBjb25zb2xlLmxvZygnJWNNYWNybzogb2xsZWggPjwgaGVsbG8nLCBfYywgaGVsbG8pXG4gICAgICBjb25zdCBrZXlzID0ge1xuICAgICAgICAnY29kZTpLZXlBJyhfZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAlY01hY3JvOiAke19lLmNvZGV9YCwgX2MsIF9lKVxuICAgICAgICB9LFxuICAgICAgICAnY29kZTp7S2V5QTpLZXlCfScoX2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJUFsdCB3LyAyIGtleXM6ICR7X2UuY29kZX1gLCBfYywgX2UpXG4gICAgICAgIH0sXG4gICAgICAgICdrZXk6aGknKF9lKSB7XG4gICAgICAgICAgY29uc3Qge2ZuLHN2ZWx0ZX0gPSB3aW5kb3cubWl0bVxuICAgICAgICAgIGZuLnN2ZWx0ZShzdmVsdGUuQXBwLCAnRWxlY3RyaWNMYXZlbmRlcicpXG4gICAgICAgIH0sXG4gICAgICAgICdjb2RlOkVudGVyJyhfZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1ByZXNzIEVudGVyOiAke19lLmNvZGV9YCwgX2MsIF9lKVxuICAgICAgICB9LFxuICAgICAgICAna2V5OnVzJyhfZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1VTIENvdW50cnlgLCBfYywgX2UpXG4gICAgICAgIH0sXG4gICAgICAgICdrZXk6dScoX2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgJWNVIENoYXJgLCBfYywgX2UpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGtleXNbJ2NvZGU6S2V5QScgICAgICAgXS5fdGl0bGUgPSAndGhpcyBpcyBLZXlBJ1xuICAgICAga2V5c1sna2V5OmhpJyAgICAgICAgICBdLl90aXRsZSA9ICdTaG93IFN2ZWx0ZSBBcHAnXG4gICAgICBrZXlzWydjb2RlOntLZXlBOktleUJ9J10uX3RpdGxlID0gJ3RoaXMgaXMge0tleUF9J1xuICAgICAga2V5c1snY29kZTpFbnRlcicgICAgICBdLl90aXRsZSA9ICd0aGlzIGlzIEVudGVyJ1xuICAgICAga2V5c1sna2V5OnVzJyAgICAgICAgICBdLl90aXRsZSA9ICd0aGlzIGlzIHVzJ1xuICAgICAga2V5c1sna2V5OnUnICAgICAgICAgICBdLl90aXRsZSA9ICd0aGlzIGlzIHUnXG5cbiAgICAgIHdpbmRvdy5taXRtLmZuLmhvdEtleXMgKGtleXMpXG4gICAgICB3aW5kb3cubWl0bS5hdXRvZmlsbCA9IFsnaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdID0+IHBhc3N3b3JkJ11cbiAgICAgIHdpbmRvdy5taXRtLmF1dG9idXR0b25zICA9IHJidXR0b25zXG4gICAgICB3aW5kb3cubWl0bS5yaWdodGJ1dHRvbnMgPSByYnV0dG9uc1xuICAgICAgd2luZG93Lm1pdG0ubGVmdGJ1dHRvbnMgID0gcmJ1dHRvbnNcbiAgICAgIHJldHVybiBvYnNlcnZlT25jZVxuICAgIH0sXG4gICAgemVybzogJzAnXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuICBjb25zdCBoZWxsbyA9ICdnbG9iYWwnXG5cbiAgd2luZG93Lm1pdG0ubWFjcm9zID0ge2dsb2JhbDogaGVsbG99XG4gIHJldHVybiB3aW5kb3cubWl0bS5tYWNyb3Ncbn1cbiIsIi8vIFtDdHJsXSArIFtBbHRdICsgW0FdID0+IHJ1biBob3RrZXkgS2V5QVxuLy8gW0N0cmxdICsgW1NoaWZ0XSA9PiBIaWRlIC8gU2hvdyBCdXR0b25zXG5jb25zdCB7bWFjcm9zfSA9IHdpbmRvdy5taXRtXG5sZXQgX2JvZHkxID0gcmVxdWlyZSgnLi9tYWNyb3MnKVxuaWYgKHR5cGVvZiBfYm9keTE9PT0nZnVuY3Rpb24nKSB7XG4gIF9ib2R5MSA9IF9ib2R5MSgpXG59XG5sZXQgZ2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vX2dsb2JhbF8vX21hY3Jvc18vbWFjcm9zJylcbmlmICh0eXBlb2YgZ2xvYmFsPT09J2Z1bmN0aW9uJykgeyBcbiAgZ2xvYmFsID0gZ2xvYmFsKClcbn1cbndpbmRvdy5taXRtLm1hY3JvcyA9IHtcbiAgLi4uZ2xvYmFsLFxuICAuLi5tYWNyb3MsXG4gIC4uLl9ib2R5MSxcbn1cbiJdLCJuYW1lcyI6WyJtYWNyb3MiLCJyZXF1aXJlJCQwIiwicmVxdWlyZSQkMSJdLCJtYXBwaW5ncyI6Ijs7Ozs7RUFBQSxNQUFNLEVBQUUsR0FBRyx3QkFBdUI7QUFDbEM7RUFDQSxNQUFNLFFBQVEsR0FBRztFQUNqQixFQUFFLGlCQUFpQixFQUFFLGtCQUFrQjtFQUN2QyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0NBQW9DLEVBQUUsZUFBZSxFQUFDO0VBQ3RFLEdBQUc7RUFDSCxFQUFFLGVBQWUsRUFB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
