<script setup lang="ts">
defineProps<{
  maximized: boolean;
  title: string;
}>();

defineEmits<{
  close: [];
  maximize: [];
  minimize: [];
  startDrag: [event: PointerEvent];
}>();
</script>

<template>
  <header
    class="window-title-bar"
    @dblclick="$emit('maximize')"
    @pointerdown="$emit('startDrag', $event)"
  >
    <span class="window-title-bar__title">{{ title }}</span>
    <div class="window-title-bar__controls" aria-label="窗口控制">
      <button class="window-title-bar__button" type="button" aria-label="最小化" @click.stop="$emit('minimize')">
        <span aria-hidden="true">−</span>
      </button>
      <button
        class="window-title-bar__button"
        type="button"
        :aria-label="maximized ? '还原' : '最大化'"
        @click.stop="$emit('maximize')"
      >
        <span aria-hidden="true">{{ maximized ? '❐' : '□' }}</span>
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
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent),
    color-mix(in srgb, var(--color-window-bg) 72%, var(--color-panel-bg));
  cursor: move;
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
  gap: 2px;
}

.window-title-bar__button {
  display: grid;
  width: 34px;
  height: 30px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--color-text-primary);
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}

.window-title-bar__button:hover,
.window-title-bar__button:focus-visible {
  border-color: var(--color-border);
  background: var(--color-hover-bg);
  outline: none;
}

.window-title-bar__button--close:hover,
.window-title-bar__button--close:focus-visible {
  color: #ffffff;
  border-color: #dc2626;
  background: #dc2626;
}
</style>
