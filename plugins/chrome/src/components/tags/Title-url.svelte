<script>
export let item;

const list = (itm, gap=' ') => itm ? itm.join(gap) : ''
</script>

<div class="url {item.tags && item.tags.join(' ')}">
  * {item.url}
  <span class="secs {list(item.secs)}">{`{${list(item.secs)}}`}</span>
  <span class="ctyp {list(item.ctyp)}">{ item.ctyp ? `[${list(item.secs,',')}]` : ''}</span>
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
  .url span.image {
    display: inline;
  }
  </style>