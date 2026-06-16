<script setup lang="ts">
import SearchResultList from '@/apps/AppSearch/SearchResultList.vue';
</script>

<template>
  <section class="app-search">
    <header class="app-search__header">
      <p class="app-search__eyebrow">应用搜索</p>
      <h2>描述你想要的应用</h2>
    </header>
    <form class="app-search__form" @submit.prevent>
      <label class="app-search__label" for="app-search-query">应用需求</label>
      <div class="app-search__row">
        <input
          id="app-search-query"
          class="app-search__input"
          type="search"
          placeholder="例如：一个项目进度看板"
        />
        <button class="app-search__button" type="submit">搜索</button>
      </div>
    </form>
    <SearchResultList />
  </section>
</template>

<style lang="scss" scoped>
.app-search {
  display: grid;
  gap: 18px;
  padding: 24px;
}

.app-search__header {
  display: grid;
  gap: 6px;
}

.app-search__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 700;
}

.app-search h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
}

.app-search__form {
  display: grid;
  gap: 8px;
}

.app-search__label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.app-search__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.app-search__input {
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  background: var(--color-panel-bg);
}

.app-search__button {
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  color: #ffffff;
  background: var(--color-accent);
}
</style>
