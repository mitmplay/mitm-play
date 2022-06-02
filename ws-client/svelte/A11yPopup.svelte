<script>
  export let node;
  const rect = node.getBoundingClientRect()
  const {top: t, left: l, height: h} = rect
  const {x,y} = document.body.getBoundingClientRect()
  const top   = -y + t + h + 2
  const left  = -x + l
  const style = `top:${top}px;left:${left}px;`
  const {
    failureSummary,
    description,
    helpUrl,
    target,
    impact,
    html,
    help,
    tgs,
    grp
  } = node._axe_
  let note  = failureSummary
  const rst = note.match(/([\d.#:]+)( |\w+)/g)
  rst && rst.filter(x=>x.length>2).forEach(element => {
    note = note.replace(element, `<b>${element}</b>`)  
  });
  setTimeout(() => {
    hljs.highlightAll()
  }, 0);
</script>

<div 
class="a11y-popup" {style}>
  <h4>{help}</h4>
  <p>{description}</p>
  <p><b>tags:</b> {tgs}</p>
  <p><b>link:</b> <a href="{helpUrl}">{grp}</a></p>
  <details>
    <summary><b>impact:</b> {impact}</summary>
    <hr/>
    <div class=pre>{@html note}</div>
    <hr/>
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
  width: 300px;
  box-shadow: 
    rgb(0 0 0 / 25%) 0px  54px 55px, 
    rgb(0 0 0 / 12%) 0px -12px 30px, 
    rgb(0 0 0 / 12%) 0px   4px  6px, 
    rgb(0 0 0 / 17%) 0px  12px 13px, 
    rgb(0 0 0 /  9%) 0px  -3px  5px;
}
h4 {
  margin: 10px 0;
}
p {
  margin: 0.2rem 0;
}
details {
  margin-bottom: 8px;
}
details summary {
  cursor: pointer;
}
.pre {
  font-size: 11.5px;
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
