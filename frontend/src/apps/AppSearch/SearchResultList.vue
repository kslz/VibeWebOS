<template>
  <section class="search-result-list" aria-label="应用搜索结果">
    <p class="search-result-list__empty">输入需求后，这里会显示 2 到 3 个候选应用。</p>
  </section>
</template>

<style lang="scss" scoped>
.search-result-list {
  display: grid;
  min-height: 180px;
  place-items: center;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
}

.search-result-list__empty {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
