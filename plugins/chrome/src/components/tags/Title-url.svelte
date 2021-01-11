<script>
export let item;

// function ctype() {
//   item.ctyp.length ? `[${item.ctyp.join(',')}]` : ''
// }
</script>

<div class="url {item.tags && item.tags.join(' ')}">
  * {item.url}
  <span>{`{${item.secs ? item.secs.join(' ') : ''}}`}</span>
  <span>{ item.ctyp.length ? `[${item.ctyp.join(',')}]` : ''}</span>
</div>

<style>
  .url {
    font-size: 12px;
    font-weight: 600;
    margin-left: 7px;
    color: chocolate;
    font-family: monospace;
  }
  .url._notag {
    color: cornflowerblue;
  }
  .url span {
    margin-left: -5px;
    font-family: system-ui;
    font-size: smaller;
    font-weight: 300;
  }
  </style>