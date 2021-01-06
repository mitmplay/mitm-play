import { writable } from 'svelte/store'

export const rerender = writable({
  toggle: true,
})
