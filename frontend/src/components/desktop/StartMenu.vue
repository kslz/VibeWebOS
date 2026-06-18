<script setup lang="ts">
import type { BuiltInAppDefinition, BuiltInAppId } from '@/types/app';

defineProps<{
  apps: Array<BuiltInAppDefinition & { iconSymbol: string }>;
}>();

defineEmits<{
  open: [appId: BuiltInAppId];
}>();
</script>

<template>
  <section class="start-menu" aria-label="开始菜单">
    <div class="start-menu__header">
      <span class="start-menu__title">开始</span>
      <span class="start-menu__subtitle">固定应用</span>
    </div>
    <div class="start-menu__apps">
      <button
        v-for="app in apps"
        :key="app.id"
        class="start-menu__app"
        type="button"
        @click="$emit('open', app.id)"
      >
        <span class="start-menu__icon" aria-hidden="true">{{ app.iconSymbol }}</span>
        <span class="start-menu__copy">
          <span class="start-menu__app-title">{{ app.title }}</span>
          <span class="start-menu__app-description">{{ app.description }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.start-menu {
  position: absolute;
  right: 50%;
  bottom: 66px;
  width: min(430px, calc(100vw - 32px));
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-bg);
  box-shadow: var(--shadow-panel);
  transform: translateX(50%);
  backdrop-filter: blur(26px) saturate(150%);
}

.start-menu__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.start-menu__title {
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 700;
}

.start-menu__subtitle {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.start-menu__apps {
  display: grid;
  gap: 8px;
}

.start-menu__app {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--color-text-primary);
  background: transparent;
  text-align: left;
}

.start-menu__app:hover,
.start-menu__app:focus-visible {
  border-color: var(--color-border);
  background: var(--color-hover-bg);
  outline: none;
}

.start-menu__icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 58%, transparent);
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.04)),
    var(--color-accent);
  font-weight: 700;
}

.start-menu__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.start-menu__app-title {
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.start-menu__app-description {
  color: var(--color-text-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
