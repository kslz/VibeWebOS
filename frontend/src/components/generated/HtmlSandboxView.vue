<script setup lang="ts">
defineProps<{
  html: string;
  title: string;
}>();
</script>

<template>
  <iframe
    class="html-sandbox-view"
    :srcdoc="html"
    :title="title"
    sandbox="allow-forms allow-scripts"
  />
</template>

<style lang="scss" scoped>
.html-sandbox-view {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #ffffff;
}
</style>
