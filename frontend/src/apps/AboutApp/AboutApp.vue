<script setup lang="ts">
import { systemConfig } from '@/config/systemConfig';
</script>

<template>
  <section class="about-app">
    <p class="about-app__eyebrow">关于系统</p>
    <h2>{{ systemConfig.systemName }}</h2>
    <p class="about-app__text">{{ systemConfig.aboutText }}</p>
  </section>
</template>

<style lang="scss" scoped>
.about-app {
  display: grid;
  align-content: center;
  min-height: 100%;
  gap: 12px;
  padding: 28px;
}

.about-app__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 700;
}

.about-app h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 28px;
}

.about-app__text {
  max-width: 620px;
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.8;
}
</style>
