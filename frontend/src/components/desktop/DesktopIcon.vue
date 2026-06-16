<script setup lang="ts">
import type { BuiltInAppId } from '@/types/app';

defineProps<{
  id: BuiltInAppId;
  title: string;
  description: string;
  iconSymbol: string;
}>();

defineEmits<{
  open: [appId: BuiltInAppId];
}>();
</script>

<template>
  <button class="desktop-icon" type="button" @dblclick="$emit('open', id)" @click="$emit('open', id)">
    <span class="desktop-icon__tile" aria-hidden="true">{{ iconSymbol }}</span>
    <span class="desktop-icon__title">{{ title }}</span>
  </button>
</template>

<style lang="scss" scoped>
.desktop-icon {
  display: grid;
  width: 86px;
  min-height: 92px;
  align-content: start;
  justify-items: center;
  gap: 8px;
  padding: 8px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #ffffff;
  background: transparent;
  text-shadow: 0 1px 4px rgba(15, 23, 42, 0.38);
}

.desktop-icon:hover,
.desktop-icon:focus-visible {
  border-color: rgba(255, 255, 255, 0.36);
  background: rgba(255, 255, 255, 0.16);
  outline: none;
}

.desktop-icon__tile {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.08)),
    var(--color-accent);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);
  font-size: 20px;
  font-weight: 700;
}

.desktop-icon__title {
  max-width: 76px;
  color: #ffffff;
  font-size: 13px;
  line-height: 1.25;
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
