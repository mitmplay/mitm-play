<script>
  export let node;
  const rect = node.getBoundingClientRect()
  const {x,y}= document.body.getBoundingClientRect()
  const {top:t, left:l, height:h} = rect
  const top  = -y + t + h + 2
  const left = -x + l
  let {
    description,
    incomplete,
    criterion,
    helpUrl,
    impact,
    html,
    all,
    any,
    help,
    tgs,
    grp,
    el,
  } = node._axe_

  function reformat(arr) {
    const rgx = /([\d.#:]+)( |\w+)/g
    return arr.map(item=>{
      let x1 = item.message
      const x2 = x1.match(rgx)
      x1 = x1.replace(/</g,'&lt;').replace(/>/g,'&gt;')
      x2 && x2.filter(x=>x.length>2).forEach(element => {
        x1 = x1.replace(element, `<b>${element}</b>`)
      })
      return x1
    })
  }
  all = reformat(all)
  any = reformat(any)

  let style
  if (grp.match(/page-/)) {
    style = `top:${top}px;left:0;right:0;margin:auto;`
  } else {
    style = `top:${top}px;left:${left}px;`
  }

  function ratio() {
    const {
      contrastRatio,
      expectedContrastRatio,
    } = node._axe_.any[0].data
    if (contrastRatio) {
      return `
      , contrast ratio: ${contrastRatio},
      expected: ${expectedContrastRatio}.`
    } else {
      const {getColor, contrast} = window.mitm.fn
      const ratio = contrast(...getColor(el))
      return `. Contrast ratio: ${ratio}.`
    }
  }

  setTimeout(() => {
    hljs.highlightAll()
  }, 0);
</script>

<div class="a11y-popup" {style}>
  <h4>{help}</h4>
  <p>{description}</p>
  <p class=tgs><b>tags:</b> {tgs}</p>
  <p>
    <b>criteria:</b>
    {#if criterion}
      <a href="{criterion.link}">{criterion.name}</a>, 
    {/if}
    <a href="{helpUrl}">{grp}</a>
  </p>
  <details open>
    <summary><b>impact:</b> {impact}</summary>
    {#if all.length||any.length}
      <hr/>
      <div class=pre>
        {#if all.length>1}
          <b>Fix ALL of the following:</b>
          <ol>
          {#each all as cat}
            <li>{@html cat}</li>
          {/each}
          </ol>
        {:else if all.length===1}
          {@html all[0]}
        {:else if any.length>1}
          <b>Fix ONE of the following:</b>
          <ol>
          {#each any as cat}
            <li>{@html cat}</li>
          {/each}
          </ol>
        {:else if any.length===1}
          {@html any[0]}
        {/if}
        {#if incomplete && grp==='color-contrast'}
          {ratio()}
        {/if}
      </div>
      <hr/>
    {/if}
    <div class=pre>
      <pre><code class="language-html">{html}</code></pre>
    </div>
  </details>
</div>

<style>
.a11y-popup {
  background-color: rgba(255, 228, 196, 0.65);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  position: absolute;
  margin-top: 2px;
  padding: 0 10px;
  height: auto;
  width: 360px;
  box-shadow: 
    rgb(0 0 0 / 25%) 0px  54px 55px, 
    rgb(0 0 0 / 12%) 0px -12px 30px, 
    rgb(0 0 0 / 12%) 0px   4px  6px, 
    rgb(0 0 0 / 17%) 0px  12px 13px, 
    rgb(0 0 0 /  9%) 0px  -3px  5px;
}
h4 {
  margin: 10px 0;
  font-size: 12px;
  font-weight: 700;
}
p {
  margin: 0.2rem 0;
  font-size: 12px;
}
details {
  margin-bottom: 8px;
}
details summary {
  cursor: pointer;
}
.tgs {
  font-family: serif;
  text-align: inherit;
}
.pre {
  font-size: 11.5px;
}
.pre ol {
  margin: 0;
  padding-inline-start: 15px;
}
pre {
  font-family: ui-monospace, monospace;
  white-space: break-spaces;
  font-size: 11px;
  margin: 0;
}
pre code {
  padding: 5px;
}
</style>
