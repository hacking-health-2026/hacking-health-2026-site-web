<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 40 })
</script>
<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
    <path
      d="M50 7c14-17 35 1 26 18 22-4 31 22 11 31 19 12 5 35-15 28-2 22-30 22-34 3-19 12-38-9-24-25C-8 54 1 29 22 32 12 12 35-1 50 7Z"
    />
    <circle cx="50" cy="50" r="13" fill="var(--flower-center, #fff)" />
  </svg>
</template>
