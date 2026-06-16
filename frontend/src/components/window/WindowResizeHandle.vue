<script setup lang="ts">
import type { WindowResizeDirection } from '@/types/window';

defineProps<{
  direction: WindowResizeDirection;
}>();

defineEmits<{
  startResize: [direction: WindowResizeDirection, event: PointerEvent];
}>();
</script>

<template>
  <span
    class="window-resize-handle"
    :class="`window-resize-handle--${direction}`"
    aria-hidden="true"
    @pointerdown.stop.prevent="$emit('startResize', direction, $event)"
  />
</template>

<style lang="scss" scoped>
.window-resize-handle {
  position: absolute;
  z-index: 2;
}

.window-resize-handle--n,
.window-resize-handle--s {
  right: 10px;
  left: 10px;
  height: 8px;
  cursor: ns-resize;
}

.window-resize-handle--n {
  top: -4px;
}

.window-resize-handle--s {
  bottom: -4px;
}

.window-resize-handle--e,
.window-resize-handle--w {
  top: 10px;
  bottom: 10px;
  width: 8px;
  cursor: ew-resize;
}

.window-resize-handle--e {
  right: -4px;
}

.window-resize-handle--w {
  left: -4px;
}

.window-resize-handle--ne,
.window-resize-handle--nw,
.window-resize-handle--se,
.window-resize-handle--sw {
  width: 14px;
  height: 14px;
}

.window-resize-handle--ne {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.window-resize-handle--nw {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.window-resize-handle--se {
  right: -5px;
  bottom: -5px;
  cursor: nwse-resize;
}

.window-resize-handle--sw {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}
</style>
