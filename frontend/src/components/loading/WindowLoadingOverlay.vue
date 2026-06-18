<script setup lang="ts">
defineProps<{
  text: string;
  textKey: number;
}>();
</script>

<template>
  <div class="window-loading-overlay" aria-live="polite" aria-busy="true">
    <div class="window-loading-overlay__panel">
      <span class="window-loading-overlay__spinner" aria-hidden="true"></span>
      <Transition name="window-loading-overlay__text" mode="out-in">
        <p :key="textKey" class="window-loading-overlay__message">{{ text }}</p>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.window-loading-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--color-window-bg) 72%, transparent);
  backdrop-filter: blur(12px) saturate(140%);
  pointer-events: auto;
}

.window-loading-overlay__panel {
  display: grid;
  justify-items: center;
  gap: 12px;
  max-width: min(320px, 100%);
  padding: 18px 22px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  background: var(--color-panel-strong-bg);
  box-shadow: var(--shadow-panel);
  text-align: center;
}

.window-loading-overlay__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: window-loading-overlay-spin 0.8s linear infinite;
}

.window-loading-overlay__message {
  min-height: 20px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.window-loading-overlay__text-enter-active,
.window-loading-overlay__text-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.window-loading-overlay__text-enter-from,
.window-loading-overlay__text-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@keyframes window-loading-overlay-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
