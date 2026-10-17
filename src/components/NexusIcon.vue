<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })
const paths: Record<string, string> = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  leaf: 'M19 4C8 3 3 7 5 14c2 7 12 6 14-10ZM5 19 15 9',
  pill: 'm9 4-5 5a6.36 6.36 0 0 0 9 9l5-5a6.36 6.36 0 0 0-9-9Zm-2 3 10 10',
  spark: 'm12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z',
  check: 'm5 12 4 4L19 6',
  chevron: 'm6 9 6 6 6-6',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  link: 'm10 13 4-4m-5 7-1 1a4.24 4.24 0 0 1-6-6l4-4a4.24 4.24 0 0 1 6 0m0 10a4.24 4.24 0 0 0 6 0l4-4a4.24 4.24 0 0 0-6-6l-1 1',
  book: 'M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2V4Z',
  info: 'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  scan: 'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M7 12h10',
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] ?? paths.spark" />
  </svg>
</template>
