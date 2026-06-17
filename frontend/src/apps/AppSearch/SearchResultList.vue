<script setup lang="ts">
import type { GeneratedAppCandidate } from '@/types/app';

defineProps<{
  results: GeneratedAppCandidate[];
}>();

defineEmits<{
  select: [candidate: GeneratedAppCandidate];
}>();
</script>

<template>
  <section class="search-result-list" aria-label="应用搜索结果">
    <p v-if="results.length === 0" class="search-result-list__empty">
      输入需求后，这里会显示 2 到 3 个候选应用。
    </p>
    <ul v-else class="search-result-list__items">
      <li v-for="result in results" :key="result.id || result.name">
        <button class="search-result-list__item" type="button" @click="$emit('select', result)">
          <strong>{{ result.name }}</strong>
          <span>{{ result.description }}</span>
          <dl class="search-result-list__meta">
            <div class="search-result-list__meta-item">
              <dt>类型</dt>
              <dd>{{ result.appType }}</dd>
            </div>
            <div class="search-result-list__meta-item">
              <dt>风格</dt>
              <dd>{{ result.styleHint }}</dd>
            </div>
          </dl>
        </button>
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
  width: 100%;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: inherit;
  text-align: left;
  background: var(--color-panel-bg);
  cursor: pointer;
}

.search-result-list__item:hover,
.search-result-list__item:focus-visible {
  border-color: var(--color-accent);
  outline: none;
}

.search-result-list__item strong {
  color: var(--color-text-primary);
}

.search-result-list__item span {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.search-result-list__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 0;
}

.search-result-list__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
}

.search-result-list__meta dt,
.search-result-list__meta dd {
  margin: 0;
  font-size: 12px;
}

.search-result-list__meta dt {
  color: var(--color-text-secondary);
}

.search-result-list__meta dd {
  color: var(--color-text-primary);
  font-weight: 600;
}
</style>
