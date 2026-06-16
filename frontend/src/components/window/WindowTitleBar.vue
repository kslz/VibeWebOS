<script setup lang="ts">
defineProps<{
  title: string;
}>();

defineEmits<{
  close: [];
  minimize: [];
}>();
</script>

<template>
  <header class="window-title-bar">
    <span class="window-title-bar__title">{{ title }}</span>
    <div class="window-title-bar__controls" aria-label="窗口控制">
      <button class="window-title-bar__button" type="button" aria-label="最小化" @click.stop="$emit('minimize')">
        <span aria-hidden="true">−</span>
      </button>
      <button
        class="window-title-bar__button window-title-bar__button--close"
        type="button"
        aria-label="关闭"
        @click.stop="$emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.window-title-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  height: 40px;
  padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  background: rgba(148, 163, 184, 0.1);
  user-select: none;
}

.window-title-bar__title {
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-title-bar__controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.window-title-bar__button {
  display: grid;
  width: 30px;
  height: 28px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--color-text-primary);
  background: transparent;
  font-size: 16px;
}

.window-title-bar__button:hover,
.window-title-bar__button:focus-visible {
  border-color: var(--color-border);
  background: rgba(148, 163, 184, 0.18);
  outline: none;
}

.window-title-bar__button--close:hover,
.window-title-bar__button--close:focus-visible {
  color: #ffffff;
  border-color: #dc2626;
  background: #dc2626;
}
</style>
