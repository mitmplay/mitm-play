import { writable } from 'svelte/store'

export const list = writable({
  routel: {},
  routez: []
})

export const tags = writable({
  filterUrl: true,
  __tag1: {},
  __tag2: {},
  __tag3: {},
  route: '',
  check: false,
  list: false,
  uniq: false,
  mth: false
})

export const eurls = writable({
  expanded: false
})
