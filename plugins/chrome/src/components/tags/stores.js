import { writable } from 'svelte/store'

export const tags = writable({
  filterUrl: true,
  __tag1: {},
  __tag2: {},
  __tag3: {},
  hidden: true,
  uniq: true
})
