<script setup lang="ts">
import { ref, watch } from 'vue';

import { appSearch, LlmApiError } from '@/api/llmApi';
import SearchResultList from '@/apps/AppSearch/SearchResultList.vue';
import { useWindowStore } from '@/stores/windowStore';
import type { GeneratedAppCandidate } from '@/types/app';

const props = defineProps<{
  retryToken: number;
  windowId: string;
}>();

const windowStore = useWindowStore();
const query = ref('');
const lastSubmittedQuery = ref('');
const results = ref<GeneratedAppCandidate[]>([]);

async function submitSearch(nextQuery = query.value) {
  const trimmedQuery = nextQuery.trim();

  if (!trimmedQuery) {
    windowStore.failWindowOperation(props.windowId, '请输入应用需求后再搜索。');
    return;
  }

  lastSubmittedQuery.value = trimmedQuery;
  const requestId = windowStore.startWindowLoading(props.windowId);

  if (requestId === null) {
    return;
  }

  try {
    const response = await appSearch({ query: trimmedQuery });

    if (!windowStore.isWindowRequestCurrent(props.windowId, requestId)) {
      return;
    }

    results.value = response.results;
    windowStore.finishWindowLoading(props.windowId, requestId);
  } catch (error) {
    const message =
      error instanceof LlmApiError ? error.message : '应用搜索暂时不可用，请稍后重试。';

    windowStore.failWindowOperation(props.windowId, message, requestId);
  }
}

watch(
  () => props.retryToken,
  () => {
    if (lastSubmittedQuery.value) {
      void submitSearch(lastSubmittedQuery.value);
    }
  },
);
</script>

<template>
  <section class="app-search">
    <header class="app-search__header">
      <p class="app-search__eyebrow">应用搜索</p>
      <h2>描述你想要的应用</h2>
    </header>
    <form class="app-search__form" @submit.prevent="submitSearch()">
      <label class="app-search__label" for="app-search-query">应用需求</label>
      <div class="app-search__row">
        <input
          id="app-search-query"
          v-model="query"
          class="app-search__input"
          type="search"
          placeholder="例如：一个项目进度看板"
        />
        <button class="app-search__button" type="submit">搜索</button>
      </div>
    </form>
    <SearchResultList :results="results" />
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
