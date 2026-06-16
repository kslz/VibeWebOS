<script setup lang="ts">
import { systemConfig } from '@/config/systemConfig';
</script>

<template>
  <main class="vibe-webos">
    <section class="vibe-webos__panel" aria-label="VibeWebOS placeholder">
      <p class="vibe-webos__eyebrow">{{ systemConfig.systemName }} MVP</p>
      <h1>欢迎来到 {{ systemConfig.systemName }}</h1>
      <p>{{ systemConfig.aboutText }}</p>
    </section>
  </main>
</template>

<style lang="scss">
:root {
  color: #111827;
  background: #e8f1ff;
  font-family:
    'Segoe UI',
    'Microsoft YaHei',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

.vibe-webos {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 18% 20%, rgba(99, 179, 237, 0.36), transparent 28%),
    linear-gradient(135deg, #f7fbff 0%, #dbeafe 46%, #eef2ff 100%);
}

.vibe-webos__panel {
  width: min(560px, 100%);
  padding: 32px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.16);
  text-align: center;
}

.vibe-webos__eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(32px, 6vw, 48px);
  line-height: 1.1;
}

p {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}
</style>
