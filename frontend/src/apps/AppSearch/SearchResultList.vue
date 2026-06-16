<script setup lang="ts">
import type { GeneratedAppCandidate } from '@/types/app';

defineProps<{
  results: GeneratedAppCandidate[];
}>();
</script>

<template>
  <section class="search-result-list" aria-label="应用搜索结果">
    <p v-if="results.length === 0" class="search-result-list__empty">
      输入需求后，这里会显示 2 到 3 个候选应用。
    </p>
    <ul v-else class="search-result-list__items">
      <li v-for="result in results" :key="result.id || result.name" class="search-result-list__item">
        <strong>{{ result.name }}</strong>
        <span>{{ result.description }}</span>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.search-result-list {
  display: grid;
  min-height: 180px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
}

.search-result-list__empty {
  align-self: center;
  justify-self: center;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.search-result-list__items {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 12px;
  list-style: none;
}

.search-result-list__item {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-bg);
}

.search-result-list__item strong {
  color: var(--color-text-primary);
}

.search-result-list__item span {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
</style>
