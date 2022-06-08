var a11y = (function () {
  'use strict';

  var axeRun = {};

  // https://www.a11yproject.com/checklist/
  const criterionMap = {
    baseUrl: 'https://www.w3.org/WAI/WCAG21/',
    wcag111:{id:'1.1.1',desc:'Non-text Content'      ,link:'Understanding/non-text-content'      },
    wcag131:{id:'1.3.1',desc:'Info and Relationships',link:'Understanding/info-and-relationships'},
    wcag132:{id:'1.3.2',desc:'Meaningful Sequence'   ,link:'Understanding/meaningful-sequence'   },
    wcag135:{id:'1.3.5',desc:'Identify Input Purpose',link:'Understanding/identify-input-purpose'},
    wcag141:{id:'1.4.1',desc:'Use of Color'          ,link:'Understanding/use-of-color'          },
    wcag143:{id:'1.4.3',desc:'Contrast (Minimum)'    ,link:'Understanding/contrast-minimum'      },
    wcag144:{id:'1.4.4',desc:'Resize text'           ,link:'Understanding/resize-text'           },
    wcag146:{id:'1.4.6',desc:'Contrast (Enhanced)'   ,link:'Understanding/contrast-enhanced'     },
    wcag148:{id:'1.4.8',desc:'Visual Presentation'   ,link:'Understanding/visual-presentation'   },
    wcag241:{id:'2.4.1',desc:'Bypass Blocks'         ,link:'Understanding/bypass-blocks'         },
    wcag242:{id:'2.4.2',desc:'Page Titled'           ,link:'Understanding/page-titled'           },
    wcag243:{id:'2.4.3',desc:'Focus Order'           ,link:'Understanding/focus-order'           },
    wcag246:{id:'2.4.6',desc:'Headings and Labels'   ,link:'Understanding/headings-and-labels'   },
    wcag247:{id:'2.4.7',desc:'Focus Visible'         ,link:'Understanding/focus-visible'         },
    wcag311:{id:'3.1.1',desc:'Language of Page'      ,link:'Understanding/language-of-page'      },
    wcag312:{id:'3.1.2',desc:'On Input'              ,link:'Understanding/on-input'              },
    wcag331:{id:'3.3.1',desc:'Error Identification'  ,link:'Understanding/error-identification'  },
    wcag411:{id:'4.1.1',desc:'Parsing'               ,link:'Understanding/parsing'               },
    wcag412:{id:'4.1.2',desc:'Name, Role, Value'     ,link:'Understanding/name-role-value'       },
  };
  function criterion1(tags) {
    for(const tag of tags) {
      if (criterionMap[tag]) {
        const {id, desc, link} = criterionMap[tag];
        const {baseUrl=''} = criterionMap;
        return {
          name: `WCAG ${id}`,
          desc,
          link: `${baseUrl}${link}`,
        }
      }
    }
  }

  var criterion1_1 = criterion1;

  function criterion2(tags) {
    for(const tag of tags) {
      const criterionMap = mitm.routes._global_.a11y;
      if (criterionMap && criterionMap[tag]) {
        const {id, desc, link} = criterionMap[tag];
        const {baseUrl=''} = criterionMap;
        return {
          name: id, desc,
          link: `${baseUrl}${link}`,
        }
      }
    }
  }

  var criterion2_1 = criterion2;

  const _criterion1 = criterion1_1;
  const _criterion2 = criterion2_1;
  //mitm.axerun.results.violations[0].nodes[0].target
  function violationHilight$1(popup) {
    const rect = document.body.getBoundingClientRect();
    const r = mitm.axerun.results;
    iterate(r.violations, popup, rect);
    iterate(r.incomplete, popup, rect, true);
  }

  function iterate(arr, popup, {x,y}, incomplete) {
    let elNode  = {};
    for (const violation of arr) {
      const {
        description,
        helpUrl,
        impact,
        nodes,
        help,
        tags,
        id: grp, 
      } = violation;
      const tgs = tags.join(', ');
      for (const node of nodes) {
        const {html,target,all,any} = node;
        const el = document.querySelector(target);
        const dv = document.createElement('div');
        const rc = el.getClientRects()[0];
        if (rc===undefined) {
          continue
        }
        popup.appendChild(dv);
        const criterion1 = _criterion1(tags);
        const criterion2 = _criterion2(tags);
        const {top:t, left:l, width:w, height:h} = rc;
        const left= -x + l;
        const top = -y + t; 
        dv._axe_= {
          description,
          incomplete,
          criterion1,
          criterion2,
          helpUrl,
          impact,
          html,
          all,
          any,
          help,
          tgs,
          grp,
          el,
        };

        let style;
        if (grp.match(/page-/)) {
          style = `left:0;top:0;width:100vw;height:10px;`;
        } else { // check parent element is fixed so do the box
          style = `left:${left}px;top:${top}px;width:10px;height:10px;`;
          let pnode = el.parentElement;
          while (pnode && getComputedStyle(pnode).position!=='fixed') {
            pnode = pnode.parentElement;
          }
          if (pnode && getComputedStyle(pnode).position==='fixed') {
            style += 'position:fixed;';
          }
        }
        dv.style  = style;
        dv.classList.add('axe-run-violation');
        dv.classList.add(`axe-grp-${grp}`);
        
        if (tgs.includes('wcag2aaa')) {
          dv.classList.add(`axe-grp-wcag2aaa`);
        } else if (tgs.includes('best-practice')) {
          dv.classList.add(`axe-grp-best-practice`);
        }
        
        if (incomplete) {
          dv.classList.add(`axe-incomplete`);
        }
        dv.onmouseover = function(e) {
          const node   = e.target;
          if (target && elNode.target!==target) {
            document.querySelectorAll('.a11y-popup').forEach(n=>n.remove());
            const {mitm: {svelte: {A11yPopup}, fn}} = window;
            fn.svelte(A11yPopup, {popup: true, node});
            mitm.axerun.elNode = elNode;
            elNode.target = target;
            elNode.node   = node;
          }
        };
      }
    }
  }

  var violationHilight_1 = violationHilight$1;

  function getColor$1(el) {
    const {color, backgroundColor} = getComputedStyle(el);
    return [color, backgroundColor]
  }

  function _rgb(rgb) {
    const [r,g,b] = rgb.match(/\d+/g).map(x=>+x);
    return [r,g,b]
  }

  function _check(color) {
    if (color <= 0.03928) {
      return (color / 12.92)
    } else {
      return (Math.pow(((color + 0.055)/1.055), 2.4))
    }
  }

  const _hex = x => x.toString(16).padStart(2, '0');

  function rgbToHex(rgb) {
    return '#' + _rgb(rgb).map(_hex).join('')
  }

  function luminance(rgb) {
    let [r,g,b] = _rgb(rgb);
    r = 0.2126  * _check(r/255);
    g = 0.7152  * _check(g/255);
    b = 0.0722  * _check(b/255);
    return r + g + b
  }

  function contrast$1(rgbF, rgbB) {
    const luminanceF = luminance(rgbF);
    const luminanceB = luminance(rgbB);

    let lght;
    let dark;
    if (luminanceF >= luminanceB) {
      lght = luminanceF;
      dark = luminanceB;
    } else {
      lght = luminanceB;
      dark = luminanceF;
    }
    const _ratio = (
      (lght + 0.05) / 
      (dark + 0.05)
    ).toFixed(2);
    
    const f = rgbToHex(rgbF);
    const b = rgbToHex(rgbB);
    console.log([
      `f:${rgbF}-> ${f}`,
      `b:${rgbB}-> ${b}`,
      `Contrast ratio-> ${_ratio}`
    ].join('\n'));

    return _ratio
  }

  var contrast_1 = {
    getColor: getColor$1,
    contrast: contrast$1,
    rgbToHex,
    luminance,
  };

  const violationHilight = violationHilight_1;
  const {getColor, contrast} = contrast_1;
  const {fn}  = window.mitm; 
  fn.getColor = getColor;
  fn.contrast = contrast;
  const wcag2 = [
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
  ];
  const wcag3 = [
    // ...wcag2,
    'wcag2aaa',
    'wcag21aaa',
    'best-practice',
  ];
  const rulesObj = {
    'color-contrast': { enabled: true },
  };

  window.mitm.left2buttons = {
    'strict-[yyy]|lightsalmon'() {fn.axerun(wcag3, rulesObj);},
    'wcag:AA[yy-]|lightsalmon'() {fn.axerun(wcag2);},
    'a11y---[y--]|lightsalmon'() {fn.axerun(     );},
    'clear--[c--]|lightsalmon'() {clearAxes(     );},
  };

  //https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#getting-started
  window.mitm.fn.axerun = (values, rules) => { //# a11y
    console.log('a11y/axe-run!');
    const {__args} = window.mitm;
    const popup = clearAxes();
    const type  = 'tag';
    const runOpt= {};
    if (Array.isArray(values)) {
      runOpt.runOnly= {type,values};
    } else if (Array.isArray(__args.a11y)) {
      runOpt.runOnly= {type,values:__args.a11y};
    }
    if (rules) {
      runOpt.rules = rules;
    }
    // runOpt.exclude = [['.mitm-btn']]
    console.log(runOpt);
    window.axe
    .run(runOpt)
    .then(results => {
      if (results.violations.length) {
        window.mitm.axerun.results = results;
        violationHilight(popup);
        console.error('Accessibility issues found');
      }
    })
    .catch(err => {
      window.mitm.axerun.err = err;
      console.error('Something bad happened:', err);
    });
  };

  function clearAxes() {
    const popup = document.querySelector('.mitm-container.popup');
    popup.innerText = '';
    return popup
  }

  return axeRun;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXhlLXJ1bi5qcyIsInNvdXJjZXMiOlsiX2ExMXkvY3JpdGVyaW9uMS5qcyIsIl9hMTF5L2NyaXRlcmlvbjIuanMiLCJfYTExeS92aW9sYXRpb24taGlsaWdodC5qcyIsIl9hMTF5L2NvbnRyYXN0LmpzIiwiX2ExMXkvYXhlLXJ1bi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBodHRwczovL3d3dy5hMTF5cHJvamVjdC5jb20vY2hlY2tsaXN0L1xuY29uc3QgY3JpdGVyaW9uTWFwID0ge1xuICBiYXNlVXJsOiAnaHR0cHM6Ly93d3cudzMub3JnL1dBSS9XQ0FHMjEvJyxcbiAgd2NhZzExMTp7aWQ6JzEuMS4xJyxkZXNjOidOb24tdGV4dCBDb250ZW50JyAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL25vbi10ZXh0LWNvbnRlbnQnICAgICAgfSxcbiAgd2NhZzEzMTp7aWQ6JzEuMy4xJyxkZXNjOidJbmZvIGFuZCBSZWxhdGlvbnNoaXBzJyxsaW5rOidVbmRlcnN0YW5kaW5nL2luZm8tYW5kLXJlbGF0aW9uc2hpcHMnfSxcbiAgd2NhZzEzMjp7aWQ6JzEuMy4yJyxkZXNjOidNZWFuaW5nZnVsIFNlcXVlbmNlJyAgICxsaW5rOidVbmRlcnN0YW5kaW5nL21lYW5pbmdmdWwtc2VxdWVuY2UnICAgfSxcbiAgd2NhZzEzNTp7aWQ6JzEuMy41JyxkZXNjOidJZGVudGlmeSBJbnB1dCBQdXJwb3NlJyxsaW5rOidVbmRlcnN0YW5kaW5nL2lkZW50aWZ5LWlucHV0LXB1cnBvc2UnfSxcbiAgd2NhZzE0MTp7aWQ6JzEuNC4xJyxkZXNjOidVc2Ugb2YgQ29sb3InICAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL3VzZS1vZi1jb2xvcicgICAgICAgICAgfSxcbiAgd2NhZzE0Mzp7aWQ6JzEuNC4zJyxkZXNjOidDb250cmFzdCAoTWluaW11bSknICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL2NvbnRyYXN0LW1pbmltdW0nICAgICAgfSxcbiAgd2NhZzE0NDp7aWQ6JzEuNC40JyxkZXNjOidSZXNpemUgdGV4dCcgICAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL3Jlc2l6ZS10ZXh0JyAgICAgICAgICAgfSxcbiAgd2NhZzE0Njp7aWQ6JzEuNC42JyxkZXNjOidDb250cmFzdCAoRW5oYW5jZWQpJyAgICxsaW5rOidVbmRlcnN0YW5kaW5nL2NvbnRyYXN0LWVuaGFuY2VkJyAgICAgfSxcbiAgd2NhZzE0ODp7aWQ6JzEuNC44JyxkZXNjOidWaXN1YWwgUHJlc2VudGF0aW9uJyAgICxsaW5rOidVbmRlcnN0YW5kaW5nL3Zpc3VhbC1wcmVzZW50YXRpb24nICAgfSxcbiAgd2NhZzI0MTp7aWQ6JzIuNC4xJyxkZXNjOidCeXBhc3MgQmxvY2tzJyAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL2J5cGFzcy1ibG9ja3MnICAgICAgICAgfSxcbiAgd2NhZzI0Mjp7aWQ6JzIuNC4yJyxkZXNjOidQYWdlIFRpdGxlZCcgICAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL3BhZ2UtdGl0bGVkJyAgICAgICAgICAgfSxcbiAgd2NhZzI0Mzp7aWQ6JzIuNC4zJyxkZXNjOidGb2N1cyBPcmRlcicgICAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL2ZvY3VzLW9yZGVyJyAgICAgICAgICAgfSxcbiAgd2NhZzI0Njp7aWQ6JzIuNC42JyxkZXNjOidIZWFkaW5ncyBhbmQgTGFiZWxzJyAgICxsaW5rOidVbmRlcnN0YW5kaW5nL2hlYWRpbmdzLWFuZC1sYWJlbHMnICAgfSxcbiAgd2NhZzI0Nzp7aWQ6JzIuNC43JyxkZXNjOidGb2N1cyBWaXNpYmxlJyAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL2ZvY3VzLXZpc2libGUnICAgICAgICAgfSxcbiAgd2NhZzMxMTp7aWQ6JzMuMS4xJyxkZXNjOidMYW5ndWFnZSBvZiBQYWdlJyAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL2xhbmd1YWdlLW9mLXBhZ2UnICAgICAgfSxcbiAgd2NhZzMxMjp7aWQ6JzMuMS4yJyxkZXNjOidPbiBJbnB1dCcgICAgICAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL29uLWlucHV0JyAgICAgICAgICAgICAgfSxcbiAgd2NhZzMzMTp7aWQ6JzMuMy4xJyxkZXNjOidFcnJvciBJZGVudGlmaWNhdGlvbicgICxsaW5rOidVbmRlcnN0YW5kaW5nL2Vycm9yLWlkZW50aWZpY2F0aW9uJyAgfSxcbiAgd2NhZzQxMTp7aWQ6JzQuMS4xJyxkZXNjOidQYXJzaW5nJyAgICAgICAgICAgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL3BhcnNpbmcnICAgICAgICAgICAgICAgfSxcbiAgd2NhZzQxMjp7aWQ6JzQuMS4yJyxkZXNjOidOYW1lLCBSb2xlLCBWYWx1ZScgICAgICxsaW5rOidVbmRlcnN0YW5kaW5nL25hbWUtcm9sZS12YWx1ZScgICAgICAgfSxcbn1cbmZ1bmN0aW9uIGNyaXRlcmlvbjEodGFncykge1xuICBmb3IoY29uc3QgdGFnIG9mIHRhZ3MpIHtcbiAgICBpZiAoY3JpdGVyaW9uTWFwW3RhZ10pIHtcbiAgICAgIGNvbnN0IHtpZCwgZGVzYywgbGlua30gPSBjcml0ZXJpb25NYXBbdGFnXVxuICAgICAgY29uc3Qge2Jhc2VVcmw9Jyd9ID0gY3JpdGVyaW9uTWFwXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBgV0NBRyAke2lkfWAsXG4gICAgICAgIGRlc2MsXG4gICAgICAgIGxpbms6IGAke2Jhc2VVcmx9JHtsaW5rfWAsXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JpdGVyaW9uMVxuIiwiZnVuY3Rpb24gY3JpdGVyaW9uMih0YWdzKSB7XG4gIGZvcihjb25zdCB0YWcgb2YgdGFncykge1xuICAgIGNvbnN0IGNyaXRlcmlvbk1hcCA9IG1pdG0ucm91dGVzLl9nbG9iYWxfLmExMXlcbiAgICBpZiAoY3JpdGVyaW9uTWFwICYmIGNyaXRlcmlvbk1hcFt0YWddKSB7XG4gICAgICBjb25zdCB7aWQsIGRlc2MsIGxpbmt9ID0gY3JpdGVyaW9uTWFwW3RhZ11cbiAgICAgIGNvbnN0IHtiYXNlVXJsPScnfSA9IGNyaXRlcmlvbk1hcFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogaWQsIGRlc2MsXG4gICAgICAgIGxpbms6IGAke2Jhc2VVcmx9JHtsaW5rfWAsXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JpdGVyaW9uMlxuIiwiY29uc3QgX2NyaXRlcmlvbjEgPSByZXF1aXJlKCcuL2NyaXRlcmlvbjEnKVxuY29uc3QgX2NyaXRlcmlvbjIgPSByZXF1aXJlKCcuL2NyaXRlcmlvbjInKVxuLy9taXRtLmF4ZXJ1bi5yZXN1bHRzLnZpb2xhdGlvbnNbMF0ubm9kZXNbMF0udGFyZ2V0XG5mdW5jdGlvbiB2aW9sYXRpb25IaWxpZ2h0KHBvcHVwKSB7XG4gIGNvbnN0IHJlY3QgPSBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gIGNvbnN0IHIgPSBtaXRtLmF4ZXJ1bi5yZXN1bHRzXG4gIGl0ZXJhdGUoci52aW9sYXRpb25zLCBwb3B1cCwgcmVjdClcbiAgaXRlcmF0ZShyLmluY29tcGxldGUsIHBvcHVwLCByZWN0LCB0cnVlKVxufVxuXG5mdW5jdGlvbiBpdGVyYXRlKGFyciwgcG9wdXAsIHt4LHl9LCBpbmNvbXBsZXRlKSB7XG4gIGxldCBlbE5vZGUgID0ge31cbiAgZm9yIChjb25zdCB2aW9sYXRpb24gb2YgYXJyKSB7XG4gICAgY29uc3Qge1xuICAgICAgZGVzY3JpcHRpb24sXG4gICAgICBoZWxwVXJsLFxuICAgICAgaW1wYWN0LFxuICAgICAgbm9kZXMsXG4gICAgICBoZWxwLFxuICAgICAgdGFncyxcbiAgICAgIGlkOiBncnAsIFxuICAgIH0gPSB2aW9sYXRpb25cbiAgICBjb25zdCB0Z3MgPSB0YWdzLmpvaW4oJywgJylcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICAgIGNvbnN0IHtodG1sLHRhcmdldCxhbGwsYW55fSA9IG5vZGVcbiAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpXG4gICAgICBjb25zdCBkdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICBjb25zdCByYyA9IGVsLmdldENsaWVudFJlY3RzKClbMF1cbiAgICAgIGlmIChyYz09PXVuZGVmaW5lZCkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgcG9wdXAuYXBwZW5kQ2hpbGQoZHYpXG4gICAgICBjb25zdCBjcml0ZXJpb24xID0gX2NyaXRlcmlvbjEodGFncylcbiAgICAgIGNvbnN0IGNyaXRlcmlvbjIgPSBfY3JpdGVyaW9uMih0YWdzKVxuICAgICAgY29uc3Qge3RvcDp0LCBsZWZ0OmwsIHdpZHRoOncsIGhlaWdodDpofSA9IHJjXG4gICAgICBjb25zdCBsZWZ0PSAteCArIGxcbiAgICAgIGNvbnN0IHRvcCA9IC15ICsgdCBcbiAgICAgIGR2Ll9heGVfPSB7XG4gICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICBpbmNvbXBsZXRlLFxuICAgICAgICBjcml0ZXJpb24xLFxuICAgICAgICBjcml0ZXJpb24yLFxuICAgICAgICBoZWxwVXJsLFxuICAgICAgICBpbXBhY3QsXG4gICAgICAgIGh0bWwsXG4gICAgICAgIGFsbCxcbiAgICAgICAgYW55LFxuICAgICAgICBoZWxwLFxuICAgICAgICB0Z3MsXG4gICAgICAgIGdycCxcbiAgICAgICAgZWwsXG4gICAgICB9XG5cbiAgICAgIGxldCBzdHlsZVxuICAgICAgaWYgKGdycC5tYXRjaCgvcGFnZS0vKSkge1xuICAgICAgICBzdHlsZSA9IGBsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwdnc7aGVpZ2h0OjEwcHg7YFxuICAgICAgfSBlbHNlIHsgLy8gY2hlY2sgcGFyZW50IGVsZW1lbnQgaXMgZml4ZWQgc28gZG8gdGhlIGJveFxuICAgICAgICBzdHlsZSA9IGBsZWZ0OiR7bGVmdH1weDt0b3A6JHt0b3B9cHg7d2lkdGg6MTBweDtoZWlnaHQ6MTBweDtgXG4gICAgICAgIGxldCBwbm9kZSA9IGVsLnBhcmVudEVsZW1lbnRcbiAgICAgICAgd2hpbGUgKHBub2RlICYmIGdldENvbXB1dGVkU3R5bGUocG5vZGUpLnBvc2l0aW9uIT09J2ZpeGVkJykge1xuICAgICAgICAgIHBub2RlID0gcG5vZGUucGFyZW50RWxlbWVudFxuICAgICAgICB9XG4gICAgICAgIGlmIChwbm9kZSAmJiBnZXRDb21wdXRlZFN0eWxlKHBub2RlKS5wb3NpdGlvbj09PSdmaXhlZCcpIHtcbiAgICAgICAgICBzdHlsZSArPSAncG9zaXRpb246Zml4ZWQ7J1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkdi5zdHlsZSAgPSBzdHlsZVxuICAgICAgZHYuY2xhc3NMaXN0LmFkZCgnYXhlLXJ1bi12aW9sYXRpb24nKVxuICAgICAgZHYuY2xhc3NMaXN0LmFkZChgYXhlLWdycC0ke2dycH1gKVxuICAgICAgXG4gICAgICBpZiAodGdzLmluY2x1ZGVzKCd3Y2FnMmFhYScpKSB7XG4gICAgICAgIGR2LmNsYXNzTGlzdC5hZGQoYGF4ZS1ncnAtd2NhZzJhYWFgKVxuICAgICAgfSBlbHNlIGlmICh0Z3MuaW5jbHVkZXMoJ2Jlc3QtcHJhY3RpY2UnKSkge1xuICAgICAgICBkdi5jbGFzc0xpc3QuYWRkKGBheGUtZ3JwLWJlc3QtcHJhY3RpY2VgKVxuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAoaW5jb21wbGV0ZSkge1xuICAgICAgICBkdi5jbGFzc0xpc3QuYWRkKGBheGUtaW5jb21wbGV0ZWApXG4gICAgICB9XG4gICAgICBkdi5vbm1vdXNlb3ZlciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY29uc3Qgbm9kZSAgID0gZS50YXJnZXRcbiAgICAgICAgaWYgKHRhcmdldCAmJiBlbE5vZGUudGFyZ2V0IT09dGFyZ2V0KSB7XG4gICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmExMXktcG9wdXAnKS5mb3JFYWNoKG49Pm4ucmVtb3ZlKCkpXG4gICAgICAgICAgY29uc3Qge21pdG06IHtzdmVsdGU6IHtBMTF5UG9wdXB9LCBmbn19ID0gd2luZG93XG4gICAgICAgICAgZm4uc3ZlbHRlKEExMXlQb3B1cCwge3BvcHVwOiB0cnVlLCBub2RlfSlcbiAgICAgICAgICBtaXRtLmF4ZXJ1bi5lbE5vZGUgPSBlbE5vZGVcbiAgICAgICAgICBlbE5vZGUudGFyZ2V0ID0gdGFyZ2V0XG4gICAgICAgICAgZWxOb2RlLm5vZGUgICA9IG5vZGVcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB2aW9sYXRpb25IaWxpZ2h0XG4iLCJmdW5jdGlvbiBnZXRDb2xvcihlbCkge1xuICBjb25zdCB7Y29sb3IsIGJhY2tncm91bmRDb2xvcn0gPSBnZXRDb21wdXRlZFN0eWxlKGVsKVxuICByZXR1cm4gW2NvbG9yLCBiYWNrZ3JvdW5kQ29sb3JdXG59XG5cbmZ1bmN0aW9uIF9yZ2IocmdiKSB7XG4gIGNvbnN0IFtyLGcsYl0gPSByZ2IubWF0Y2goL1xcZCsvZykubWFwKHg9Pit4KVxuICByZXR1cm4gW3IsZyxiXVxufVxuXG5mdW5jdGlvbiBfY2hlY2soY29sb3IpIHtcbiAgaWYgKGNvbG9yIDw9IDAuMDM5MjgpIHtcbiAgICByZXR1cm4gKGNvbG9yIC8gMTIuOTIpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIChNYXRoLnBvdygoKGNvbG9yICsgMC4wNTUpLzEuMDU1KSwgMi40KSlcbiAgfVxufVxuXG5jb25zdCBfaGV4ID0geCA9PiB4LnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpXG5cbmZ1bmN0aW9uIHJnYlRvSGV4KHJnYikge1xuICByZXR1cm4gJyMnICsgX3JnYihyZ2IpLm1hcChfaGV4KS5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBsdW1pbmFuY2UocmdiKSB7XG4gIGxldCBbcixnLGJdID0gX3JnYihyZ2IpXG4gIHIgPSAwLjIxMjYgICogX2NoZWNrKHIvMjU1KVxuICBnID0gMC43MTUyICAqIF9jaGVjayhnLzI1NSlcbiAgYiA9IDAuMDcyMiAgKiBfY2hlY2soYi8yNTUpXG4gIHJldHVybiByICsgZyArIGJcbn1cblxuZnVuY3Rpb24gY29udHJhc3QocmdiRiwgcmdiQikge1xuICBjb25zdCBsdW1pbmFuY2VGID0gbHVtaW5hbmNlKHJnYkYpXG4gIGNvbnN0IGx1bWluYW5jZUIgPSBsdW1pbmFuY2UocmdiQilcblxuICBsZXQgbGdodFxuICBsZXQgZGFya1xuICBpZiAobHVtaW5hbmNlRiA+PSBsdW1pbmFuY2VCKSB7XG4gICAgbGdodCA9IGx1bWluYW5jZUZcbiAgICBkYXJrID0gbHVtaW5hbmNlQlxuICB9IGVsc2Uge1xuICAgIGxnaHQgPSBsdW1pbmFuY2VCXG4gICAgZGFyayA9IGx1bWluYW5jZUZcbiAgfVxuICBjb25zdCBfcmF0aW8gPSAoXG4gICAgKGxnaHQgKyAwLjA1KSAvIFxuICAgIChkYXJrICsgMC4wNSlcbiAgKS50b0ZpeGVkKDIpXG4gIFxuICBjb25zdCBmID0gcmdiVG9IZXgocmdiRilcbiAgY29uc3QgYiA9IHJnYlRvSGV4KHJnYkIpXG4gIGNvbnNvbGUubG9nKFtcbiAgICBgZjoke3JnYkZ9LT4gJHtmfWAsXG4gICAgYGI6JHtyZ2JCfS0+ICR7Yn1gLFxuICAgIGBDb250cmFzdCByYXRpby0+ICR7X3JhdGlvfWBcbiAgXS5qb2luKCdcXG4nKSlcblxuICByZXR1cm4gX3JhdGlvXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRDb2xvcixcbiAgY29udHJhc3QsXG4gIHJnYlRvSGV4LFxuICBsdW1pbmFuY2UsXG59XG4iLCJjb25zdCB2aW9sYXRpb25IaWxpZ2h0ID0gcmVxdWlyZSgnLi92aW9sYXRpb24taGlsaWdodCcpXG5jb25zdCB7Z2V0Q29sb3IsIGNvbnRyYXN0fSA9IHJlcXVpcmUoJy4vY29udHJhc3QnKVxuY29uc3Qge2ZufSAgPSB3aW5kb3cubWl0bSBcbmZuLmdldENvbG9yID0gZ2V0Q29sb3JcbmZuLmNvbnRyYXN0ID0gY29udHJhc3RcbmNvbnN0IHdjYWcyID0gW1xuICAnd2NhZzJhJyxcbiAgJ3djYWcyYWEnLFxuICAnd2NhZzIxYScsXG4gICd3Y2FnMjFhYScsXG5dXG5jb25zdCB3Y2FnMyA9IFtcbiAgLy8gLi4ud2NhZzIsXG4gICd3Y2FnMmFhYScsXG4gICd3Y2FnMjFhYWEnLFxuICAnYmVzdC1wcmFjdGljZScsXG5dXG5jb25zdCBydWxlc09iaiA9IHtcbiAgJ2NvbG9yLWNvbnRyYXN0JzogeyBlbmFibGVkOiB0cnVlIH0sXG59XG5cbndpbmRvdy5taXRtLmxlZnQyYnV0dG9ucyA9IHtcbiAgJ3N0cmljdC1beXl5XXxsaWdodHNhbG1vbicoKSB7Zm4uYXhlcnVuKHdjYWczLCBydWxlc09iail9LFxuICAnd2NhZzpBQVt5eS1dfGxpZ2h0c2FsbW9uJygpIHtmbi5heGVydW4od2NhZzIpfSxcbiAgJ2ExMXktLS1beS0tXXxsaWdodHNhbG1vbicoKSB7Zm4uYXhlcnVuKCAgICAgKX0sXG4gICdjbGVhci0tW2MtLV18bGlnaHRzYWxtb24nKCkge2NsZWFyQXhlcyggICAgICl9LFxufVxuXG4vL2h0dHBzOi8vZ2l0aHViLmNvbS9kZXF1ZWxhYnMvYXhlLWNvcmUvYmxvYi9kZXZlbG9wL2RvYy9BUEkubWQjZ2V0dGluZy1zdGFydGVkXG53aW5kb3cubWl0bS5mbi5heGVydW4gPSAodmFsdWVzLCBydWxlcykgPT4geyAvLyMgYTExeVxuICBjb25zb2xlLmxvZygnYTExeS9heGUtcnVuIScpXG4gIGNvbnN0IHtfX2FyZ3N9ID0gd2luZG93Lm1pdG1cbiAgY29uc3QgcG9wdXAgPSBjbGVhckF4ZXMoKVxuICBjb25zdCB0eXBlICA9ICd0YWcnXG4gIGNvbnN0IHJ1bk9wdD0ge31cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVzKSkge1xuICAgIHJ1bk9wdC5ydW5Pbmx5PSB7dHlwZSx2YWx1ZXN9XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShfX2FyZ3MuYTExeSkpIHtcbiAgICBydW5PcHQucnVuT25seT0ge3R5cGUsdmFsdWVzOl9fYXJncy5hMTF5fVxuICB9XG4gIGlmIChydWxlcykge1xuICAgIHJ1bk9wdC5ydWxlcyA9IHJ1bGVzXG4gIH1cbiAgLy8gcnVuT3B0LmV4Y2x1ZGUgPSBbWycubWl0bS1idG4nXV1cbiAgY29uc29sZS5sb2cocnVuT3B0KVxuICB3aW5kb3cuYXhlXG4gIC5ydW4ocnVuT3B0KVxuICAudGhlbihyZXN1bHRzID0+IHtcbiAgICBpZiAocmVzdWx0cy52aW9sYXRpb25zLmxlbmd0aCkge1xuICAgICAgd2luZG93Lm1pdG0uYXhlcnVuLnJlc3VsdHMgPSByZXN1bHRzXG4gICAgICB2aW9sYXRpb25IaWxpZ2h0KHBvcHVwKVxuICAgICAgY29uc29sZS5lcnJvcignQWNjZXNzaWJpbGl0eSBpc3N1ZXMgZm91bmQnKVxuICAgIH1cbiAgfSlcbiAgLmNhdGNoKGVyciA9PiB7XG4gICAgd2luZG93Lm1pdG0uYXhlcnVuLmVyciA9IGVyclxuICAgIGNvbnNvbGUuZXJyb3IoJ1NvbWV0aGluZyBiYWQgaGFwcGVuZWQ6JywgZXJyKVxuICB9KVxufVxuXG5mdW5jdGlvbiBjbGVhckF4ZXMoKSB7XG4gIGNvbnN0IHBvcHVwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1pdG0tY29udGFpbmVyLnBvcHVwJylcbiAgcG9wdXAuaW5uZXJUZXh0ID0gJydcbiAgcmV0dXJuIHBvcHVwXG59XG4iXSwibmFtZXMiOlsicmVxdWlyZSQkMCIsInJlcXVpcmUkJDEiLCJ2aW9sYXRpb25IaWxpZ2h0IiwiZ2V0Q29sb3IiLCJjb250cmFzdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7RUFBQTtFQUNBLE1BQU0sWUFBWSxHQUFHO0VBQ3JCLEVBQUUsT0FBTyxFQUFFLGdDQUFnQztFQUMzQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQixPQUFPLElBQUksQ0FBQyxnQ0FBZ0MsT0FBTztFQUNoRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxzQ0FBc0MsQ0FB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
