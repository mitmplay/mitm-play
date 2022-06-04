// https://www.a11yproject.com/checklist/
const criterionMap = {
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
}
function criterion(tags) {
  for(const tag of tags) {
    if (criterionMap[tag]) {
      const {id, desc, link} = criterionMap[tag]
      return {
        name: `WCAG ${id}`,
        desc,
        link: `https://www.w3.org/WAI/WCAG21/${link}`,
      }
    }
  }
}

module.exports = criterion
