<script setup lang="ts">
withDefaults(defineProps<{ size?: number; message?: string }>(), { size: 120, message: '' })
const imageUrl = `${import.meta.env.BASE_URL}billy-mascot-transparent.png`
</script>
<template>
  <div class="billy-guide">
    <img :src="imageUrl" :style="{ width: `${size}px` }" alt="Billy, la mascotte Herbal Nexus" />
    <p v-if="message">{{ message }}</p>
  </div>
</template>
<style scoped>
.billy-guide {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}
img {
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
  max-width: 35vw;
}
p {
  margin: 0;
  padding: 16px 20px;
  border-radius: 22px 22px 22px 4px;
  background: #efe9ff;
  color: #574674;
  font-size: 19px;
  line-height: 1.5;
  max-width: 500px;
}
@media (max-width: 620px) {
  .billy-guide {
    gap: 10px;
  }
  p {
    font-size: 21px;
    padding: 12px;
  }
}
</style>
